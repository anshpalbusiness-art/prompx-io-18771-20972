-- Create prompt feedback table for tracking performance
CREATE TABLE IF NOT EXISTS public.prompt_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt_id UUID,
  agent_id UUID REFERENCES public.prompt_agents(id) ON DELETE CASCADE,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT,
  variation_id TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('manual', 'automatic', 'metric')),
  
  -- Performance Metrics
  ctr NUMERIC, -- Click-through rate
  engagement_score NUMERIC,
  conversion_rate NUMERIC,
  bounce_rate NUMERIC,
  time_on_page INTEGER, -- seconds
  shares_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- User Feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  user_comment TEXT,
  
  -- Learning Data
  context JSONB DEFAULT '{}'::jsonb,
  improvements JSONB DEFAULT '{}'::jsonb,
  learned_patterns JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prompt variations table for A/B testing
CREATE TABLE IF NOT EXISTS public.prompt_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  base_prompt TEXT NOT NULL,
  variation_name TEXT NOT NULL,
  variation_prompt TEXT NOT NULL,
  variation_type TEXT NOT NULL CHECK (variation_type IN ('tone', 'length', 'structure', 'hooks', 'cta')),
  
  -- A/B Test Results
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  total_engagement NUMERIC DEFAULT 0,
  
  -- Statistical Significance
  confidence_score NUMERIC DEFAULT 0,
  is_winner BOOLEAN DEFAULT false,
  
  -- Metadata
  test_status TEXT DEFAULT 'active' CHECK (test_status IN ('active', 'completed', 'paused')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create optimization insights table for learned patterns
CREATE TABLE IF NOT EXISTS public.optimization_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  category TEXT NOT NULL,
  industry TEXT,
  platform TEXT,
  
  -- Learned Patterns
  insight_type TEXT NOT NULL CHECK (insight_type IN ('winning_pattern', 'best_practice', 'avoid_pattern', 'trend')),
  pattern_description TEXT NOT NULL,
  pattern_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Performance Data
  success_rate NUMERIC,
  sample_size INTEGER DEFAULT 0,
  avg_improvement NUMERIC,
  
  -- Confidence
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  statistical_significance NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompt_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_feedback
CREATE POLICY "Users can view their own feedback"
  ON public.prompt_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback"
  ON public.prompt_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.prompt_feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON public.prompt_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for prompt_variations
CREATE POLICY "Users can view their own variations"
  ON public.prompt_variations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own variations"
  ON public.prompt_variations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own variations"
  ON public.prompt_variations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own variations"
  ON public.prompt_variations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for optimization_insights
CREATE POLICY "Users can view their own insights"
  ON public.optimization_insights FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own insights"
  ON public.optimization_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_prompt_feedback_user_id ON public.prompt_feedback(user_id);
CREATE INDEX idx_prompt_feedback_agent_id ON public.prompt_feedback(agent_id);
CREATE INDEX idx_prompt_feedback_created_at ON public.prompt_feedback(created_at DESC);
CREATE INDEX idx_prompt_variations_user_id ON public.prompt_variations(user_id);
CREATE INDEX idx_prompt_variations_test_status ON public.prompt_variations(test_status);
CREATE INDEX idx_optimization_insights_category ON public.optimization_insights(category);
CREATE INDEX idx_optimization_insights_confidence ON public.optimization_insights(confidence_level);

-- Create triggers for updating updated_at
CREATE TRIGGER update_prompt_feedback_updated_at
  BEFORE UPDATE ON public.prompt_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompt_variations_updated_at
  BEFORE UPDATE ON public.prompt_variations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_optimization_insights_updated_at
  BEFORE UPDATE ON public.optimization_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();