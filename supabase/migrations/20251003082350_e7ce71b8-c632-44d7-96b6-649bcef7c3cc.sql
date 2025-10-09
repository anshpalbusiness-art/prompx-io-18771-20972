-- Create prompt agents table
CREATE TABLE public.prompt_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  category TEXT NOT NULL,
  model TEXT DEFAULT 'google/gemini-2.5-flash',
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompt_agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own agents"
  ON public.prompt_agents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public agents"
  ON public.prompt_agents
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create their own agents"
  ON public.prompt_agents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents"
  ON public.prompt_agents
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents"
  ON public.prompt_agents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_prompt_agents_updated_at
  BEFORE UPDATE ON public.prompt_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_prompt_agents_user_id ON public.prompt_agents(user_id);
CREATE INDEX idx_prompt_agents_category ON public.prompt_agents(category);
CREATE INDEX idx_prompt_agents_is_public ON public.prompt_agents(is_public);