-- Update free plan to 5 prompts per month
UPDATE subscription_plans
SET limits = jsonb_set(limits, '{prompts_per_month}', '5')
WHERE plan_type = 'free';

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update check_usage_limit function to handle admin unlimited access
CREATE OR REPLACE FUNCTION public.check_usage_limit(_user_id uuid, _resource_type text, _period_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_usage_count INTEGER;
  v_limit INTEGER;
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  v_is_admin := public.has_role(_user_id, 'admin');
  
  -- Admins have unlimited access
  IF v_is_admin THEN
    RETURN jsonb_build_object(
      'limit', -1,
      'used', 0,
      'remaining', -1,
      'has_access', true,
      'is_admin', true
    );
  END IF;
  
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
    'has_access', v_limit = -1 OR v_usage_count < v_limit,
    'is_admin', false
  );
END;
$$;