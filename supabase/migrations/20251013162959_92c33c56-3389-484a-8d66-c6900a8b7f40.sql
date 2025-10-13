-- Create admin_emails table to store approved admin email addresses
CREATE TABLE public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  added_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on admin_emails
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin emails
CREATE POLICY "Admins can view admin emails"
ON public.admin_emails
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert admin emails
CREATE POLICY "Admins can add admin emails"
ON public.admin_emails
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete admin emails
CREATE POLICY "Admins can delete admin emails"
ON public.admin_emails
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Function to automatically assign admin role to users with emails in admin_emails table
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user's email is in admin_emails table
  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE email = NEW.email) THEN
    -- Insert admin role if not already exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to automatically assign admin role when profile is created
CREATE TRIGGER assign_admin_on_profile_create
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();

-- Function to sync existing users - assigns admin role to existing users whose emails are in admin_emails
CREATE OR REPLACE FUNCTION public.sync_existing_admins()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  SELECT p.id, 'admin'::app_role
  FROM public.profiles p
  INNER JOIN public.admin_emails ae ON p.email = ae.email
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.id AND ur.role = 'admin'
  );
END;
$$;