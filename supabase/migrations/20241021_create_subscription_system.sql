-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_name VARCHAR(50) NOT NULL UNIQUE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('free', 'pro', 'premium', 'enterprise')),
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('free', 'pro', 'premium', 'enterprise')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) DEFAULT 'active',
    billing_cycle VARCHAR(10) CHECK (billing_cycle IN ('monthly', 'yearly')),
    amount DECIMAL(10,2),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, status) -- Only one active subscription per user
);

-- Create user usage tracking table
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    prompts_used INTEGER DEFAULT 0,
    api_calls_used INTEGER DEFAULT 0,
    workflows_created INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, plan_type, price_monthly, price_yearly, features, limits) VALUES
('Free', 'free', 0, 0, 
 '{"basic_templates": true, "community_support": true, "basic_analytics": true}',
 '{"prompts_per_month": 50, "workflows": 3, "team_members": 1, "api_calls": 0}'),
 
('Pro', 'pro', 29, 290,
 '{"advanced_templates": true, "priority_support": true, "team_collaboration": true, "api_access": true, "custom_workflows": true, "export_capabilities": true}',
 '{"prompts_per_month": -1, "workflows": -1, "team_members": 10, "api_calls": 10000}'),
 
('Premium', 'premium', 79, 790,
 '{"advanced_ai_models": true, "white_label": true, "dedicated_support": true, "custom_integrations": true, "advanced_compliance": true, "sla": true}',
 '{"prompts_per_month": -1, "workflows": -1, "team_members": -1, "api_calls": -1}'),
 
('Enterprise', 'enterprise', 199, 1990,
 '{"custom_deployment": true, "sso": true, "advanced_security": true, "dedicated_manager": true, "custom_training": true, "on_premise": true}',
 '{"prompts_per_month": -1, "workflows": -1, "team_members": -1, "api_calls": -1}')
ON CONFLICT (plan_name) DO NOTHING;

-- Create function to get user's current plan
CREATE OR REPLACE FUNCTION get_user_plan(user_uuid UUID)
RETURNS TABLE(plan_type VARCHAR, limits JSONB, features JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(us.plan_type, 'free'::VARCHAR) as plan_type,
        COALESCE(sp.limits, '{"prompts_per_month": 50, "workflows": 3, "team_members": 1, "api_calls": 0}'::JSONB) as limits,
        COALESCE(sp.features, '{"basic_templates": true, "community_support": true}'::JSONB) as features
    FROM auth.users u
    LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
    LEFT JOIN subscription_plans sp ON us.plan_type = sp.plan_type
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check feature access
CREATE OR REPLACE FUNCTION check_feature_access(user_uuid UUID, required_plan VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    user_plan VARCHAR;
    plan_hierarchy INTEGER;
BEGIN
    -- Get user's current plan
    SELECT COALESCE(us.plan_type, 'free') INTO user_plan
    FROM auth.users u
    LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
    WHERE u.id = user_uuid;
    
    -- Define plan hierarchy
    plan_hierarchy := CASE user_plan
        WHEN 'free' THEN 0
        WHEN 'pro' THEN 1
        WHEN 'premium' THEN 2
        WHEN 'enterprise' THEN 3
        ELSE 0
    END;
    
    -- Check if user has access
    RETURN plan_hierarchy >= CASE required_plan
        WHEN 'free' THEN 0
        WHEN 'pro' THEN 1
        WHEN 'premium' THEN 2
        WHEN 'enterprise' THEN 3
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track usage
CREATE OR REPLACE FUNCTION track_usage(user_uuid UUID, usage_type VARCHAR, amount INTEGER DEFAULT 1)
RETURNS VOID AS $$
DECLARE
    current_month VARCHAR(7);
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    INSERT INTO user_usage (user_id, month_year, prompts_used, api_calls_used, workflows_created)
    VALUES (user_uuid, current_month, 
            CASE WHEN usage_type = 'prompt' THEN amount ELSE 0 END,
            CASE WHEN usage_type = 'api_call' THEN amount ELSE 0 END,
            CASE WHEN usage_type = 'workflow' THEN amount ELSE 0 END)
    ON CONFLICT (user_id, month_year) 
    DO UPDATE SET
        prompts_used = user_usage.prompts_used + CASE WHEN usage_type = 'prompt' THEN amount ELSE 0 END,
        api_calls_used = user_usage.api_calls_used + CASE WHEN usage_type = 'api_call' THEN amount ELSE 0 END,
        workflows_created = user_usage.workflows_created + CASE WHEN usage_type = 'workflow' THEN amount ELSE 0 END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Subscription plans are viewable by everyone" ON subscription_plans FOR SELECT USING (true);

CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage" ON user_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own usage" ON user_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own usage" ON user_usage FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_month_year ON user_usage(month_year);
