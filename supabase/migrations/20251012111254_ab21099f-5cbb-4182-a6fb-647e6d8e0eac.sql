-- Phase 3: Automation & Intelligence Tables (Create only missing tables)

-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- A/B test experiments with statistical tracking (enhanced version)
CREATE TABLE IF NOT EXISTS public.ab_test_experiments (
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
CREATE TABLE IF NOT EXISTS public.compliance_monitoring (
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
CREATE TABLE IF NOT EXISTS public.predictive_alerts (
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
CREATE INDEX IF NOT EXISTS idx_ab_test_experiments_user_status ON public.ab_test_experiments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_compliance_monitoring_user_status ON public.compliance_monitoring(user_id, status);
CREATE INDEX IF NOT EXISTS idx_compliance_monitoring_severity ON public.compliance_monitoring(severity);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_user_read ON public.predictive_alerts(user_id, is_read, is_dismissed);

-- RLS Policies
ALTER TABLE public.ab_test_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_alerts ENABLE ROW LEVEL SECURITY;

-- A/B test experiments policies
DROP POLICY IF EXISTS "Users can manage their own experiments" ON public.ab_test_experiments;
CREATE POLICY "Users can manage their own experiments"
  ON public.ab_test_experiments FOR ALL
  USING (auth.uid() = user_id);

-- Compliance monitoring policies
DROP POLICY IF EXISTS "Users can view their own compliance issues" ON public.compliance_monitoring;
CREATE POLICY "Users can view their own compliance issues"
  ON public.compliance_monitoring FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create compliance monitoring records" ON public.compliance_monitoring;
CREATE POLICY "System can create compliance monitoring records"
  ON public.compliance_monitoring FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own compliance issues" ON public.compliance_monitoring;
CREATE POLICY "Users can update their own compliance issues"
  ON public.compliance_monitoring FOR UPDATE
  USING (auth.uid() = user_id);

-- Predictive alerts policies
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.predictive_alerts;
CREATE POLICY "Users can view their own alerts"
  ON public.predictive_alerts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own alerts" ON public.predictive_alerts;
CREATE POLICY "Users can update their own alerts"
  ON public.predictive_alerts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create alerts" ON public.predictive_alerts;
CREATE POLICY "System can create alerts"
  ON public.predictive_alerts FOR INSERT
  WITH CHECK (true);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_ab_test_experiments_updated_at ON public.ab_test_experiments;
CREATE TRIGGER update_ab_test_experiments_updated_at
  BEFORE UPDATE ON public.ab_test_experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();