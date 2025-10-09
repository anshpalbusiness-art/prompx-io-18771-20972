-- Create function to increment listing views
CREATE OR REPLACE FUNCTION increment_listing_views(listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE marketplace_listings
  SET views = views + 1
  WHERE id = listing_id;
END;
$$;