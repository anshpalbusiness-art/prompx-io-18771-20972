-- Create user_preferences table for personalization
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  niche TEXT,
  style TEXT,
  preferred_tone TEXT,
  preferred_length TEXT DEFAULT 'moderate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create prompt_history table for context memory
CREATE TABLE public.prompt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  platform TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create industry_templates table
CREATE TABLE public.industry_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  industry TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_prompt TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for prompt_history
CREATE POLICY "Users can view their own history"
  ON public.prompt_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
  ON public.prompt_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history"
  ON public.prompt_history FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for industry_templates (public read)
CREATE POLICY "Anyone can view templates"
  ON public.industry_templates FOR SELECT
  USING (true);

-- Add trigger for updated_at on user_preferences
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample industry templates
INSERT INTO public.industry_templates (industry, template_name, template_prompt, description, platform) VALUES
('trading', 'Market Analysis', 'Analyze the current market trends for {asset} considering technical indicators, volume, and recent news. Provide entry/exit points with risk management recommendations.', 'Template for trading market analysis', 'ChatGPT'),
('marketing', 'Campaign Strategy', 'Create a comprehensive marketing campaign for {product} targeting {audience}. Include channel strategy, content calendar, KPIs, and budget allocation.', 'Template for marketing campaigns', 'ChatGPT'),
('coding', 'Code Review', 'Review the following {language} code for best practices, security vulnerabilities, performance optimization, and maintainability. Provide specific suggestions with examples.', 'Template for code reviews', 'ChatGPT'),
('healthcare', 'Patient Education', 'Explain {medical_condition} to a patient in simple terms. Include causes, symptoms, treatment options, and lifestyle recommendations. Use empathetic, non-technical language.', 'Template for patient education', 'ChatGPT'),
('education', 'Lesson Plan', 'Create a detailed lesson plan for teaching {topic} to {grade_level} students. Include learning objectives, activities, assessments, and differentiation strategies.', 'Template for educational content', 'ChatGPT'),
('e-commerce', 'Product Description', 'Write a compelling product description for {product} highlighting unique features, benefits, and value proposition. Include SEO keywords and call-to-action.', 'Template for e-commerce products', 'ChatGPT'),
('legal', 'Contract Review', 'Review the following {contract_type} contract for potential legal issues, ambiguous terms, missing clauses, and risk factors. Provide recommendations for improvements.', 'Template for legal document review', 'ChatGPT'),
('finance', 'Investment Analysis', 'Perform a comprehensive investment analysis for {company/asset}. Include fundamental analysis, valuation metrics, risk assessment, and investment recommendation.', 'Template for financial analysis', 'ChatGPT');