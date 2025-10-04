-- Supabase Schema Update for Social Features
-- This file contains SQL commands to update the database schema for social features

-- Add missing columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS friends UUID[] DEFAULT '{}';

-- Add missing columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0;

-- Create friends table if it doesn't exist
CREATE TABLE IF NOT EXISTS friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friends_sender_id ON friends(sender_id);
CREATE INDEX IF NOT EXISTS idx_friends_receiver_id ON friends(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

-- Enable Row Level Security (RLS)
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friends table
CREATE POLICY "Users can view their own friend requests" ON friends
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" ON friends
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update friend requests they received" ON friends
    FOR UPDATE USING (auth.uid() = receiver_id);

-- Update existing user profiles to have coins from shop context
-- This will be handled in the application code when syncing user data
