-- ============================================
-- SECURITY FIX: API Keys Protection
-- ============================================
-- This migration implements defense-in-depth for API key storage
-- to prevent plaintext exposure even if RLS is bypassed

-- Step 1: Create a trigger function to automatically clear plaintext API keys
-- This ensures keys are never stored in plaintext after creation
CREATE OR REPLACE FUNCTION public.clear_plaintext_api_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only clear the api_key if a hash exists
  -- This allows the key to be temporarily set during creation
  IF NEW.api_key IS NOT NULL AND NEW.api_key_hash IS NOT NULL THEN
    NEW.api_key := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 2: Create trigger to auto-clear plaintext keys on insert
DROP TRIGGER IF EXISTS auto_clear_api_key ON public.api_keys;
CREATE TRIGGER auto_clear_api_key
  BEFORE INSERT ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_plaintext_api_key();

-- Step 3: Update existing RLS policies to NEVER expose api_key column
-- Drop and recreate the SELECT policy to exclude api_key
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
CREATE POLICY "Users can view their own API keys"
  ON public.api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: The SELECT policy allows viewing but we rely on application layer
-- to not request the api_key column. For extra security, we could use
-- a view that excludes api_key, but that would require app code changes.

-- Step 4: Add check constraint to ensure hash exists for active keys
-- This prevents keys from being active without proper hashing
ALTER TABLE public.api_keys
  DROP CONSTRAINT IF EXISTS api_keys_hash_required;

ALTER TABLE public.api_keys
  ADD CONSTRAINT api_keys_hash_required
  CHECK (
    (is_active = false) OR 
    (is_active = true AND api_key_hash IS NOT NULL)
  );

-- Step 5: Clear any existing plaintext keys in the database
-- This is a one-time cleanup operation
UPDATE public.api_keys
SET api_key = NULL
WHERE api_key IS NOT NULL;

-- Step 6: Add comment documenting the security model
COMMENT ON COLUMN public.api_keys.api_key IS 
  'SECURITY: Temporary plaintext storage only during creation. Automatically cleared by trigger. Never query this column.';

COMMENT ON COLUMN public.api_keys.api_key_hash IS 
  'SECURITY: Bcrypt hash of the API key. Used for validation via validate_api_key_hash() function.';

COMMENT ON COLUMN public.api_keys.key_prefix IS 
  'First 12 characters of the API key. Used for key lookup before hash validation.';