-- Fix infinite recursion in teams RLS policies
-- The issue is having duplicate SELECT policies on teams table where one queries team_members
-- which in turn has a policy that queries teams table, creating circular dependency

-- Drop the duplicate/conflicting SELECT policy on teams
DROP POLICY IF EXISTS "Team owners can view their teams" ON teams;

-- The "Team members can view their teams" policy already covers both cases:
-- - auth.uid() = owner_id (owners can view)
-- - id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()) (members can view)
-- So we only need this one policy for SELECT operations