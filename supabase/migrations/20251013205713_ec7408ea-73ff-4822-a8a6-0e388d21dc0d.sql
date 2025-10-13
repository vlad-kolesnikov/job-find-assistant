-- Create job_sources table to store user's job application tracking
CREATE TABLE public.job_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_url text NOT NULL,
  filter_query text,
  sent_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  waiting_count integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create application_stats table to store user's statistics
CREATE TABLE public.application_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sent integer NOT NULL DEFAULT 0,
  total_waiting integer NOT NULL DEFAULT 0,
  total_rejected integer NOT NULL DEFAULT 0,
  weekly_goal integer NOT NULL DEFAULT 10,
  last_updated timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_sources
CREATE POLICY "Users can view their own job sources"
  ON public.job_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job sources"
  ON public.job_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job sources"
  ON public.job_sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job sources"
  ON public.job_sources FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for application_stats
CREATE POLICY "Users can view their own stats"
  ON public.application_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stats"
  ON public.application_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON public.application_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for job_sources
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.job_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to initialize application stats for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.application_stats (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create application stats for new users
CREATE TRIGGER on_auth_user_created_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_stats();