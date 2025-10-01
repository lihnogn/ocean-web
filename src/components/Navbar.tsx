import { Link, useLocation } from "react-router-dom";
import { Home, Gamepad2, ShoppingBag, Fish, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/games", label: "Games", icon: Gamepad2 },
  { path: "/shop", label: "Shop", icon: ShoppingBag },
  { path: "/aquarium", label: "Aquarium", icon: Fish },
  { path: "/social", label: "Social", icon: Users },
  { path: "/profile", label: "Profile", icon: User },
];

export const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <Fish className="w-8 h-8 text-primary animate-swim" />
            <span className="text-xl font-bold text-glow">Ocean Adventure</span>
          </Link>

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
          </div>
        </div>
      </div>
    </nav>
  );
};
