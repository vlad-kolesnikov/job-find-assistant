-- Add sort_order column to job_sources table
ALTER TABLE public.job_sources 
ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Update existing rows with their current order using a subquery
WITH ordered_sources AS (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at)::integer as new_order
  FROM public.job_sources
)
UPDATE public.job_sources 
SET sort_order = ordered_sources.new_order
FROM ordered_sources
WHERE public.job_sources.id = ordered_sources.id;

-- Create index for better query performance
CREATE INDEX idx_job_sources_sort_order ON public.job_sources(user_id, sort_order);