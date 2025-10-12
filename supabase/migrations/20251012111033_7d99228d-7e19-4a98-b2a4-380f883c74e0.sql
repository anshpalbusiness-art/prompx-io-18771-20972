-- Phase 3: Automation & Intelligence Tables

-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Auto-optimization jobs tracking
CREATE TABLE public.auto_optimization_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prompt_id UUID REFERENCES public.prompt_history(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  trigger_reason TEXT NOT NULL, -- 'scheduled', 'performance_drop', 'manual'
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT,
  improvement_score NUMERIC,
  optimization_insights JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- A/B test experiments with statistical tracking
CREATE TABLE public.ab_test_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  description TEXT,
  control_variant TEXT NOT NULL,
  treatment_variant TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  sample_size INTEGER DEFAULT 0,
  control_conversions INTEGER DEFAULT 0,
  treatment_conversions INTEGER DEFAULT 0,
  statistical_significance NUMERIC,
  confidence_level NUMERIC DEFAULT 0.95,
  winner TEXT, -- 'control', 'treatment', 'inconclusive'
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  auto_declare_winner BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Compliance monitoring and alerts
CREATE TABLE public.compliance_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prompt_id UUID,
  agent_id UUID,
  compliance_type TEXT NOT NULL, -- 'bias', 'privacy', 'regulatory', 'toxicity'
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'reviewed', 'resolved', 'false_positive')),
  issue_description TEXT NOT NULL,
  detection_method TEXT, -- 'ai_scan', 'pattern_match', 'user_report'
  auto_remediation_applied BOOLEAN DEFAULT false,
  remediation_suggestion TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Predictive alerts for proactive monitoring
CREATE TABLE public.predictive_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'performance_drop', 'anomaly', 'opportunity', 'risk'
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  predicted_impact NUMERIC,
  confidence_score NUMERIC,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_auto_optimization_jobs_user_status ON public.auto_optimization_jobs(user_id, status);
CREATE INDEX idx_auto_optimization_jobs_created ON public.auto_optimization_jobs(created_at DESC);
CREATE INDEX idx_ab_test_experiments_user_status ON public.ab_test_experiments(user_id, status);
CREATE INDEX idx_compliance_monitoring_user_status ON public.compliance_monitoring(user_id, status);
CREATE INDEX idx_compliance_monitoring_severity ON public.compliance_monitoring(severity);
CREATE INDEX idx_predictive_alerts_user_read ON public.predictive_alerts(user_id, is_read, is_dismissed);

-- RLS Policies
ALTER TABLE public.auto_optimization_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_alerts ENABLE ROW LEVEL SECURITY;

-- Auto-optimization jobs policies
CREATE POLICY "Users can view their own optimization jobs"
  ON public.auto_optimization_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own optimization jobs"
  ON public.auto_optimization_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own optimization jobs"
  ON public.auto_optimization_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- A/B test experiments policies
CREATE POLICY "Users can manage their own experiments"
  ON public.ab_test_experiments FOR ALL
  USING (auth.uid() = user_id);

-- Compliance monitoring policies
CREATE POLICY "Users can view their own compliance issues"
  ON public.compliance_monitoring FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create compliance monitoring records"
  ON public.compliance_monitoring FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own compliance issues"
  ON public.compliance_monitoring FOR UPDATE
  USING (auth.uid() = user_id);

-- Predictive alerts policies
CREATE POLICY "Users can view their own alerts"
  ON public.predictive_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.predictive_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create alerts"
  ON public.predictive_alerts FOR INSERT
  WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_ab_test_experiments_updated_at
  BEFORE UPDATE ON public.ab_test_experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();