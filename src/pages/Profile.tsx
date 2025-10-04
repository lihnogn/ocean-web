import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Edit, Star, Calendar, Settings, Camera, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Navbar } from "@/components/Navbar";
import { OceanBackground } from "@/components/OceanBackground";
import { PostCard } from "@/components/PostCard";
import { useSocial, UserProfile, Post } from "@/state/SocialContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
    avatar_url: ""
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { currentUserProfile, loadUserProfile, updateUserProfile } = useSocial();

  const isOwnProfile = currentUserProfile?.user_id === userId;

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      let targetUserId = userId;

      // If no userId provided, use current user's ID
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please log in to view your profile');
          navigate('/auth');
          return;
        }
        targetUserId = user.id;
      }

      // Load user profile
      const profile = await loadUserProfile(targetUserId);
      if (!profile) {
        toast.error('User not found');
        return;
      }
      setUserProfile(profile);

      // Initialize edit form if it's own profile
      if (isOwnProfile && currentUserProfile) {
        setEditForm({
          username: currentUserProfile.username,
          bio: currentUserProfile.bio || "",
          avatar_url: currentUserProfile.avatar_url || ""
        });
        setAvatarPreview(currentUserProfile.avatar_url || null);
      }

      // Load user posts
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          user_profile:user_profiles(*),
          likes(count),
          comments(count),
          star_gifts(amount)
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process posts with aggregated data
      const processedPosts: Post[] = posts.map(post => ({
        ...post,
        likes_count: post.likes?.[0]?.count || 0,
        comments_count: post.comments?.[0]?.count || 0,
        user_stars: post.star_gifts?.reduce((sum, gift) => sum + (gift.amount || 0), 0) || 0,
        likes: undefined, // Remove the count array
        comments: undefined, // Remove the count array
        star_gifts: undefined, // Remove the gifts array
      }));

      setUserPosts(processedPosts);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB');
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      return null;
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUserProfile) return;

    setIsSaving(true);

    try {
      let avatarUrl = editForm.avatar_url;

      // Upload new avatar if provided
      if (avatarFile && avatarPreview) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Update profile
      const success = await updateUserProfile({
        username: editForm.username,
        bio: editForm.bio,
        avatar_url: avatarUrl,
      });

      if (success) {
        setIsEditModalOpen(false);
        setAvatarFile(null);
        // Reload profile data
        loadProfileData();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const formatJoinDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <OceanBackground />
        <Navbar />
        <div className="relative z-10 pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="glass-effect rounded-3xl border border-white/20 p-12 text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen relative">
        <OceanBackground />
        <Navbar />
        <div className="relative z-10 pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="glass-effect rounded-3xl border border-white/20 p-12 text-center">
              <p className="text-2xl text-white/60 mb-4">User not found</p>
              <Link to="/social">
                <Button className="bg-primary hover:bg-primary/90">
                  Back to Social Feed
                </Button>
              </Link>
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
        <div className="container mx-auto max-w-6xl">
          {/* Profile Banner */}
          <div className="relative mb-8 rounded-3xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Profile Header */}
          <div className="glass-effect rounded-3xl border border-white/20 p-8 mb-8 -mt-16 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-primary/30 shadow-lg">
                  <AvatarImage src={userProfile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-cyan-400/20 text-primary font-bold text-4xl">
                    {userProfile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Edit Avatar Button */}
                {isOwnProfile && (
                  <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 bg-primary hover:bg-primary/90 shadow-lg"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-effect border border-white/20">
                      <DialogHeader>
                        <DialogTitle className="text-white">Edit Profile</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-6">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative">
                            <Avatar className="w-24 h-24 border-2 border-primary/30">
                              <AvatarImage src={avatarPreview || undefined} />
                              <AvatarFallback className="bg-primary/20 text-primary font-bold text-2xl">
                                {editForm.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Camera className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <p className="text-sm text-white/60 text-center">
                            Click avatar to upload new photo
                          </p>
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-white">Username</Label>
                          <Input
                            id="username"
                            value={editForm.username}
                            onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            placeholder="Enter your username"
                          />
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                          <Label htmlFor="bio" className="text-white">Bio</Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                            placeholder="Tell us about yourself..."
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                            className="border-white/20 text-white/80 hover:bg-white/10"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {isSaving ? (
                              <>
                                <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-bold text-white">
                    {userProfile.username}
                  </h1>

                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditModalOpen(true)}
                      className="border-white/20 text-white/80 hover:bg-white/10"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {userProfile.bio && (
                  <p className="text-white/80 mb-4 leading-relaxed max-w-2xl">{userProfile.bio}</p>
                )}

                <div className="flex items-center gap-6 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {formatJoinDate(userProfile.created_at)}
                  </div>

                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ⭐ {userProfile.stars} stars earned
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/20">
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="text-3xl font-bold text-primary mb-1">{userPosts.length}</div>
                <div className="text-sm text-white/60">Posts</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="text-3xl font-bold text-primary mb-1">
                  {userProfile.followers_count || 0}
                </div>
                <div className="text-sm text-white/60">Followers</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="text-3xl font-bold text-primary mb-1">
                  {userProfile.following_count || 0}
                </div>
                <div className="text-sm text-white/60">Following</div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20 mb-6">
              <TabsTrigger value="posts" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Posts ({userPosts.length})
              </TabsTrigger>
              <TabsTrigger value="about" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                About
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6">
              {userPosts.length === 0 ? (
                <div className="glass-effect rounded-3xl border border-white/20 p-12 text-center">
                  <div className="text-6xl mb-4">🌊</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                  <p className="text-white/60 mb-6">
                    {isOwnProfile ? 'Share your first post with the ocean community!' : `${userProfile.username} hasn't posted anything yet.`}
                  </p>
                  {isOwnProfile && (
                    <Link to="/social">
                      <Button className="mt-4 bg-primary hover:bg-primary/90">
                        Create Your First Post
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </TabsContent>

            <TabsContent value="about">
              <div className="glass-effect rounded-3xl border border-white/20 p-8">
                <h3 className="text-2xl font-semibold text-white mb-6">About {userProfile.username}</h3>

                {userProfile.bio ? (
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-primary mb-2">Bio</h4>
                    <p className="text-white/80 leading-relaxed">{userProfile.bio}</p>
                  </div>
                ) : (
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-primary mb-2">Bio</h4>
                    <p className="text-white/60">
                      {isOwnProfile ? 'Tell the community about yourself!' : 'No bio available.'}
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-primary mb-3">Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="text-white/80">
                          Member since {formatJoinDate(userProfile.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <Star className="w-5 h-5 text-yellow-400" />
                        <span className="text-white/80">
                          ⭐ {userProfile.stars} stars earned from the community
                        </span>
                      </div>

                      {userPosts.length > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">P</span>
                          </div>
                          <span className="text-white/80">
                            {userPosts.length} post{userPosts.length !== 1 ? 's' : ''} shared
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <div className="w-5 h-5 rounded-full bg-cyan-400/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-cyan-400">F</span>
                        </div>
                        <span className="text-white/80">
                          {userProfile.followers_count || 0} followers
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {isOwnProfile && (
                  <div className="mt-8 pt-6 border-t border-white/20">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditModalOpen(true)}
                      className="border-white/20 text-white/80 hover:bg-white/10"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
