-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze',
  requirements JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_id)
);

-- Create prompt performance table
CREATE TABLE public.prompt_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversions INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leaderboard table
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score INTEGER DEFAULT 0,
  weekly_score INTEGER DEFAULT 0,
  monthly_score INTEGER DEFAULT 0,
  rank INTEGER,
  category TEXT NOT NULL DEFAULT 'overall',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges
CREATE POLICY "Everyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

-- RLS Policies for user achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' achievements"
  ON public.user_achievements FOR SELECT
  USING (true);

CREATE POLICY "System can insert achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for prompt performance
CREATE POLICY "Users can view their own performance"
  ON public.prompt_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance"
  ON public.prompt_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance"
  ON public.prompt_performance FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for leaderboard
CREATE POLICY "Everyone can view leaderboard"
  ON public.leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own leaderboard entry"
  ON public.leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entry"
  ON public.leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, category, tier, requirements) VALUES
('Prompt Pioneer', 'Create your first prompt', '🚀', 'beginner', 'bronze', '{"prompts_created": 1}'),
('Top Marketer', 'Create 10 marketing prompts with high engagement', '📈', 'marketing', 'gold', '{"marketing_prompts": 10, "avg_engagement": 80}'),
('Trading Master', 'Create 10 trading prompts with high conversion', '💰', 'trading', 'gold', '{"trading_prompts": 10, "conversions": 100}'),
('Content Creator', 'Create 50 prompts across categories', '✍️', 'creator', 'silver', '{"prompts_created": 50}'),
('Community Champion', 'Share 20 prompts on social media', '🌟', 'social', 'gold', '{"shares": 20}'),
('Engagement King', 'Get 1000 total views on your prompts', '👑', 'engagement', 'gold', '{"total_views": 1000}'),
('Weekly Winner', 'Top the weekly leaderboard', '🏆', 'competitive', 'platinum', '{"weekly_rank": 1}'),
('AI Whisperer', 'Create 5 highly rated AI agent prompts', '🤖', 'ai', 'silver', '{"ai_prompts": 5, "avg_rating": 4.5}');

-- Create function to update leaderboard
CREATE OR REPLACE FUNCTION public.update_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update weekly scores
  WITH weekly_scores AS (
    SELECT 
      user_id,
      SUM(engagement_score + (conversions * 10) + (shares * 5)) as score
    FROM prompt_performance
    WHERE period_start >= NOW() - INTERVAL '7 days'
    GROUP BY user_id
  )
  INSERT INTO leaderboard (user_id, weekly_score, category)
  SELECT user_id, score, 'weekly'
  FROM weekly_scores
  ON CONFLICT (user_id, category) 
  DO UPDATE SET 
    weekly_score = EXCLUDED.weekly_score,
    updated_at = NOW();

  -- Update ranks
  WITH ranked_users AS (
    SELECT 
      user_id,
      category,
      ROW_NUMBER() OVER (PARTITION BY category ORDER BY weekly_score DESC) as new_rank
    FROM leaderboard
    WHERE category = 'weekly'
  )
  UPDATE leaderboard l
  SET rank = ru.new_rank
  FROM ranked_users ru
  WHERE l.user_id = ru.user_id AND l.category = ru.category;
END;
$$;