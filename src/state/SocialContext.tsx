import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStars } from "@/state/StarsContext";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export interface Post extends Tables<'posts'> {
  user_profile?: Tables<'user_profiles'>;
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
  user_stars?: number;
}

export interface Comment extends Tables<'comments'> {
  user_profile?: Tables<'user_profiles'>;
}

export interface UserProfile extends Tables<'user_profiles'> {
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
}

export interface StarGift extends Tables<'star_gifts'> {
  from_user_profile?: Tables<'user_profiles'>;
}

interface SocialContextValue {
  // Posts
  posts: Post[];
  loading: boolean;
  error: string | null;

  // User profile
  currentUserProfile: UserProfile | null;
  userProfiles: Record<string, UserProfile>;

  // Actions
  createPost: (text: string, imageUrl?: string) => Promise<boolean>;
  likePost: (postId: string) => Promise<boolean>;
  unlikePost: (postId: string) => Promise<boolean>;
  addComment: (postId: string, text: string) => Promise<boolean>;
  giftStars: (postId: string, toUserId: string, amount: number) => Promise<boolean>;

  // Profile
  loadUserProfile: (userId: string) => Promise<UserProfile | null>;
  updateUserProfile: (updates: Partial<Tables<'user_profiles'>>) => Promise<boolean>;

  // Suggestions
  suggestedUsers: UserProfile[];
  trendingUsers: UserProfile[];

  // Refresh
  refreshFeed: () => Promise<void>;
}

const SocialContext = createContext<SocialContextValue | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [trendingUsers, setTrendingUsers] = useState<UserProfile[]>([]);

  const { stars, spendStars, addStars } = useStars();

  // Initialize current user profile
  useEffect(() => {
    const initUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user profile exists, create if not
        let { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              username: user.email?.split('@')[0] || 'user',
              avatar_url: null,
              bio: null,
              stars: 10, // Give new users 10 stars to start
            })
            .select()
            .single();

          if (createError) throw createError;
          profile = newProfile;
        } else if (profileError) {
          throw profileError;
        }

        setCurrentUserProfile(profile);
        setUserProfiles(prev => ({ ...prev, [user.id]: profile }));
      } catch (err) {
        console.error('Error initializing user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize profile');
      }
    };

    initUserProfile();
  }, []);

  // Load posts with related data
  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          user_profile:user_profiles(*),
          likes(count),
          comments(count),
          star_gifts(amount)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      // Process posts with aggregated data
      const processedPosts: Post[] = postsData.map(post => ({
        ...post,
        likes_count: post.likes?.[0]?.count || 0,
        comments_count: post.comments?.[0]?.count || 0,
        user_stars: post.star_gifts?.reduce((sum, gift) => sum + (gift.amount || 0), 0) || 0,
        likes: undefined, // Remove the count array
        comments: undefined, // Remove the count array
        star_gifts: undefined, // Remove the gifts array
      }));

      setPosts(processedPosts);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Load suggested and trending users
  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('stars', { ascending: false })
        .limit(10);

      if (error) throw error;

      setSuggestedUsers(profiles.slice(0, 5));
      setTrendingUsers(profiles.slice(0, 10));
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  // Initialize data
  useEffect(() => {
    loadPosts();
    loadUsers();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const postsSubscription = supabase
      .channel('posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        loadPosts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
        loadPosts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        loadPosts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'star_gifts' }, () => {
        loadPosts();
        loadUsers();
      })
      .subscribe();

    return () => {
      postsSubscription.unsubscribe();
    };
  }, []);

  // Actions
  const createPost = async (text: string, imageUrl?: string): Promise<boolean> => {
    try {
      if (!currentUserProfile) {
        toast.error('Please log in to create a post');
        return false;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: currentUserProfile.user_id,
          text,
          image_url: imageUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Post created successfully!');
      return true;
    } catch (err) {
      console.error('Error creating post:', err);
      toast.error('Failed to create post');
      return false;
    }
  };

  const likePost = async (postId: string): Promise<boolean> => {
    try {
      if (!currentUserProfile) {
        toast.error('Please log in to like posts');
        return false;
      }

      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: currentUserProfile.user_id,
          post_id: postId,
        });

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error liking post:', err);
      toast.error('Failed to like post');
      return false;
    }
  };

  const unlikePost = async (postId: string): Promise<boolean> => {
    try {
      if (!currentUserProfile) return false;

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', currentUserProfile.user_id)
        .eq('post_id', postId);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error unliking post:', err);
      return false;
    }
  };

  const addComment = async (postId: string, text: string): Promise<boolean> => {
    try {
      if (!currentUserProfile) {
        toast.error('Please log in to comment');
        return false;
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: currentUserProfile.user_id,
          post_id: postId,
          text,
        });

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment');
      return false;
    }
  };

  const giftStars = async (postId: string, toUserId: string, amount: number): Promise<boolean> => {
    try {
      if (!currentUserProfile) {
        toast.error('Please log in to gift stars');
        return false;
      }

      if (currentUserProfile.user_id === toUserId) {
        toast.error('You cannot gift stars to yourself');
        return false;
      }

      if (currentUserProfile.stars < amount) {
        toast.error('Not enough stars');
        return false;
      }

      // Create star gift record
      const { error: giftError } = await supabase
        .from('star_gifts')
        .insert({
          from_user_id: currentUserProfile.user_id,
          to_user_id: toUserId,
          post_id: postId,
          amount,
        });

      if (giftError) throw giftError;

      // Update star balances
      const { error: updateFromError } = await supabase
        .from('user_profiles')
        .update({
          stars: currentUserProfile.stars - amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUserProfile.user_id);

      if (updateFromError) throw updateFromError;

      const { error: updateToError } = await supabase
        .from('user_profiles')
        .update({
          stars: userProfiles[toUserId]?.stars + amount || amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', toUserId);

      if (updateToError) throw updateToError;

      // Update local state
      setCurrentUserProfile(prev => prev ? { ...prev, stars: prev.stars - amount } : null);
      setUserProfiles(prev => ({
        ...prev,
        [toUserId]: {
          ...prev[toUserId],
          stars: prev[toUserId]?.stars + amount || amount
        }
      }));

      spendStars(amount);
      toast.success(`Gifted ${amount} stars!`);

      return true;
    } catch (err) {
      console.error('Error gifting stars:', err);
      toast.error('Failed to gift stars');
      return false;
    }
  };

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      if (userProfiles[userId]) {
        return userProfiles[userId];
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      setUserProfiles(prev => ({ ...prev, [userId]: data }));
      return data;
    } catch (err) {
      console.error('Error loading user profile:', err);
      return null;
    }
  };

  const updateUserProfile = async (updates: Partial<Tables<'user_profiles'>>): Promise<boolean> => {
    try {
      if (!currentUserProfile) return false;

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUserProfile.user_id)
        .select()
        .single();

      if (error) throw error;

      setCurrentUserProfile(data);
      setUserProfiles(prev => ({ ...prev, [currentUserProfile.user_id]: data }));

      toast.success('Profile updated successfully!');
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
      return false;
    }
  };

  const refreshFeed = async () => {
    await loadPosts();
    await loadUsers();
  };

  const value = useMemo<SocialContextValue>(() => ({
    posts,
    loading,
    error,
    currentUserProfile,
    userProfiles,
    suggestedUsers,
    trendingUsers,
    createPost,
    likePost,
    unlikePost,
    addComment,
    giftStars,
    loadUserProfile,
    updateUserProfile,
    refreshFeed,
  }), [posts, loading, error, currentUserProfile, userProfiles, suggestedUsers, trendingUsers]);

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error("useSocial must be used within SocialProvider");
  return ctx;
};
