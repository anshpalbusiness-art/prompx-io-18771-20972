-- Create benchmark_results table to store multi-AI test results
CREATE TABLE public.benchmark_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt_text TEXT NOT NULL,
  model_name TEXT NOT NULL,
  response_text TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 100),
  originality_score INTEGER CHECK (originality_score >= 0 AND originality_score <= 100),
  depth_score INTEGER CHECK (depth_score >= 0 AND depth_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.benchmark_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own benchmarks"
ON public.benchmark_results
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own benchmarks"
ON public.benchmark_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own benchmarks"
ON public.benchmark_results
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_benchmark_results_user_created ON public.benchmark_results(user_id, created_at DESC);