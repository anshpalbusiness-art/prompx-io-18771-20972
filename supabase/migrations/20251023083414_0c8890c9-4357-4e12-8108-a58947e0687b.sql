-- Drop the problematic public policy that exposes all data
DROP POLICY IF EXISTS "Public can view non-sensitive profile data" ON public.profiles;

-- Create a view that exposes only public profile information (no email)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  avg_prompt_rating,
  total_prompt_ratings,
  reputation_score,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Update the full profile SELECT policy to be more explicit
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;

CREATE POLICY "Users can view their own complete profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);