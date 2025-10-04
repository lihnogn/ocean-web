// Social API functions for Ocean Web
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Friend request types
export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender_profile?: Tables<'user_profiles'>;
  receiver_profile?: Tables<'user_profiles'>;
}

// Enhanced Post interface
export interface PostWithDetails extends Tables<'posts'> {
  user_profile?: Tables<'user_profiles'>;
  likes_count?: number;
  comments_count?: number;
  user_stars?: number;
  user_liked?: boolean;
}

// Enhanced Comment interface
export interface CommentWithProfile extends Tables<'comments'> {
  user_profile?: Tables<'user_profiles'>;
}

// Enhanced UserProfile interface
export interface UserProfile extends Tables<'user_profiles'> {
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
  banner_url?: string;
  friends?: string[];
}

// Create post with content and image
export const createPostWithContent = async (
  text: string,
  imageUrl?: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        text,
        image_url: imageUrl || null,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating post:', error);
    return false;
  }
};

// Get posts with enhanced data
export const getPostsWithDetails = async (): Promise<PostWithDetails[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get posts with user profiles
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (postsError) throw postsError;

    // For each post, get likes count, comments count, and check if current user liked it
    const enhancedPosts = await Promise.all((posts || []).map(async (post) => {
      // Get likes count
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      // Get comments count
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      // Check if current user liked this post
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      // Get star gifts for this post
      const { data: starGifts } = await supabase
        .from('star_gifts')
        .select('amount')
        .eq('post_id', post.id);

      const totalStars = starGifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0;

      return {
        ...post,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        user_stars: totalStars,
        user_liked: !!userLike,
      };
    }));

    return enhancedPosts;
  } catch (error) {
    console.error('Error getting posts with details:', error);
    return [];
  }
};

// Like post function - uses separate likes table
export const likePost = async (postId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user already liked the post
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike the post
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      // Like the post
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error liking post:', error);
    return false;
  }
};

// Add comment to post
export const addComment = async (postId: string, text: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        text,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding comment:', error);
    return false;
  }
};

// Get comments for a post
export const getComments = async (postId: string): Promise<CommentWithProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};

// Edit post
export const editPost = async (postId: string, text: string, imageUrl?: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify post ownership
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError) throw fetchError;
    if (post.user_id !== user.id) throw new Error('Not authorized to edit this post');

    const { error } = await supabase
      .from('posts')
      .update({
        text,
        image_url: imageUrl || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error editing post:', error);
    return false;
  }
};

// Delete post
export const deletePost = async (postId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify post ownership
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError) throw fetchError;
    if (post.user_id !== user.id) throw new Error('Not authorized to delete this post');

    // Delete post (comments and likes will be cascade deleted)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
};

// Share post function (placeholder)
export const sharePost = async (postId: string): Promise<boolean> => {
  try {
    console.log('Sharing post:', postId);
    return true;
  } catch (error) {
    console.error('Error sharing post:', error);
    return false;
  }
};

// Send friend request (placeholder)
export const sendFriendRequest = async (receiverId: string): Promise<boolean> => {
  try {
    console.log('Sending friend request to:', receiverId);
    return false; // Not implemented yet
  } catch (error) {
    console.error('Error sending friend request:', error);
    return false;
  }
};

// Get friends list (placeholder)
export const getFriendsList = async (): Promise<Tables<'user_profiles'>[]> => {
  try {
    return [];
  } catch (error) {
    console.error('Error getting friends list:', error);
    return [];
  }
};

// Get friend requests (placeholder)
export const getFriendRequests = async (): Promise<FriendRequest[]> => {
  try {
    return [];
  } catch (error) {
    console.error('Error getting friend requests:', error);
    return [];
  }
};

// Accept friend request (placeholder)
export const acceptFriendRequest = async (requestId: string): Promise<boolean> => {
  try {
    console.log('Accepting friend request:', requestId);
    return false; // Not implemented yet
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
};

// Reject friend request (placeholder)
export const rejectFriendRequest = async (requestId: string): Promise<boolean> => {
  try {
    console.log('Rejecting friend request:', requestId);
    return false; // Not implemented yet
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return false;
  }
};

// Sync user data (placeholder)
export const syncUserData = async (userId: string): Promise<Tables<'user_profiles'> | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return profile;
  } catch (error) {
    console.error('Error syncing user data:', error);
    return null;
  }
};

// Get friends posts (placeholder)
export const getFriendsPosts = async (): Promise<any[]> => {
  try {
    return await getPostsWithDetails(); // For now, return all posts
  } catch (error) {
    console.error('Error getting friends posts:', error);
    return [];
  }
};
