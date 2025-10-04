import { useState } from "react";
import { Heart, MessageCircle, Star, MoreHorizontal, ExternalLink, Share, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useSocial, Post } from "@/state/SocialContext";
import { CommentsSection } from "./CommentsSection";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { likePost, sharePost as sharePostAPI, editPost, deletePost } from "@/lib/supabase/social";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editText, setEditText] = useState(post.text || "");
  const [isEditing, setIsEditing] = useState(false);

  const {
    currentUserProfile,
    giftStars,
  } = useSocial();

  const handleLike = async () => {
    if (!currentUserProfile) {
      toast.error('Please log in to like posts');
      return;
    }

    setIsLiking(true);

    try {
      const success = await likePost(post.id);
      if (success) {
        toast.success(post.user_liked ? 'Post unliked' : 'Post liked');
      } else {
        toast.error('Failed to like post');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!currentUserProfile) {
      toast.error('Please log in to share posts');
      return;
    }

    const success = await sharePostAPI(post.id);
    if (success) {
      toast.success('Post shared successfully!');
    } else {
      toast.error('Failed to share post');
    }
  };

  const handleGiftStars = async (amount: number) => {
    if (!currentUserProfile || !post.user_profile) return;

    const success = await giftStars(post.id, post.user_profile.user_id, amount);
    if (success) {
      toast.success(`Gifted ${amount} stars! 🌟`);
    }
  };

  const handleEditPost = async () => {
    if (!editText.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    setIsEditing(true);

    try {
      const success = await editPost(post.id, editText.trim());
      if (success) {
        toast.success('Post updated successfully!');
        setIsEditModalOpen(false);
      } else {
        toast.error('Failed to update post');
      }
    } catch (error) {
      console.error('Error editing post:', error);
      toast.error('Failed to update post');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await deletePost(post.id);
      if (success) {
        toast.success('Post deleted successfully!');
      } else {
        toast.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const isOwnPost = currentUserProfile?.user_id === post.user_profile?.user_id;

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

        {/* Default More button (hidden when owner menu is shown) */}
        {!isOwnPost && (
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Post Actions Menu (only for post owner) */}
      {isOwnPost && (
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-600">
              <DropdownMenuItem
                onClick={() => {
                  setEditText(post.text || "");
                  setIsEditModalOpen(true);
                }}
                className="text-white hover:bg-slate-700 cursor-pointer"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Post
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeletePost}
                className="text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

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
      {(post.likes_count || post.comments_count || post.shares) && (
        <div className="flex items-center gap-2 sm:gap-4 mb-4 text-sm text-white/60 flex-wrap">
          {post.likes_count > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              <span className="font-medium">{post.likes_count}</span>
            </span>
          )}
          {post.comments_count > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">{post.comments_count}</span>
            </span>
          )}
          {post.shares > 0 && (
            <span className="flex items-center gap-1">
              <Share className="w-4 h-4 fill-blue-400 text-blue-400" />
              <span className="font-medium">{post.shares}</span>
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
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
            onClick={handleShare}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Gift Stars Dropdown - Hidden on mobile if no space */}
        {currentUserProfile && currentUserProfile.user_id !== post.user_profile.user_id && (
          <div className="flex items-center gap-1 sm:flex-shrink-0">
            <span className="text-sm text-white/60 mr-2 hidden sm:inline">Gift:</span>
            <div className="flex gap-1">
              {[1, 5, 10].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleGiftStars(amount)}
                  disabled={currentUserProfile.stars < amount}
                  className="text-xs px-2 py-1 h-7 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 hover:border-yellow-400/50"
                  title={`Gift ${amount} stars`}
                >
                  <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                  {amount}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <CommentsSection postId={post.id} />
        </div>
      )}

      {/* Edit Post Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="glass-effect border border-white/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Post</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-text" className="text-white">Post Content</Label>
              <Textarea
                id="edit-text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none focus:border-primary/50 focus:ring-primary/20"
                placeholder="Edit your post content..."
                disabled={isEditing}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="border-white/20 text-white/80 hover:bg-white/10"
                disabled={isEditing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditPost}
                disabled={isEditing || !editText.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                {isEditing ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
