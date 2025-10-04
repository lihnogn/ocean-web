// Data synchronization utility for Ocean Web
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Sync user data from various contexts to ensure consistency across the app
export const syncUserDataAcrossContexts = async (userId: string): Promise<boolean> => {
  try {
    // Get current user profile from social context
    const { data: socialProfile, error: socialError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (socialError) throw socialError;

    // TODO: Sync with shop context coins
    // This would be called when shop context updates user's coins
    // For now, we'll assume coins are managed in social context

    // TODO: Sync with game context stars
    // This would be called when game context updates user's stars
    // For now, we'll assume stars are managed in social context

    // Update profile with any synced data
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    console.log('User data synchronized successfully');
    return true;
  } catch (error) {
    console.error('Error syncing user data:', error);
    return false;
  }
};

// Update user profile with data from shop context
export const syncShopDataToSocial = async (
  userId: string,
  coins: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        coins,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;

    console.log(`Synced ${coins} coins for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error syncing shop data to social:', error);
    return false;
  }
};

// Update user profile with data from game context
export const syncGameDataToSocial = async (
  userId: string,
  stars: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        stars,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;

    console.log(`Synced ${stars} stars for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error syncing game data to social:', error);
    return false;
  }
};

// Initialize user profile on first login
export const initializeUserProfile = async (userId: string): Promise<Tables<'user_profiles'> | null> => {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      return existingProfile;
    }

    // Create new profile with default values
    const { data: newProfile, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        username: `user_${userId.slice(0, 8)}`, // Generate username from user ID
        avatar_url: null,
        bio: null,
        stars: 10, // Give new users 10 stars to start
        coins: 0,  // Start with 0 coins
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Created new user profile for:', userId);
    return newProfile;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    return null;
  }
};
