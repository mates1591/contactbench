-- Add missing total_limit column to user_databases table
ALTER TABLE public.user_databases 
ADD COLUMN IF NOT EXISTS total_limit integer;

-- Update existing records to set total_limit equal to limit_count 
-- This ensures backward compatibility with existing database records
UPDATE public.user_databases
SET total_limit = limit_count
WHERE total_limit IS NULL;

-- Commit the transaction
COMMIT; 