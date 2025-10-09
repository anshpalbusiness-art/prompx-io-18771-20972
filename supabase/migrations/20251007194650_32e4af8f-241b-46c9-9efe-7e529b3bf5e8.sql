-- Create global prompt patterns table (anonymized insights)
CREATE TABLE public.global_prompt_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL, -- 'structure', 'keyword', 'technique', 'format'
  pattern_name TEXT NOT NULL,
  pattern_description TEXT,
  success_rate NUMERIC DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  avg_improvement NUMERIC DEFAULT 0,
  category TEXT,
  platform TEXT,
  example_pattern JSONB, -- anonymized example
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create global insights table (community intelligence)
CREATE TABLE public.global_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL, -- 'trend', 'best_practice', 'warning', 'opportunity'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 0.5,
  impact_score NUMERIC DEFAULT 0.5,
  supporting_data JSONB,
  category TEXT,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE -- insights can expire
);

-- Create global topic trends table
CREATE TABLE public.global_topic_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_name TEXT NOT NULL,
  trend_direction TEXT NOT NULL, -- 'rising', 'stable', 'declining'
  popularity_score NUMERIC DEFAULT 0,
  growth_rate NUMERIC DEFAULT 0,
  related_topics TEXT[],
  category TEXT,
  platform TEXT,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.global_prompt_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_topic_trends ENABLE ROW LEVEL SECURITY;

-- Everyone can read global insights (they're anonymized)
CREATE POLICY "Everyone can view global patterns"
ON public.global_prompt_patterns
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Everyone can view global insights"
ON public.global_insights
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Everyone can view global trends"
ON public.global_topic_trends
FOR SELECT
TO authenticated
USING (true);

-- System can insert/update (via edge functions with service role)
CREATE POLICY "Service role can manage global patterns"
ON public.global_prompt_patterns
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage global insights"
ON public.global_insights
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage global trends"
ON public.global_topic_trends
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_global_patterns_category ON public.global_prompt_patterns(category);
CREATE INDEX idx_global_patterns_platform ON public.global_prompt_patterns(platform);
CREATE INDEX idx_global_patterns_success ON public.global_prompt_patterns(success_rate DESC);

CREATE INDEX idx_global_insights_type ON public.global_insights(insight_type);
CREATE INDEX idx_global_insights_category ON public.global_insights(category);
CREATE INDEX idx_global_insights_confidence ON public.global_insights(confidence_score DESC);

CREATE INDEX idx_global_trends_topic ON public.global_topic_trends(topic_name);
CREATE INDEX idx_global_trends_platform ON public.global_topic_trends(platform);
CREATE INDEX idx_global_trends_popularity ON public.global_topic_trends(popularity_score DESC);

-- Function to update timestamps
CREATE TRIGGER update_global_patterns_updated_at
BEFORE UPDATE ON public.global_prompt_patterns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();