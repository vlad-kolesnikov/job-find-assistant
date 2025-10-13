-- Fix security warnings by recreating functions with proper search_path
-- Drop triggers first, then functions, then recreate everything

DROP TRIGGER IF EXISTS set_updated_at ON public.job_sources;
DROP TRIGGER IF EXISTS on_auth_user_created_stats ON auth.users;
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user_stats();

-- Recreate function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
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

-- Recreate function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.application_stats (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.job_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_auth_user_created_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_stats();