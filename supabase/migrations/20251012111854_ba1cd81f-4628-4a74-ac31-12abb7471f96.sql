-- Phase 4: Learning & Personalization Tables

-- User preferences and personalization settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  preferred_platforms JSONB DEFAULT '[]'::jsonb,
  preferred_categories JSONB DEFAULT '[]'::jsonb,
  optimization_goals JSONB DEFAULT '["engagement", "conversion"]'::jsonb,
  industry TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  tone_preference TEXT,
  length_preference TEXT,
  personalization_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User behavior tracking for ML
CREATE TABLE IF NOT EXISTS public.user_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  behavior_type TEXT NOT NULL, -- 'prompt_created', 'optimization_accepted', 'template_used', etc.
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  success_score NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Personalized recommendations
CREATE TABLE IF NOT EXISTS public.personalized_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recommendation_type TEXT NOT NULL, -- 'prompt_template', 'optimization', 'workflow', 'tool'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content JSONB NOT NULL,
  relevance_score NUMERIC NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
  reason TEXT,
  based_on JSONB DEFAULT '[]'::jsonb,
  is_viewed BOOLEAN DEFAULT false,
  is_applied BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Success patterns learned from user behavior
CREATE TABLE IF NOT EXISTS public.learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL, -- 'prompt_structure', 'optimization_style', 'workflow_preference'
  pattern_name TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  success_rate NUMERIC NOT NULL DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  last_successful_at TIMESTAMP WITH TIME ZONE,
  confidence_score NUMERIC NOT NULL DEFAULT 0.5,
  context_tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adaptive models that improve over time
CREATE TABLE IF NOT EXISTS public.adaptive_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  model_type TEXT NOT NULL, -- 'recommendation', 'optimization', 'prediction'
  model_version INTEGER NOT NULL DEFAULT 1,
  model_data JSONB NOT NULL,
  accuracy_score NUMERIC,
  training_samples INTEGER DEFAULT 0,
  last_trained_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Context-aware suggestions cache
CREATE TABLE IF NOT EXISTS public.context_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  context_type TEXT NOT NULL, -- 'platform', 'industry', 'goal'
  context_value TEXT NOT NULL,
  suggestions JSONB NOT NULL,
  relevance_score NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '7 days',
  UNIQUE(user_id, context_type, context_value)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON public.user_behavior(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_behavior_type ON public.user_behavior(behavior_type);
CREATE INDEX IF NOT EXISTS idx_personalized_recommendations_user ON public.personalized_recommendations(user_id, is_dismissed, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_learned_patterns_user ON public.learned_patterns(user_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_adaptive_models_user_active ON public.adaptive_models(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_context_suggestions_user ON public.context_suggestions(user_id, expires_at);

-- RLS Policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalized_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adaptive_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_suggestions ENABLE ROW LEVEL SECURITY;

-- User preferences policies
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- User behavior policies
DROP POLICY IF EXISTS "Users can view their own behavior" ON public.user_behavior;
CREATE POLICY "Users can view their own behavior"
  ON public.user_behavior FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own behavior" ON public.user_behavior;
CREATE POLICY "Users can insert their own behavior"
  ON public.user_behavior FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Recommendations policies
DROP POLICY IF EXISTS "Users can view their own recommendations" ON public.personalized_recommendations;
CREATE POLICY "Users can view their own recommendations"
  ON public.personalized_recommendations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recommendations" ON public.personalized_recommendations;
CREATE POLICY "Users can update their own recommendations"
  ON public.personalized_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create recommendations" ON public.personalized_recommendations;
CREATE POLICY "System can create recommendations"
  ON public.personalized_recommendations FOR INSERT
  WITH CHECK (true);

-- Learned patterns policies
DROP POLICY IF EXISTS "Users can view their own patterns" ON public.learned_patterns;
CREATE POLICY "Users can view their own patterns"
  ON public.learned_patterns FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own patterns" ON public.learned_patterns;
CREATE POLICY "Users can manage their own patterns"
  ON public.learned_patterns FOR ALL
  USING (auth.uid() = user_id);

-- Adaptive models policies
DROP POLICY IF EXISTS "Users can view their own models" ON public.adaptive_models;
CREATE POLICY "Users can view their own models"
  ON public.adaptive_models FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage models" ON public.adaptive_models;
CREATE POLICY "System can manage models"
  ON public.adaptive_models FOR ALL
  USING (auth.uid() = user_id);

-- Context suggestions policies
DROP POLICY IF EXISTS "Users can view their own suggestions" ON public.context_suggestions;
CREATE POLICY "Users can view their own suggestions"
  ON public.context_suggestions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage suggestions" ON public.context_suggestions;
CREATE POLICY "System can manage suggestions"
  ON public.context_suggestions FOR ALL
  USING (auth.uid() = user_id);

-- Triggers
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_learned_patterns_updated_at ON public.learned_patterns;
CREATE TRIGGER update_learned_patterns_updated_at
  BEFORE UPDATE ON public.learned_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();