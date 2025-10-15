-- Extend profiles table for PGP authentication
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pgp_public_key TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pgp_fingerprint TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upgraded_to_seller_at TIMESTAMP WITH TIME ZONE;

-- Create auth_challenges table for PGP challenge-response
CREATE TABLE IF NOT EXISTS auth_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_message TEXT NOT NULL,
  plain_message TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_challenges_profile_id ON auth_challenges(profile_id);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires_at ON auth_challenges(expires_at);

-- Create server_keys table to store server PGP key pair
CREATE TABLE IF NOT EXISTS server_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create categories table (two-tier system)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for parent-child relationships
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Extend products table with category
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Extend orders table for escrow and XMR payments
ALTER TABLE orders ADD COLUMN IF NOT EXISTS xmr_payment_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS xmr_amount NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_paid_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint for escrow_status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_escrow_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_escrow_status_check 
  CHECK (escrow_status IN ('pending', 'paid', 'shipped', 'delivered', 'completed', 'disputed'));

-- Enable RLS on new tables
ALTER TABLE auth_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auth_challenges
CREATE POLICY "Users can view their own challenges" ON auth_challenges
  FOR SELECT USING (profile_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

-- RLS Policies for server_keys (only accessible via service role)
CREATE POLICY "Server keys are not publicly accessible" ON server_keys
  FOR SELECT USING (FALSE);

-- RLS Policies for categories (public read)
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (TRUE);

-- Insert some default categories
INSERT INTO categories (name, slug, description, parent_id) VALUES
  ('Electronics', 'electronics', 'Electronic devices and accessories', NULL),
  ('Fashion', 'fashion', 'Clothing and accessories', NULL),
  ('Home & Garden', 'home-garden', 'Home improvement and garden supplies', NULL),
  ('Digital Goods', 'digital-goods', 'Software, ebooks, and digital products', NULL)
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories for Electronics
INSERT INTO categories (name, slug, description, parent_id) VALUES
  ('Computers', 'computers', 'Laptops, desktops, and accessories', (SELECT id FROM categories WHERE slug = 'electronics')),
  ('Phones', 'phones', 'Mobile phones and accessories', (SELECT id FROM categories WHERE slug = 'electronics')),
  ('Audio', 'audio', 'Headphones, speakers, and audio equipment', (SELECT id FROM categories WHERE slug = 'electronics'))
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories for Fashion
INSERT INTO categories (name, slug, description, parent_id) VALUES
  ('Men', 'men-fashion', 'Men''s clothing and accessories', (SELECT id FROM categories WHERE slug = 'fashion')),
  ('Women', 'women-fashion', 'Women''s clothing and accessories', (SELECT id FROM categories WHERE slug = 'fashion')),
  ('Accessories', 'fashion-accessories', 'Bags, watches, and jewelry', (SELECT id FROM categories WHERE slug = 'fashion'))
ON CONFLICT (slug) DO NOTHING;
