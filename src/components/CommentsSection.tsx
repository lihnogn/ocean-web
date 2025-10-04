import { useState, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useSocial, Comment } from "@/state/SocialContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getComments, addComment as addCommentAPI } from "@/lib/supabase/social";

interface CommentsSectionProps {
  postId: string;
}

export const CommentsSection = ({ postId }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { currentUserProfile } = useSocial();

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        const data = await getComments(postId);
        setComments(data || []);
      } catch (error) {
        console.error('Error loading comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    loadComments();

    // Subscribe to new comments
    const commentsSubscription = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, (payload) => {
        // Reload comments when new one is added
        loadComments();
      })
      .subscribe();

    return () => {
      commentsSubscription.unsubscribe();
    };
  }, [postId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!currentUserProfile) {
      toast.error('Please log in to comment');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await addCommentAPI(postId, newComment.trim());

      if (success) {
        setNewComment("");
        toast.success('Comment added!');
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  if (!currentUserProfile) {
    return (
      <div className="text-center py-4">
        <p className="text-white/60">Please sign in to view and add comments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing Comments */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4">
            <MessageCircle className="w-8 h-8 text-white/40 mx-auto mb-2" />
            <p className="text-white/60">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
              <Avatar className="w-8 h-8 border border-white/20">
                <AvatarImage src={comment.user_profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {comment.user_profile?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white text-sm">
                    {comment.user_profile?.username}
                  </span>
                  <span className="text-xs text-white/50">
                    {formatTimestamp(comment.created_at)}
                  </span>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  {comment.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment */}
      <div className="flex items-end gap-3 pt-3 border-t border-white/20">
        <Avatar className="w-8 h-8 border border-white/20">
          <AvatarImage src={currentUserProfile.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {currentUserProfile.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <Textarea
            placeholder="Write a comment... (Ctrl+Enter to post)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none focus:border-primary/50 focus:ring-primary/20"
            disabled={isSubmitting}
          />
        </div>

        <Button
          onClick={handleSubmitComment}
          disabled={isSubmitting || !newComment.trim()}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white h-10 px-4"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
