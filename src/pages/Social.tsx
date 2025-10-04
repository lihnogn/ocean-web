import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { OceanBackground } from "@/components/OceanBackground";
import { PostComposer } from "@/components/PostComposer";
import { PostCard } from "@/components/PostCard";
import { UserSuggestions } from "@/components/UserSuggestions";
import { useSocial } from "@/state/SocialContext";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Star } from "lucide-react";

const Social = () => {
  const {
    posts,
    loading,
    error,
    currentUserProfile,
    refreshFeed
  } = useSocial();

  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to join the ocean community');
        navigate('/auth');
      }
    };

    checkAuth();
  }, [navigate]);

  // Show loading state
  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen relative">
        <OceanBackground />
        <Navbar />
        <div className="relative z-10 pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="glass-effect rounded-3xl border border-white/20 p-12 text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="ocean-dark-text/60">Loading ocean community...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen relative">
        <OceanBackground />
        <Navbar />
        <div className="relative z-10 pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="glass-effect rounded-3xl border border-white/20 p-12 text-center">
              <p className="text-xl text-red-400 mb-4">Something went wrong</p>
              <p className="ocean-dark-text/60 mb-6">{error}</p>
              <button
                onClick={refreshFeed}
                className="bg-primary hover:bg-primary/90 ocean-dark-text px-6 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <OceanBackground />
      <Navbar />

      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-3 space-y-6">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-glow animate-float">
                  Ocean Community
                </h1>
                <p className="text-xl ocean-dark-text/80 max-w-2xl mx-auto">
                  Share your ocean adventures, connect with fellow explorers, and spread some star magic! 🌊
                </p>
              </div>

              {/* Post Composer */}
              <PostComposer onPostCreated={refreshFeed} />

              {/* Feed Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold ocean-dark-text">Recent Posts</h2>
                <button
                  onClick={refreshFeed}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Refresh
                </button>
              </div>

              {/* Posts Feed */}
              <div className="space-y-6">
                {posts.length === 0 ? (
                  <div className="glass-effect rounded-3xl border border-white/20 p-12 text-center">
                    <div className="text-6xl mb-4">🌊</div>
                    <h3 className="text-xl font-semibold ocean-dark-text mb-2">No posts yet</h3>
                    <p className="ocean-dark-text/60 mb-6">
                      Be the first to share something with the ocean community!
                    </p>
                    <p className="text-sm ocean-dark-text/40">
                      Posts will appear here as you and others share your ocean adventures.
                    </p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Current User Stars */}
              {currentUserProfile && (
                <div className="glass-effect rounded-3xl border border-white/20 p-6 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold ocean-dark-text">Your Stars</span>
                  </div>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {currentUserProfile.stars}
                  </div>
                  <p className="text-sm ocean-dark-text/60">
                    Gift stars to show appreciation for great posts!
                  </p>
                </div>
              )}

              {/* User Suggestions */}
              <UserSuggestions />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Social;
