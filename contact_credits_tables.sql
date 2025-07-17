-- Contact Credits Tables and Policies

-- Table to track user contact credits
CREATE TABLE public.user_contact_credits (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  credits_available INTEGER NOT NULL DEFAULT 20,
  credits_used INTEGER NOT NULL DEFAULT 0,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_contact_credits_pkey PRIMARY KEY (id),
  CONSTRAINT user_contact_credits_user_id_key UNIQUE (user_id),
  CONSTRAINT user_contact_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Table to track credit purchases
CREATE TABLE public.credit_purchases (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  credits_amount INTEGER NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  stripe_payment_intent_id TEXT,
  CONSTRAINT credit_purchases_pkey PRIMARY KEY (id),
  CONSTRAINT credit_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.user_contact_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- Policies for user_contact_credits
CREATE POLICY "Users can read their own credits" ON public.user_contact_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can read all credits" ON public.user_contact_credits
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can update credits" ON public.user_contact_credits
  FOR UPDATE TO service_role USING (true);

CREATE POLICY "Service role can insert credits" ON public.user_contact_credits
  FOR INSERT TO service_role WITH CHECK (true);

-- Policies for credit_purchases
CREATE POLICY "Users can read their own purchases" ON public.credit_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can read all purchases" ON public.credit_purchases
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can insert purchases" ON public.credit_purchases
  FOR INSERT TO service_role WITH CHECK (true);

-- Function to create/update user contact credits when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a contact credits record with starting 20 free credits
  INSERT INTO public.user_contact_credits (user_id, credits_available, credits_used)
  VALUES (NEW.id, 20, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to deduct credits when a database is created
CREATE OR REPLACE FUNCTION public.deduct_credits_on_database_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get actual number of results from statistics
    DECLARE 
      result_count INTEGER;
    BEGIN
      -- Extract total from statistics or use limit_count if not available
      result_count := COALESCE((NEW.statistics->>'total')::INTEGER, NEW.limit_count);
      
      -- Update credits used and available
      UPDATE public.user_contact_credits
      SET 
        credits_used = credits_used + result_count,
        credits_available = GREATEST(0, credits_available - result_count),
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a database is updated
CREATE TRIGGER on_database_completion
  AFTER UPDATE ON public.user_databases
  FOR EACH ROW EXECUTE PROCEDURE public.deduct_credits_on_database_completion();

-- Function to check if user has enough credits before database creation
CREATE OR REPLACE FUNCTION public.check_credits_before_database_creation()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    available_credits INTEGER;
  BEGIN
    -- Get available credits
    SELECT credits_available INTO available_credits
    FROM public.user_contact_credits
    WHERE user_id = NEW.user_id;
    
    -- Check if user has enough credits
    IF available_credits < NEW.limit_count THEN
      RAISE EXCEPTION 'Not enough contact credits. You need % credits but only have % available.', 
        NEW.limit_count, available_credits;
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check credits before database creation
CREATE TRIGGER check_credits_before_database
  BEFORE INSERT ON public.user_databases
  FOR EACH ROW EXECUTE PROCEDURE public.check_credits_before_database_creation(); 