-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create team prompts table (shared prompts within teams)
CREATE TABLE IF NOT EXISTS public.team_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT,
  platform TEXT,
  category TEXT,
  is_workflow BOOLEAN DEFAULT false,
  workflow_steps JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prompt ratings table
CREATE TABLE IF NOT EXISTS public.prompt_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(prompt_id, user_id)
);

-- Create marketplace listings table
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  is_workflow BOOLEAN DEFAULT false,
  workflow_steps JSONB,
  preview_available BOOLEAN DEFAULT true,
  preview_content TEXT,
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS public.prompt_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, buyer_id)
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_purchases ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Team owners can view their teams"
ON public.teams FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view their teams"
ON public.teams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = teams.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create teams"
ON public.teams FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can update their teams"
ON public.teams FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Team owners can delete their teams"
ON public.teams FOR DELETE
USING (auth.uid() = owner_id);

-- Team members policies
CREATE POLICY "Team members can view team membership"
ON public.team_members FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
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

-- Team prompts policies
CREATE POLICY "Team members can view team prompts"
ON public.team_prompts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_prompts.team_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create team prompts"
ON public.team_prompts FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_prompts.team_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Prompt creators can update their prompts"
ON public.team_prompts FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Prompt creators can delete their prompts"
ON public.team_prompts FOR DELETE
USING (auth.uid() = created_by);

-- Prompt ratings policies
CREATE POLICY "Users can view all ratings"
ON public.prompt_ratings FOR SELECT
USING (true);

CREATE POLICY "Users can create ratings"
ON public.prompt_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON public.prompt_ratings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
ON public.prompt_ratings FOR DELETE
USING (auth.uid() = user_id);

-- Marketplace listings policies
CREATE POLICY "Everyone can view active listings"
ON public.marketplace_listings FOR SELECT
USING (is_active = true OR seller_id = auth.uid());

CREATE POLICY "Sellers can create listings"
ON public.marketplace_listings FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their listings"
ON public.marketplace_listings FOR UPDATE
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their listings"
ON public.marketplace_listings FOR DELETE
USING (auth.uid() = seller_id);

-- Purchases policies
CREATE POLICY "Buyers can view their purchases"
ON public.prompt_purchases FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view sales of their listings"
ON public.prompt_purchases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.marketplace_listings
    WHERE id = listing_id AND seller_id = auth.uid()
  )
);

CREATE POLICY "Users can create purchases"
ON public.prompt_purchases FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_prompts_updated_at
BEFORE UPDATE ON public.team_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_listings_updated_at
BEFORE UPDATE ON public.marketplace_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_prompts_team_id ON public.team_prompts(team_id);
CREATE INDEX idx_prompt_ratings_prompt_id ON public.prompt_ratings(prompt_id);
CREATE INDEX idx_marketplace_listings_seller_id ON public.marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_listings_category ON public.marketplace_listings(category);
CREATE INDEX idx_marketplace_listings_is_active ON public.marketplace_listings(is_active);
CREATE INDEX idx_prompt_purchases_buyer_id ON public.prompt_purchases(buyer_id);
CREATE INDEX idx_prompt_purchases_listing_id ON public.prompt_purchases(listing_id);

-- Enable realtime for team_prompts for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_prompts;
ALTER TABLE public.team_prompts REPLICA IDENTITY FULL;