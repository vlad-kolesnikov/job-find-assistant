-- Function to create default job sources for new users
CREATE OR REPLACE FUNCTION public.create_default_job_sources()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default job sources for the new user
  INSERT INTO public.job_sources (user_id, name, base_url, filter_query) VALUES
  (NEW.id, 'LinkedIn', 'https://www.linkedin.com/jobs/search/?', 'f_E=1&geoId=102257491'),
  (NEW.id, 'Indeed', 'https://www.indeed.com/jobs?', 'q=software+engineer&l=Remote'),
  (NEW.id, 'Glassdoor', 'https://www.glassdoor.com/Job/', '?q=developer');
  
  RETURN NEW;
END;
$$;

-- Trigger to create default job sources for new users
CREATE TRIGGER on_auth_user_created_job_sources
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_job_sources();