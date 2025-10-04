import { useState } from "react";
import { Heart, MessageCircle, Star, MoreHorizontal, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useSocial, Post } from "@/state/SocialContext";
import { CommentsSection } from "./CommentsSection";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const {
    currentUserProfile,
    likePost,
    unlikePost,
    giftStars,
  } = useSocial();

  const handleLike = async () => {
    if (!currentUserProfile) {
      toast.error('Please log in to like posts');
      return;
    }

    setIsLiking(true);

    try {
      if (post.user_liked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleGiftStars = async (amount: number) => {
    if (!currentUserProfile || !post.user_profile) return;

    const success = await giftStars(post.id, post.user_profile.user_id, amount);
    if (success) {
      toast.success(`Gifted ${amount} stars! 🌟`);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  if (!post.user_profile) return null;

  return (
    <div className="glass-effect rounded-3xl border border-white/20 p-6 animate-fade-in hover:border-white/30 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-primary/30">
            <AvatarImage src={post.user_profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
              {post.user_profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <Link
              to={`/profile/${post.user_profile.user_id}`}
              className="font-semibold text-white hover:text-primary transition-colors"
            >
              {post.user_profile.username}
            </Link>
            <p className="text-sm text-white/60">
              {formatTimestamp(post.created_at)}
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-white/90 leading-relaxed mb-3">
          {post.text}
        </p>

        {post.image_url && (
          <div className="rounded-lg overflow-hidden border border-white/20">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}
      </div>

      {/* Stats */}
      {(post.likes_count || post.comments_count || post.user_stars) && (
        <div className="flex items-center gap-4 mb-4 text-sm text-white/60">
          {post.likes_count > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              {post.likes_count}
            </span>
          )}
          {post.comments_count > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {post.comments_count}
            </span>
          )}
          {post.user_stars > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {post.user_stars}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={`hover:bg-white/10 transition-all duration-200 ${
              post.user_liked
                ? 'text-red-400 hover:text-red-300'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Heart
              className={`w-4 h-4 mr-2 ${
                post.user_liked ? 'fill-red-400' : ''
              }`}
            />
            {post.user_liked ? 'Liked' : 'Like'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Comment
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Gift Stars Dropdown */}
        {currentUserProfile && currentUserProfile.user_id !== post.user_profile.user_id && (
          <div className="flex items-center gap-1">
            <span className="text-sm text-white/60 mr-2">Gift:</span>
            {[1, 5, 10].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => handleGiftStars(amount)}
                disabled={currentUserProfile.stars < amount}
                className="text-xs px-2 py-1 h-7 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 hover:border-yellow-400/50"
              >
                <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                {amount}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <CommentsSection postId={post.id} />
        </div>
      )}
    </div>
  );
};
