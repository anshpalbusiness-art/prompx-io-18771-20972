-- Create table for saved workflows
CREATE TABLE IF NOT EXISTS public.saved_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_workflows ENABLE ROW LEVEL SECURITY;

-- Create policies for saved workflows
CREATE POLICY "Users can view their own workflows"
ON public.saved_workflows
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflows"
ON public.saved_workflows
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
ON public.saved_workflows
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
ON public.saved_workflows
FOR DELETE
USING (auth.uid() = user_id);

-- Users can view public workflows
CREATE POLICY "Public workflows are viewable by everyone"
ON public.saved_workflows
FOR SELECT
USING (is_public = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_workflows_updated_at
BEFORE UPDATE ON public.saved_workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_saved_workflows_user_id ON public.saved_workflows(user_id);
CREATE INDEX idx_saved_workflows_is_public ON public.saved_workflows(is_public);