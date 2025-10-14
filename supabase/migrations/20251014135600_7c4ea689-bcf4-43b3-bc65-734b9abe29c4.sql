-- Add new columns for API key security improvements
ALTER TABLE public.api_keys 
  ADD COLUMN IF NOT EXISTS api_key_hash TEXT,
  ADD COLUMN IF NOT EXISTS key_prefix TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_rotated_at TIMESTAMP WITH TIME ZONE;

-- Create index on key_prefix for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(key_prefix);

-- Create index on api_key_hash for validation
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(api_key_hash);

-- Create audit log table for API key usage
CREATE TABLE IF NOT EXISTS public.api_key_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.api_key_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own audit logs
CREATE POLICY "Users can view their own API key audit logs"
  ON public.api_key_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow system to insert audit logs
CREATE POLICY "System can create audit logs"
  ON public.api_key_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Create function to hash API keys (using pgcrypto extension)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to validate API key hash
CREATE OR REPLACE FUNCTION public.validate_api_key_hash(
  _api_key TEXT,
  _api_key_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(_api_key, _api_key_hash) = _api_key_hash;
END;
$$;

-- Create function to generate API key hash
CREATE OR REPLACE FUNCTION public.generate_api_key_hash(_api_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(_api_key, gen_salt('bf', 10));
END;
$$;

-- Add trigger to prevent direct API key storage (for new records)
CREATE OR REPLACE FUNCTION public.prevent_plaintext_api_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow api_key to be set during initial insert, then clear it
  IF TG_OP = 'UPDATE' AND NEW.api_key IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot update plaintext API key. Use key rotation instead.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_api_key_security
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_plaintext_api_key();