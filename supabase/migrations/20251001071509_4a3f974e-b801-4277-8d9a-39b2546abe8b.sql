-- Create compliance rules table
CREATE TABLE IF NOT EXISTS public.compliance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'bias', 'security', 'legal', 'privacy'
  industry TEXT, -- 'finance', 'healthcare', 'legal', 'general'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  detection_pattern TEXT NOT NULL,
  remediation_guidance TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bias filters table
CREATE TABLE IF NOT EXISTS public.bias_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filter_name TEXT NOT NULL,
  bias_type TEXT NOT NULL, -- 'gender', 'racial', 'age', 'religious', 'political'
  keywords TEXT[] NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create legal prompt packs table
CREATE TABLE IF NOT EXISTS public.legal_prompt_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_name TEXT NOT NULL,
  industry TEXT NOT NULL, -- 'finance', 'healthcare', 'legal', 'government'
  compliance_standards TEXT[], -- ['SOC2', 'GDPR', 'HIPAA', 'CCPA']
  prompt_title TEXT NOT NULL,
  prompt_content TEXT NOT NULL,
  use_case TEXT NOT NULL,
  compliance_notes TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prompt compliance checks table
CREATE TABLE IF NOT EXISTS public.prompt_compliance_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt_text TEXT NOT NULL,
  check_results JSONB NOT NULL, -- {passed: boolean, violations: [], warnings: [], score: number}
  compliance_score INTEGER, -- 0-100
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bias_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_prompt_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_compliance_checks ENABLE ROW LEVEL SECURITY;

-- Compliance rules policies (read-only for all users)
CREATE POLICY "Everyone can view compliance rules"
ON public.compliance_rules FOR SELECT
USING (is_active = true);

-- Bias filters policies (read-only for all users)
CREATE POLICY "Everyone can view bias filters"
ON public.bias_filters FOR SELECT
USING (is_active = true);

-- Legal prompt packs policies
CREATE POLICY "Everyone can view verified legal prompts"
ON public.legal_prompt_packs FOR SELECT
USING (is_verified = true);

-- Compliance checks policies
CREATE POLICY "Users can view their own compliance checks"
ON public.prompt_compliance_checks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compliance checks"
ON public.prompt_compliance_checks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_compliance_rules_type ON public.compliance_rules(rule_type);
CREATE INDEX idx_compliance_rules_industry ON public.compliance_rules(industry);
CREATE INDEX idx_bias_filters_type ON public.bias_filters(bias_type);
CREATE INDEX idx_legal_packs_industry ON public.legal_prompt_packs(industry);
CREATE INDEX idx_compliance_checks_user ON public.prompt_compliance_checks(user_id);

-- Create update trigger for compliance rules
CREATE TRIGGER update_compliance_rules_updated_at
BEFORE UPDATE ON public.compliance_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create update trigger for legal prompt packs
CREATE TRIGGER update_legal_prompt_packs_updated_at
BEFORE UPDATE ON public.legal_prompt_packs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default compliance rules
INSERT INTO public.compliance_rules (rule_name, description, rule_type, industry, severity, detection_pattern, remediation_guidance) VALUES
  ('PII Protection', 'Detect personally identifiable information', 'privacy', 'general', 'high', 'SSN|social security|credit card|passport', 'Remove or mask PII before processing'),
  ('HIPAA Compliance', 'Healthcare data protection', 'legal', 'healthcare', 'critical', 'patient|medical record|diagnosis|treatment|PHI', 'Ensure HIPAA-compliant handling of health information'),
  ('Financial Data', 'Protect financial information', 'security', 'finance', 'high', 'account number|routing number|balance|transaction', 'Follow financial data security standards'),
  ('Gender Bias', 'Detect gender-biased language', 'bias', 'general', 'medium', 'he always|she always|men are|women are', 'Use gender-neutral language'),
  ('Age Discrimination', 'Detect age-biased language', 'bias', 'general', 'medium', 'too old|too young|millennial|boomer', 'Focus on skills and qualifications, not age');

-- Insert default bias filters
INSERT INTO public.bias_filters (filter_name, bias_type, keywords, severity) VALUES
  ('Gender Stereotypes', 'gender', ARRAY['bossy', 'aggressive', 'emotional', 'hysterical', 'shrill'], 'medium'),
  ('Racial Stereotypes', 'racial', ARRAY['thug', 'ghetto', 'exotic', 'articulate'], 'high'),
  ('Age Stereotypes', 'age', ARRAY['old-fashioned', 'out of touch', 'digital native', 'tech-savvy'], 'low'),
  ('Religious Bias', 'religious', ARRAY['infidel', 'heathen', 'cult'], 'high');

-- Insert sample legal prompt packs
INSERT INTO public.legal_prompt_packs (pack_name, industry, compliance_standards, prompt_title, prompt_content, use_case, compliance_notes, is_verified) VALUES
  ('Financial Analysis', 'finance', ARRAY['SOC2', 'GDPR'], 'Risk Assessment Report', 'Generate a comprehensive risk assessment report that analyzes market volatility, portfolio diversification, and regulatory compliance. Include quantitative metrics and qualitative analysis. Ensure all data is anonymized and aggregated.', 'Financial risk analysis for investment portfolios', 'No PII, uses aggregated data only', true),
  ('Healthcare Documentation', 'healthcare', ARRAY['HIPAA'], 'Clinical Summary', 'Create a clinical summary that documents patient visit, symptoms, diagnosis, and treatment plan. Use medical terminology and follow SOAP format. Do not include patient identifiers beyond case number.', 'Medical documentation for healthcare providers', 'HIPAA-compliant, no PHI in output', true),
  ('Legal Contract Review', 'legal', ARRAY['GDPR', 'CCPA'], 'Contract Analysis', 'Review the provided contract for key terms, obligations, risks, and compliance with data protection regulations. Highlight any clauses that may require legal review.', 'Contract analysis for legal teams', 'Focuses on compliance and risk identification', true),
  ('HR Compliance', 'general', ARRAY['GDPR', 'SOC2'], 'Job Description', 'Create an inclusive job description that focuses on required skills, qualifications, and responsibilities. Avoid age, gender, or other discriminatory language. Include diversity statement.', 'HR recruiting and job postings', 'Bias-free, compliance-focused language', true);