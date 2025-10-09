-- Recreate views without SECURITY DEFINER (they don't need special privileges)
DROP VIEW IF EXISTS public.trending_prompts;
DROP VIEW IF EXISTS public.top_rated_prompts;

-- Create trending prompts view (no SECURITY DEFINER)
CREATE VIEW public.trending_prompts AS
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
  (
    COALESCE(AVG(pr.rating), 0) * 20 +
    COUNT(DISTINCT ps.id) * 2 +
    (ml.downloads * 3) +
    (ml.views * 0.1) +
    (100 * EXP(-EXTRACT(EPOCH FROM (NOW() - ml.created_at)) / 2592000))
  ) as trending_score
FROM public.marketplace_listings ml
LEFT JOIN public.prompt_ratings pr ON pr.prompt_id = ml.id
LEFT JOIN public.prompt_stars ps ON ps.prompt_id = ml.id
WHERE ml.is_active = true
GROUP BY ml.id, ml.title, ml.description, ml.seller_id, ml.price, ml.category, 
         ml.downloads, ml.views, ml.created_at
ORDER BY trending_score DESC;

-- Create top rated prompts view (no SECURITY DEFINER)
CREATE VIEW public.top_rated_prompts AS
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
HAVING COUNT(DISTINCT pr.id) >= 3
ORDER BY avg_rating DESC, rating_count DESC;