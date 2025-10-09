-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'team', 'enterprise')),
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trialing')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create API keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  requests_count INTEGER DEFAULT 0,
  rate_limit_per_hour INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create usage tracking table
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('prompt_optimization', 'workflow_execution', 'api_call', 'compliance_check')),
  count INTEGER DEFAULT 1,
  metadata JSONB,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON public.user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for api_keys
CREATE POLICY "Users can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage"
  ON public.usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON public.usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_api_key ON public.api_keys(api_key);
CREATE INDEX idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON public.usage_tracking(period_start, period_end);

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (plan_name, plan_type, price_monthly, price_yearly, features, limits) VALUES
('Free', 'free', 0, 0, 
  '{"prompt_optimization": true, "basic_templates": true, "history": "7_days"}',
  '{"prompts_per_month": 10, "workflows": 0, "team_members": 1, "api_calls": 0}'
),
('Pro', 'pro', 29, 290,
  '{"prompt_optimization": true, "advanced_workflows": true, "all_templates": true, "compliance_checks": true, "priority_support": true, "history": "unlimited"}',
  '{"prompts_per_month": 500, "workflows": 10, "team_members": 1, "api_calls": 1000}'
),
('Team', 'team', 99, 990,
  '{"prompt_optimization": true, "advanced_workflows": true, "all_templates": true, "compliance_checks": true, "team_collaboration": true, "priority_support": true, "history": "unlimited", "custom_templates": true}',
  '{"prompts_per_month": 2000, "workflows": 50, "team_members": 10, "api_calls": 5000}'
),
('Enterprise', 'enterprise', 499, 4990,
  '{"prompt_optimization": true, "advanced_workflows": true, "all_templates": true, "compliance_checks": true, "team_collaboration": true, "dedicated_support": true, "history": "unlimited", "custom_templates": true, "sso": true, "custom_integrations": true, "sla": true}',
  '{"prompts_per_month": -1, "workflows": -1, "team_members": -1, "api_calls": -1}'
);

-- Function to check user plan limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  _user_id UUID,
  _resource_type TEXT,
  _period_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_usage_count INTEGER;
  v_limit INTEGER;
  v_period_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user's subscription and plan
  SELECT us.*, sp.limits
  INTO v_subscription
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id AND us.status = 'active'
  LIMIT 1;
  
  -- If no subscription, assume free plan
  IF v_subscription IS NULL THEN
    SELECT limits INTO v_subscription
    FROM subscription_plans
    WHERE plan_type = 'free'
    LIMIT 1;
  END IF;
  
  -- Get the limit for this resource type
  v_limit := (v_subscription.limits->>'prompts_per_month')::INTEGER;
  
  -- Calculate period start
  v_period_start := now() - (_period_days || ' days')::INTERVAL;
  
  -- Get current usage
  SELECT COALESCE(SUM(count), 0)
  INTO v_usage_count
  FROM usage_tracking
  WHERE user_id = _user_id
    AND resource_type = _resource_type
    AND period_start >= v_period_start;
  
  -- Return usage info
  RETURN jsonb_build_object(
    'limit', v_limit,
    'used', v_usage_count,
    'remaining', CASE WHEN v_limit = -1 THEN -1 ELSE GREATEST(0, v_limit - v_usage_count) END,
    'has_access', v_limit = -1 OR v_usage_count < v_limit
  );
END;
$$;