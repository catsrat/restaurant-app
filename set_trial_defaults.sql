-- Set default trial period for new restaurants (14 days)
ALTER TABLE restaurants 
ALTER COLUMN subscription_status SET DEFAULT 'trialing';

-- Create a trigger to automatically set subscription_end_date to 14 days from now on creation
CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subscription_end_date := NOW() + INTERVAL '14 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_trial_end_date_trigger
BEFORE INSERT ON restaurants
FOR EACH ROW
EXECUTE FUNCTION set_trial_end_date();

-- Backfill existing restaurants (give them 14 days from now if they don't have a date)
UPDATE restaurants 
SET subscription_status = 'trialing', 
    subscription_end_date = NOW() + INTERVAL '14 days' 
WHERE subscription_end_date IS NULL;
