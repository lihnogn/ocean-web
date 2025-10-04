import { useState, useRef } from "react";
import { Send, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSocial } from "@/state/SocialContext";
import { toast } from "sonner";
import { createPostWithContent } from "@/lib/supabase/social";
import { supabase } from "@/integrations/supabase/client";

interface PostComposerProps {
  onPostCreated?: () => void;
}

export const PostComposer = ({ onPostCreated }: PostComposerProps) => {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentUserProfile } = useSocial();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && !imageFile) {
      toast.error('Please add some text or an image to your post');
      return;
    }

    if (!currentUserProfile) {
      toast.error('Please log in to create a post');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined;

      // Upload image if present
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          setIsSubmitting(false);
          return;
        }
      }

      // Create post
      const success = await createPostWithContent(text.trim(), imageUrl);

      if (success) {
        setText("");
        setImageFile(null);
        setImagePreview(null);
        onPostCreated?.();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!currentUserProfile) {
    return (
      <div className="glass-effect rounded-3xl border border-white/20 p-8 text-center">
        <p className="ocean-dark-text/60 text-lg">Please sign in to join the ocean community</p>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-3xl border border-white/20 p-4 sm:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-primary/30 flex-shrink-0">
          <AvatarImage src={currentUserProfile.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
            {currentUserProfile.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-4 w-full">
          <Textarea
            placeholder="Share something with the ocean community..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] bg-white/10 border-white/20 ocean-dark-text placeholder:ocean-dark-text/50 resize-none focus:border-primary/50 focus:ring-primary/20"
            disabled={isSubmitting}
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-64 object-cover rounded-lg border border-white/20"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                Remove
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isSubmitting}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="border-white/20 ocean-dark-text/80 hover:bg-white/10 hover:ocean-dark-text"
              >
                <Image className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add Image</span>
                <span className="sm:hidden">Image</span>
              </Button>

              <span className="text-sm ocean-dark-text/60 hidden sm:inline">
                Press Ctrl+Enter to post
              </span>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!text.trim() && !imageFile)}
              className="bg-primary hover:bg-primary/90 ocean-dark-text w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
