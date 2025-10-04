import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Gamepad2, ShoppingBag, Fish, Users, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StarCount } from "@/components/StarCount";
import { useStars } from "@/state/StarsContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/games", label: "Games", icon: Gamepad2 },
  { path: "/shop", label: "Shop", icon: ShoppingBag },
  { path: "/aquarium", label: "Aquarium", icon: Fish },
  { path: "/social", label: "Social", icon: Users },
];

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { stars } = useStars();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <Fish className="w-8 h-8 text-primary animate-swim" />
            <span className="text-xl font-bold text-glow">Ocean Adventure</span>
          </Link>

          <div className="flex items-center gap-4">
            <StarCount count={stars} />
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all duration-300",
                    "hover:scale-105 hover:bg-white/10",
                    isActive && "bg-primary/20 text-primary shadow-[0_0_20px_hsl(var(--glow-cyan)/0.4)]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* Profile Link - only show if logged in */}
            {isLoggedIn && (
              <Link
                to="/profile"
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all duration-300",
                  "hover:scale-105 hover:bg-white/10",
                  location.pathname.startsWith('/profile') && "bg-primary/20 text-primary shadow-[0_0_20px_hsl(var(--glow-cyan)/0.4)]"
                )}
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Profile</span>
              </Link>
            )}

            {/* Logout Button - only show if logged in */}
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="ocean-dark-text/70 hover:ocean-dark-text hover:bg-red-500/10 ml-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm ml-1">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
