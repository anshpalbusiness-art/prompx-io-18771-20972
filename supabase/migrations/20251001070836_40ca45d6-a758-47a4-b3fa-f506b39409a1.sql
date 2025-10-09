-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON public.team_members;

-- Recreate team_members policies without circular references
CREATE POLICY "Users can view their own memberships"
ON public.team_members FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Team owners can view all members"
ON public.team_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = team_members.team_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Team owners can add members"
ON public.team_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = team_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Team owners can remove members"
ON public.team_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = team_id AND owner_id = auth.uid()
  )
);

-- Recreate teams policy without circular reference
CREATE POLICY "Team members can view their teams"
ON public.teams FOR SELECT
USING (
  auth.uid() = owner_id OR
  id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);