import { TrendingUp, Users, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocial, UserProfile } from "@/state/SocialContext";
import { Link } from "react-router-dom";

interface UserSuggestionsProps {
  className?: string;
}

export const UserSuggestions = ({ className }: UserSuggestionsProps) => {
  const { suggestedUsers, trendingUsers, currentUserProfile } = useSocial();

  const UserCard = ({ user }: { user: UserProfile }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <Avatar className="w-10 h-10 border-2 border-primary/30">
        <AvatarImage src={user.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
          {user.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${user.user_id}`}
          className="font-medium text-white hover:text-primary transition-colors text-sm block truncate"
        >
          {user.username}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-white/60">{user.stars}</span>
          </div>
          {user.posts_count && (
            <span className="text-xs text-white/60">{user.posts_count} posts</span>
          )}
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="text-xs border-primary/30 text-primary hover:bg-primary/10"
      >
        Follow
      </Button>
    </div>
  );

  return (
    <div className={className}>
      {/* Trending Users */}
      <div className="glass-effect rounded-3xl border border-white/20 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-white">Trending Users</h3>
        </div>

        <div className="space-y-3">
          {trendingUsers.slice(0, 5).map((user) => (
            <UserCard key={user.user_id} user={user} />
          ))}
        </div>
      </div>

      {/* Suggested Users */}
      <div className="glass-effect rounded-3xl border border-white/20 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-white">Suggested for You</h3>
        </div>

        <div className="space-y-3">
          {suggestedUsers.map((user) => (
            <UserCard key={user.user_id} user={user} />
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full mt-4 text-primary hover:text-primary/80 hover:bg-primary/10"
        >
          Show More
        </Button>
      </div>

      {/* Current User Stats */}
      {currentUserProfile && (
        <div className="glass-effect rounded-3xl border border-white/20 p-4 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-12 h-12 border-2 border-primary/30">
              <AvatarImage src={currentUserProfile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {currentUserProfile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <Link
                to={`/profile/${currentUserProfile.user_id}`}
                className="font-semibold text-white hover:text-primary transition-colors"
              >
                {currentUserProfile.username}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-white/60">{currentUserProfile.stars}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-lg font-bold text-primary">{currentUserProfile.posts_count || 0}</div>
              <div className="text-xs text-white/60">Posts</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-lg font-bold text-primary">{currentUserProfile.followers_count || 0}</div>
              <div className="text-xs text-white/60">Followers</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-lg font-bold text-primary">{currentUserProfile.following_count || 0}</div>
              <div className="text-xs text-white/60">Following</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
