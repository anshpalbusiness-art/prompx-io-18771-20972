-- Disable all API keys that have been used before
UPDATE public.api_keys
SET is_active = false
WHERE last_used_at IS NOT NULL;