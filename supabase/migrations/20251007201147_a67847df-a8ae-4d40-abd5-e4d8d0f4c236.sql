-- Create prompt versions table (Git-like version control)
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  prompt_text TEXT NOT NULL,
  changelog TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_production BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(prompt_id, version_number)
);

-- Create prompt deployments table
CREATE TABLE IF NOT EXISTS public.prompt_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version_id UUID NOT NULL REFERENCES public.prompt_versions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  environment TEXT NOT NULL DEFAULT 'production', -- staging, production, development
  deployed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, rollback
  deployment_notes TEXT,
  rollback_reason TEXT
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.prompt_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- create, update, delete, deploy, rollback, execute
  resource_type TEXT NOT NULL, -- prompt, agent, workflow
  resource_id UUID NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create compliance violations table
CREATE TABLE IF NOT EXISTS public.compliance_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL,
  violation_type TEXT NOT NULL, -- content_policy, data_privacy, brand_safety, toxicity
  severity TEXT NOT NULL, -- low, medium, high, critical
  description TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  auto_detected BOOLEAN DEFAULT true
);

-- Create monitoring metrics table
CREATE TABLE IF NOT EXISTS public.prompt_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL,
  execution_time_ms INTEGER,
  tokens_used INTEGER,
  cost NUMERIC(10,4),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_versions
CREATE POLICY "Users can view versions of their prompts"
ON public.prompt_versions
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can create versions"
ON public.prompt_versions
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- RLS Policies for prompt_deployments
CREATE POLICY "Team members can view deployments"
ON public.prompt_deployments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = prompt_deployments.team_id
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Team owners can manage deployments"
ON public.prompt_deployments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = prompt_deployments.team_id
    AND teams.owner_id = auth.uid()
  )
);

-- RLS Policies for audit_logs
CREATE POLICY "Users can view their own audit logs"
ON public.prompt_audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Team owners can view team audit logs"
ON public.prompt_audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = prompt_audit_logs.team_id
    AND teams.owner_id = auth.uid()
  )
);

CREATE POLICY "System can insert audit logs"
ON public.prompt_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for compliance_violations
CREATE POLICY "Team members can view violations"
ON public.compliance_violations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can create violations"
ON public.compliance_violations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authorized users can resolve violations"
ON public.compliance_violations
FOR UPDATE
TO authenticated
USING (resolved_by = auth.uid() OR resolved_by IS NULL);

-- RLS Policies for prompt_metrics
CREATE POLICY "Users can view their metrics"
ON public.prompt_metrics
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Team owners can view team metrics"
ON public.prompt_metrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = prompt_metrics.team_id
    AND teams.owner_id = auth.uid()
  )
);

CREATE POLICY "System can insert metrics"
ON public.prompt_metrics
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt ON public.prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created ON public.prompt_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_deployments_team ON public.prompt_deployments(team_id);
CREATE INDEX IF NOT EXISTS idx_prompt_deployments_status ON public.prompt_deployments(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.prompt_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_team ON public.prompt_audit_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.prompt_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_severity ON public.compliance_violations(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_unresolved ON public.compliance_violations(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_prompt_metrics_prompt ON public.prompt_metrics(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_metrics_team ON public.prompt_metrics(team_id);
CREATE INDEX IF NOT EXISTS idx_prompt_metrics_executed ON public.prompt_metrics(executed_at DESC);

-- Function to automatically create audit log
CREATE OR REPLACE FUNCTION public.create_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO prompt_audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers for audit logging
CREATE TRIGGER audit_prompt_versions
AFTER INSERT OR UPDATE OR DELETE ON public.prompt_versions
FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

CREATE TRIGGER audit_prompt_deployments
AFTER INSERT OR UPDATE OR DELETE ON public.prompt_deployments
FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();