
-- Fix Security Definer View issue by recreating views with security_invoker option
-- This ensures views run with the permissions of the querying user, not the view owner

-- Drop existing views
DROP VIEW IF EXISTS public.top_rated_prompts;
DROP VIEW IF EXISTS public.trending_prompts;

-- Recreate top_rated_prompts with SECURITY INVOKER
CREATE VIEW public.top_rated_prompts
WITH (security_invoker = true)
AS
SELECT 
  ml.id,
  ml.title,
  ml.description,
  ml.seller_id,
  ml.price,
  ml.category,
  ml.downloads,
  ml.views,
  COALESCE(AVG(pr.rating), 0) AS avg_rating,
  COUNT(DISTINCT pr.id) AS rating_count,
  COUNT(DISTINCT ps.id) AS star_count
FROM marketplace_listings ml
LEFT JOIN prompt_ratings pr ON pr.prompt_id = ml.id
LEFT JOIN prompt_stars ps ON ps.prompt_id = ml.id
WHERE ml.is_active = true
GROUP BY ml.id
HAVING COUNT(DISTINCT pr.id) >= 3
ORDER BY COALESCE(AVG(pr.rating), 0) DESC, COUNT(DISTINCT pr.id) DESC;

-- Recreate trending_prompts with SECURITY INVOKER
CREATE VIEW public.trending_prompts
WITH (security_invoker = true)
AS
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
  COALESCE(AVG(pr.rating), 0) AS avg_rating,
  COUNT(DISTINCT pr.id) AS rating_count,
  COUNT(DISTINCT ps.id) AS star_count,
  (
    COALESCE(AVG(pr.rating), 0) * 20 + 
    COUNT(DISTINCT ps.id) * 2 + 
    ml.downloads * 3 + 
    ml.views * 0.1 + 
    100 * EXP(-(EXTRACT(EPOCH FROM (NOW() - ml.created_at)) / 2592000))
  ) AS trending_score
FROM marketplace_listings ml
LEFT JOIN prompt_ratings pr ON pr.prompt_id = ml.id
LEFT JOIN prompt_stars ps ON ps.prompt_id = ml.id
WHERE ml.is_active = true
GROUP BY ml.id, ml.title, ml.description, ml.seller_id, ml.price, ml.category, ml.downloads, ml.views, ml.created_at
ORDER BY (
  COALESCE(AVG(pr.rating), 0) * 20 + 
  COUNT(DISTINCT ps.id) * 2 + 
  ml.downloads * 3 + 
  ml.views * 0.1 + 
  100 * EXP(-(EXTRACT(EPOCH FROM (NOW() - ml.created_at)) / 2592000))
) DESC;
