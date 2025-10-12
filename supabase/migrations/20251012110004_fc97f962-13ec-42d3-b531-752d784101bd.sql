-- Fix security warning: Set search_path for update_ai_updated_at function
-- Drop function with CASCADE to remove dependent triggers
DROP FUNCTION IF EXISTS update_ai_updated_at() CASCADE;

-- Recreate function with proper security settings
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers that were dropped
CREATE TRIGGER update_ai_learning_patterns_updated_at
  BEFORE UPDATE ON public.ai_learning_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER update_predictive_models_updated_at
  BEFORE UPDATE ON public.predictive_models
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();