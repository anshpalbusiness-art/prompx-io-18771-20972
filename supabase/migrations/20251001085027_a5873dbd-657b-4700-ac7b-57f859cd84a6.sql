-- Break RLS circular dependency by removing team_members SELECT policy that references teams
DROP POLICY IF EXISTS "Team owners can view all members" ON team_members;