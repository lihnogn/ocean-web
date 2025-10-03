import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OceanBackground } from "@/components/OceanBackground";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";
import { useStars } from "@/state/StarsContext";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { setStars } = useStars();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate("/aquarium");
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate("/aquarium");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        toast.success("Welcome back to Ocean Adventure!");
      } else {
        const redirectUrl = `${window.location.origin}/aquarium`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        
        if (error) throw error;
        toast.success("Welcome to Ocean Adventure! You earned your first Shiny Star! 🌟");
        // Initialize stars to 1 for new users
        setStars(1);
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <OceanBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-effect p-8 rounded-3xl border border-white/20 shadow-[0_0_50px_hsl(var(--glow-cyan)/0.3)]">
          {/* Background GIF above Welcome text */}
          <div className="relative mb-6 overflow-hidden rounded-2xl">
            <img
              src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/BRIEF%20GIAO%20DIE%CC%A3%CC%82N.gif?updatedAt=1759328372189"
              alt="Ocean Adventure Background"
              className="w-full h-40 md:h-48 object-cover pointer-events-none select-none"
            />
          </div>

          <h2 className="text-3xl font-bold text-center mb-6 text-glow">
            {isLogin ? "Welcome Back!" : "Join the Adventure"}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-effect border-white/20 focus:border-accent focus:ring-accent text-white placeholder:text-white/50"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass-effect border-white/20 focus:border-accent focus:ring-accent text-white placeholder:text-white/50"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] bg-gradient-to-r from-cyan-200/30 via-blue-300/35 to-purple-300/40 hover:from-cyan-100/40 hover:via-blue-200/45 hover:to-purple-200/50 text-cyan-50 border border-cyan-200/40 backdrop-blur-sm py-6 text-lg font-semibold rounded-xl"
            >
              {loading ? "Loading..." : isLogin ? "Dive In" : "Start Adventure"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-accent hover:text-accent/80 transition-colors underline"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>

          {!isLogin && (
            <p className="mt-4 text-sm text-white/70 text-center">
              🌟 Daily login rewards: Earn 1 Shiny Star every day!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
