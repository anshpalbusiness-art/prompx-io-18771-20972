-- Create security definer function to check if user is team owner
-- This prevents infinite recursion by not using RLS in the function
CREATE OR REPLACE FUNCTION public.is_team_owner(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams
    WHERE id = _team_id
      AND owner_id = _user_id
  )
$$;

-- Re-create the team members SELECT policy using the security definer function
-- This breaks the circular dependency
CREATE POLICY "Team owners can view all members"
ON team_members
FOR SELECT
USING (public.is_team_owner(auth.uid(), team_id));