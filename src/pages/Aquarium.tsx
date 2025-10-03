import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { OceanBackground } from "@/components/OceanBackground";
import { StarCount } from "@/components/StarCount";
import { useStars } from "@/state/StarsContext";
import { Button } from "@/components/ui/button";
import avatarFish from "@/assets/avatar-fish.png";
import { Sparkles, LogOut } from "lucide-react";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";

const Aquarium = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { stars } = useStars();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("See you soon in Ocean Adventure!");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <OceanBackground />
        <div className="relative z-10 text-center">
          <img src={avatarFish} alt="Loading" className="w-32 h-32 animate-swim mx-auto mb-4" />
          <p className="text-xl text-glow">Loading your aquarium...</p>
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
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-glow animate-float">
                Your Personal Aquarium
              </h1>
              <p className="text-lg text-white/80">
                Welcome back, Ocean Explorer! 🐠
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <StarCount count={stars} showAnimation />
              <Button
                onClick={handleLogout}
                variant="outline"
                className="glass-effect border-white/20 hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Main Aquarium Display */}
          <div className="glass-effect rounded-3xl border border-white/20 p-8 md:p-12 min-h-[500px] relative overflow-hidden shadow-[0_0_50px_hsl(var(--glow-cyan)/0.3)]">
            {/* Aquarium Background */}
            <img
              src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/b%E1%BB%83?updatedAt=1759523056092"
              alt="Aquarium Background"
              className="absolute inset-0 w-full h-full object-cover rounded-3xl"
            />
            {/* Decorative Elements */}
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-accent/20 blur-3xl animate-float z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-accent/20 blur-3xl animate-float z-10" />
            <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-accent/20 blur-3xl animate-float z-10" />
            
            
            
            
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid md:grid-cols-4 gap-4">
            <Button 
              className="ocean-button bg-primary hover:bg-primary/90 text-white h-20 text-lg font-semibold rounded-xl"
            >
              🎮 Play Games
            </Button>
            <Button 
              onClick={() => navigate("/shop")}
              className="ocean-button bg-secondary hover:bg-secondary/90 text-secondary-foreground h-20 text-lg font-semibold rounded-xl"
            >
              🛍️ Visit Shop
            </Button>
            <Button 
              onClick={() => navigate("/social")}
              className="ocean-button bg-accent hover:bg-accent/90 text-accent-foreground h-20 text-lg font-semibold rounded-xl"
            >
              👥 Social Feed
            </Button>
            <Button 
              onClick={() => navigate("/profile")}
              className="ocean-button glass-effect border-white/20 hover:bg-white/10 text-white h-20 text-lg font-semibold rounded-xl"
            >
              👤 Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Aquarium;
