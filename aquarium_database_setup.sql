-- Create user_aquarium table for persistent aquarium state
CREATE TABLE IF NOT EXISTS user_aquarium (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aquarium_items JSONB DEFAULT '[]'::jsonb,
  warehouse_items JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_aquarium_user_id ON user_aquarium(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_aquarium ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only access their own aquarium data
CREATE POLICY "Users can only access their own aquarium data" ON user_aquarium
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_aquarium_updated_at
  BEFORE UPDATE ON user_aquarium
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
