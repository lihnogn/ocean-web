import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { OceanBackground } from "@/components/OceanBackground";
import { StarCount } from "@/components/StarCount";
import { Button } from "@/components/ui/button";
import avatarFish from "@/assets/avatar-fish.png";
import { Sparkles, LogOut } from "lucide-react";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";

const Aquarium = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [stars, setStars] = useState(1);
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
            {/* Decorative Elements */}
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-accent/20 blur-3xl animate-float" />
            <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl animate-float-slow" />
            
            {/* Avatar Fish */}
            <div className="relative flex items-center justify-center py-12">
              <img 
                src={avatarFish} 
                alt="Your Avatar Fish" 
                className="w-48 h-48 md:w-64 md:h-64 animate-swim drop-shadow-[0_0_30px_rgba(102,221,255,1)]"
              />
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="glass-effect rounded-xl p-6 text-center border border-white/10">
                <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-2 animate-sparkle" />
                <h3 className="font-bold text-lg mb-1">Daily Reward</h3>
                <p className="text-sm text-white/70">+1 Shiny Star every login</p>
              </div>

              <div className="glass-effect rounded-xl p-6 text-center border border-white/10">
                <div className="text-3xl mb-2">🎮</div>
                <h3 className="font-bold text-lg mb-1">Mini Games</h3>
                <p className="text-sm text-white/70">Coming soon!</p>
              </div>

              <div className="glass-effect rounded-xl p-6 text-center border border-white/10">
                <div className="text-3xl mb-2">🛍️</div>
                <h3 className="font-bold text-lg mb-1">Ocean Shop</h3>
                <p className="text-sm text-white/70">Customize your aquarium</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid md:grid-cols-4 gap-4">
            <Button 
              onClick={() => navigate("/games")}
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
