-- Create table for AI-generated insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('performance', 'prediction', 'optimization', 'insights', 'trends', 'recommendations', 'anomalies')),
  analysis_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_actionable BOOLEAN DEFAULT true,
  action_taken BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI insights"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI insights"
  ON public.ai_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI insights"
  ON public.ai_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX idx_ai_insights_type ON public.ai_insights(insight_type);
CREATE INDEX idx_ai_insights_created ON public.ai_insights(created_at DESC);
CREATE INDEX idx_ai_insights_actionable ON public.ai_insights(is_actionable) WHERE is_actionable = true;

-- Create table for learning patterns
CREATE TABLE IF NOT EXISTS public.ai_learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  success_rate NUMERIC DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  confidence NUMERIC DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_learning_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own learning patterns"
  ON public.ai_learning_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own learning patterns"
  ON public.ai_learning_patterns FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_ai_learning_user_id ON public.ai_learning_patterns(user_id);
CREATE INDEX idx_ai_learning_type ON public.ai_learning_patterns(pattern_type);
CREATE INDEX idx_ai_learning_success ON public.ai_learning_patterns(success_rate DESC);

-- Create table for predictive models
CREATE TABLE IF NOT EXISTS public.predictive_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,
  model_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  accuracy NUMERIC DEFAULT 0.0,
  training_data_count INTEGER DEFAULT 0,
  last_trained_at TIMESTAMP WITH TIME ZONE,
  predictions_made INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.predictive_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own predictive models"
  ON public.predictive_models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own predictive models"
  ON public.predictive_models FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_predictive_user_id ON public.predictive_models(user_id);
CREATE INDEX idx_predictive_type ON public.predictive_models(model_type);
CREATE INDEX idx_predictive_accuracy ON public.predictive_models(accuracy DESC);

-- Create table for optimization recommendations
CREATE TABLE IF NOT EXISTS public.optimization_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  expected_impact NUMERIC DEFAULT 0.0,
  effort_level TEXT CHECK (effort_level IN ('low', 'medium', 'high')),
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'implemented')),
  implementation_notes TEXT,
  actual_impact NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  implemented_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.optimization_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recommendations"
  ON public.optimization_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own recommendations"
  ON public.optimization_recommendations FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_optimization_user_id ON public.optimization_recommendations(user_id);
CREATE INDEX idx_optimization_status ON public.optimization_recommendations(status);
CREATE INDEX idx_optimization_priority ON public.optimization_recommendations(priority DESC);
CREATE INDEX idx_optimization_impact ON public.optimization_recommendations(expected_impact DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_ai_learning_patterns_updated_at
  BEFORE UPDATE ON public.ai_learning_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER update_predictive_models_updated_at
  BEFORE UPDATE ON public.predictive_models
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();