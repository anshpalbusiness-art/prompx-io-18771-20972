-- Create persona templates table for predefined personas
CREATE TABLE public.persona_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  avatar_icon TEXT NOT NULL,
  personality_traits JSONB NOT NULL DEFAULT '[]'::jsonb,
  communication_style TEXT NOT NULL,
  expertise_areas TEXT[] NOT NULL DEFAULT '{}',
  prompt_prefix TEXT NOT NULL,
  example_phrases TEXT[] NOT NULL DEFAULT '{}',
  color_theme TEXT NOT NULL DEFAULT 'blue',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user personas table for user-customized personas
CREATE TABLE public.user_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.persona_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  custom_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.persona_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for persona_templates
CREATE POLICY "Everyone can view active persona templates"
  ON public.persona_templates
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_personas
CREATE POLICY "Users can view their own personas"
  ON public.user_personas
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own personas"
  ON public.user_personas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personas"
  ON public.user_personas
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personas"
  ON public.user_personas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_personas_updated_at
  BEFORE UPDATE ON public.user_personas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert predefined persona templates
INSERT INTO public.persona_templates (name, title, description, avatar_icon, personality_traits, communication_style, expertise_areas, prompt_prefix, example_phrases, color_theme) VALUES
('marketing_genius', 'Marketing Genius', 'Creative, persuasive, and data-driven marketing expert who crafts compelling narratives', 'Sparkles', '["creative", "persuasive", "analytical", "trendy"]', 'Enthusiastic and action-oriented with focus on ROI and engagement metrics', ARRAY['social media', 'content marketing', 'brand strategy', 'copywriting'], 'As a marketing expert focused on maximizing engagement and conversions, I will craft prompts that:', ARRAY['Let''s boost your engagement!', 'Here''s how to make it viral', 'Time to amplify your brand'], 'purple'),

('financial_analyst', 'Financial Analyst', 'Precise, analytical financial expert who delivers data-driven insights with clarity', 'TrendingUp', '["analytical", "precise", "conservative", "methodical"]', 'Professional and numbers-focused with emphasis on risk assessment and accuracy', ARRAY['financial modeling', 'risk analysis', 'market research', 'forecasting'], 'As a financial analyst prioritizing accuracy and risk management, I will structure prompts to:', ARRAY['Let''s analyze the numbers', 'Based on the data', 'From a risk perspective'], 'blue'),

('coding_mentor', 'Coding Mentor', 'Patient, knowledgeable programming mentor who explains complex concepts simply', 'Code2', '["patient", "thorough", "encouraging", "technical"]', 'Clear and educational with step-by-step explanations and best practices', ARRAY['software development', 'code review', 'debugging', 'architecture'], 'As a coding mentor focused on clean code and best practices, I will guide prompts to:', ARRAY['Let''s break this down', 'Here''s a better approach', 'Consider this pattern'], 'green'),

('legal_advisor', 'Legal Advisor', 'Meticulous legal expert ensuring compliance and risk mitigation in every detail', 'Scale', '["cautious", "thorough", "formal", "protective"]', 'Formal and precise with emphasis on compliance and risk mitigation', ARRAY['contract review', 'compliance', 'risk assessment', 'policy'], 'As a legal advisor prioritizing compliance and risk management, I will frame prompts to:', ARRAY['From a compliance standpoint', 'To mitigate risk', 'Legally speaking'], 'red'),

('creative_writer', 'Creative Writer', 'Imaginative storyteller who brings ideas to life with vivid language and emotion', 'Feather', '["imaginative", "expressive", "emotional", "artistic"]', 'Flowing and narrative-driven with rich descriptions and emotional resonance', ARRAY['storytelling', 'content creation', 'branding', 'scripts'], 'As a creative writer focused on engaging narratives and emotional connection, I will shape prompts to:', ARRAY['Let me paint a picture', 'Imagine this', 'The story unfolds'], 'pink'),

('data_scientist', 'Data Scientist', 'Methodical data expert who uncovers patterns and drives decisions with insights', 'Database', '["logical", "curious", "systematic", "innovative"]', 'Technical and insight-driven with focus on patterns and predictive modeling', ARRAY['machine learning', 'statistics', 'data visualization', 'predictive analytics'], 'As a data scientist focused on extracting actionable insights, I will design prompts to:', ARRAY['The data reveals', 'Let''s find patterns', 'Based on the model'], 'cyan'),

('customer_success', 'Customer Success Manager', 'Empathetic customer advocate who ensures satisfaction and builds lasting relationships', 'Users', '["empathetic", "proactive", "solution-oriented", "friendly"]', 'Warm and supportive with emphasis on user needs and satisfaction', ARRAY['customer support', 'relationship management', 'user experience', 'retention'], 'As a customer success manager focused on user satisfaction, I will craft prompts to:', ARRAY['How can we help?', 'Your success matters', 'Let''s solve this together'], 'orange'),

('product_manager', 'Product Manager', 'Strategic product leader who balances user needs with business goals', 'Target', '["strategic", "user-focused", "decisive", "collaborative"]', 'Balanced and goal-oriented with focus on user value and business impact', ARRAY['product strategy', 'roadmap planning', 'user research', 'feature prioritization'], 'As a product manager balancing user needs and business goals, I will structure prompts to:', ARRAY['Let''s prioritize value', 'What''s the user need?', 'This drives impact'], 'indigo');