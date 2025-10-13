-- Create function to track resource usage
CREATE OR REPLACE FUNCTION public.track_usage(
  _user_id UUID,
  _resource_type TEXT,
  _count INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
  v_existing_record RECORD;
BEGIN
  -- Calculate current period (monthly)
  v_period_start := date_trunc('month', now());
  v_period_end := v_period_start + INTERVAL '1 month';
  
  -- Check if there's already a record for this period
  SELECT * INTO v_existing_record
  FROM usage_tracking
  WHERE user_id = _user_id
    AND resource_type = _resource_type
    AND period_start = v_period_start;
  
  IF v_existing_record IS NULL THEN
    -- Insert new record
    INSERT INTO usage_tracking (user_id, resource_type, count, period_start, period_end)
    VALUES (_user_id, _resource_type, _count, v_period_start, v_period_end);
  ELSE
    -- Update existing record
    UPDATE usage_tracking
    SET count = count + _count
    WHERE user_id = _user_id
      AND resource_type = _resource_type
      AND period_start = v_period_start;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'tracked', _count
  );
END;
$$;