-- Create upgrade_requests table
CREATE TABLE IF NOT EXISTS upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_description TEXT,
  xmr_address TEXT NOT NULL,
  xmr_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Add check constraint for status
ALTER TABLE upgrade_requests DROP CONSTRAINT IF EXISTS upgrade_requests_status_check;
ALTER TABLE upgrade_requests ADD CONSTRAINT upgrade_requests_status_check 
  CHECK (status IN ('pending', 'confirmed', 'failed'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_user_id ON upgrade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_status ON upgrade_requests(status);

-- Enable RLS
ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own upgrade requests" ON upgrade_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own upgrade requests" ON upgrade_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());
