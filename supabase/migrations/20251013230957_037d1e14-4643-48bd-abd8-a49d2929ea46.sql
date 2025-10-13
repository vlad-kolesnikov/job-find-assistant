-- Add monthly_goal column to application_stats table
ALTER TABLE public.application_stats 
ADD COLUMN monthly_goal integer NOT NULL DEFAULT 50;