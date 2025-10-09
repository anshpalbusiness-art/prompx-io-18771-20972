-- Create analytics metrics table
CREATE TABLE IF NOT EXISTS public.analytics_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- 'time_saved', 'conversion_rate', 'engagement'
  metric_value DECIMAL(10, 2) NOT NULL,
  prompt_id UUID,
  workflow_id UUID,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Create A/B tests table
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  description TEXT,
  variant_a_prompt TEXT NOT NULL,
  variant_b_prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'paused'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create A/B test results table
CREATE TABLE IF NOT EXISTS public.ab_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  variant TEXT NOT NULL, -- 'a' or 'b'
  metric_name TEXT NOT NULL, -- 'clicks', 'conversions', 'engagement_time'
  metric_value DECIMAL(10, 2) NOT NULL,
  sample_size INTEGER NOT NULL DEFAULT 1,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user activity tracking table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'prompt_generated', 'workflow_executed', 'time_spent'
  duration_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Analytics metrics policies
CREATE POLICY "Users can view their own metrics"
ON public.analytics_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
ON public.analytics_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- A/B tests policies
CREATE POLICY "Users can view their own tests"
ON public.ab_tests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create tests"
ON public.ab_tests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tests"
ON public.ab_tests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tests"
ON public.ab_tests FOR DELETE
USING (auth.uid() = user_id);

-- A/B test results policies
CREATE POLICY "Users can view results for their tests"
ON public.ab_test_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ab_tests
    WHERE id = test_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert results for their tests"
ON public.ab_test_results FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ab_tests
    WHERE id = test_id AND user_id = auth.uid()
  )
);

-- User activity policies
CREATE POLICY "Users can view their own activity"
ON public.user_activity FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
ON public.user_activity FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_analytics_metrics_user_id ON public.analytics_metrics(user_id);
CREATE INDEX idx_analytics_metrics_type ON public.analytics_metrics(metric_type);
CREATE INDEX idx_ab_tests_user_id ON public.ab_tests(user_id);
CREATE INDEX idx_ab_test_results_test_id ON public.ab_test_results(test_id);
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_type ON public.user_activity(activity_type);