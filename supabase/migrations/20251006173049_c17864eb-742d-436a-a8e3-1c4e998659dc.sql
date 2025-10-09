-- Create agent conversations table for persistence
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.prompt_agents(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own conversations"
  ON public.agent_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.agent_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.agent_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.agent_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Create agent analytics table
CREATE TABLE IF NOT EXISTS public.agent_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.prompt_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  response_time_ms INTEGER,
  tokens_used INTEGER,
  model_used TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own analytics"
  ON public.agent_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON public.agent_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_agent_conversations_user_id ON public.agent_conversations(user_id);
CREATE INDEX idx_agent_conversations_agent_id ON public.agent_conversations(agent_id);
CREATE INDEX idx_agent_conversations_updated_at ON public.agent_conversations(updated_at DESC);
CREATE INDEX idx_agent_analytics_agent_id ON public.agent_analytics(agent_id);
CREATE INDEX idx_agent_analytics_created_at ON public.agent_analytics(created_at DESC);

-- Create trigger for updating updated_at
CREATE TRIGGER update_agent_conversations_updated_at
  BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();