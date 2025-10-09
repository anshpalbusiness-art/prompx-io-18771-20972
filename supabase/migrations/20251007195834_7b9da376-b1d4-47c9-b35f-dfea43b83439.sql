-- Add reputation fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_prompt_ratings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_prompt_rating NUMERIC DEFAULT 0;

-- Create prompt stars/likes table (GitHub star style)
CREATE TABLE IF NOT EXISTS public.prompt_stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, prompt_id)
);

-- Enable RLS
ALTER TABLE public.prompt_stars ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stars
CREATE POLICY "Users can star prompts"
ON public.prompt_stars
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar prompts"
ON public.prompt_stars
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view stars"
ON public.prompt_stars
FOR SELECT
TO authenticated
USING (true);

-- Add helpful votes to ratings (upvote/downvote reviews)
ALTER TABLE public.prompt_ratings
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;

-- Create table for rating votes
CREATE TABLE IF NOT EXISTS public.rating_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating_id UUID NOT NULL REFERENCES public.prompt_ratings(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, rating_id)
);

-- Enable RLS
ALTER TABLE public.rating_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can vote on ratings"
ON public.rating_votes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their votes"
ON public.rating_votes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view votes"
ON public.rating_votes
FOR SELECT
TO authenticated
USING (true);

-- Create trending prompts view
CREATE OR REPLACE VIEW public.trending_prompts AS
SELECT 
  ml.id,
  ml.title,
  ml.description,
  ml.seller_id,
  ml.price,
  ml.category,
  ml.downloads,
  ml.views,
  ml.created_at,
  COALESCE(AVG(pr.rating), 0) as avg_rating,
  COUNT(DISTINCT pr.id) as rating_count,
  COUNT(DISTINCT ps.id) as star_count,
  -- Trending score: weighted combination of recency, ratings, stars, and engagement
  (
    COALESCE(AVG(pr.rating), 0) * 20 +
    COUNT(DISTINCT ps.id) * 2 +
    (ml.downloads * 3) +
    (ml.views * 0.1) +
    -- Recency boost (higher for newer prompts)
    (100 * EXP(-EXTRACT(EPOCH FROM (NOW() - ml.created_at)) / 2592000)) -- 30 days decay
  ) as trending_score
FROM public.marketplace_listings ml
LEFT JOIN public.prompt_ratings pr ON pr.prompt_id = ml.id
LEFT JOIN public.prompt_stars ps ON ps.prompt_id = ml.id
WHERE ml.is_active = true
GROUP BY ml.id, ml.title, ml.description, ml.seller_id, ml.price, ml.category, 
         ml.downloads, ml.views, ml.created_at
ORDER BY trending_score DESC;

-- Create top rated prompts view
CREATE OR REPLACE VIEW public.top_rated_prompts AS
SELECT 
  ml.id,
  ml.title,
  ml.description,
  ml.seller_id,
  ml.price,
  ml.category,
  ml.downloads,
  ml.views,
  COALESCE(AVG(pr.rating), 0) as avg_rating,
  COUNT(DISTINCT pr.id) as rating_count,
  COUNT(DISTINCT ps.id) as star_count
FROM public.marketplace_listings ml
LEFT JOIN public.prompt_ratings pr ON pr.prompt_id = ml.id
LEFT JOIN public.prompt_stars ps ON ps.prompt_id = ml.id
WHERE ml.is_active = true
GROUP BY ml.id
HAVING COUNT(DISTINCT pr.id) >= 3 -- Minimum 3 ratings to appear
ORDER BY avg_rating DESC, rating_count DESC;

-- Function to update user reputation
CREATE OR REPLACE FUNCTION public.update_user_reputation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_user_id UUID;
  new_avg NUMERIC;
  total_ratings INTEGER;
BEGIN
  -- Get seller_id from marketplace listing
  SELECT seller_id INTO seller_user_id
  FROM marketplace_listings
  WHERE id = NEW.prompt_id;
  
  IF seller_user_id IS NOT NULL THEN
    -- Calculate new average and total
    SELECT 
      COALESCE(AVG(rating), 0),
      COUNT(*)
    INTO new_avg, total_ratings
    FROM prompt_ratings pr
    JOIN marketplace_listings ml ON pr.prompt_id = ml.id
    WHERE ml.seller_id = seller_user_id;
    
    -- Update profile
    UPDATE profiles
    SET 
      avg_prompt_rating = new_avg,
      total_prompt_ratings = total_ratings,
      reputation_score = (new_avg * 100) + (total_ratings * 10)
    WHERE id = seller_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update reputation on new rating
DROP TRIGGER IF EXISTS update_reputation_on_rating ON public.prompt_ratings;
CREATE TRIGGER update_reputation_on_rating
AFTER INSERT ON public.prompt_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_user_reputation();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_stars_prompt ON public.prompt_stars(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_stars_user ON public.prompt_stars(user_id);
CREATE INDEX IF NOT EXISTS idx_rating_votes_rating ON public.rating_votes(rating_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ratings_prompt ON public.prompt_ratings(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ratings_rating ON public.prompt_ratings(rating);