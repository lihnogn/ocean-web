import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OceanBackground } from "@/components/OceanBackground";
import heroOcean from "@/assets/hero-ocean.jpg";
import { Sparkles } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <OceanBackground />
      
      {/* Hero Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
        style={{ backgroundImage: `url(${heroOcean})` }}
      />
      
      {/* Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
        <img
          src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/chu%20chinh?updatedAt=1759522141811"
          alt="Ocean Adventure"
          className="mx-auto mb-6 w-full max-w-[80%] h-auto"
        />
        <p className="text-2xl md:text-3xl mb-4 text-white/90 animate-float-slow">
          Explore Your Mysterious Ocean
        </p>
        <p className="text-lg md:text-xl mb-12 text-white/80 max-w-2xl mx-auto">
          Dive into an immersive underwater world filled with games, collectibles, and your very own personal aquarium
        </p>
        
        <Button
          onClick={() => navigate("/auth")}
          size="lg"
          className="ocean-button bg-primary hover:bg-primary/90 text-white px-8 py-6 text-xl font-semibold rounded-2xl shadow-[0_0_30px_hsl(var(--glow-cyan)/0.6)]"
        >
          <Sparkles className="w-6 h-6 mr-2 animate-sparkle" />
          Start Journey
        </Button>
        {/* Decorative Elements */}
        <div className="absolute -top-10 left-10 w-20 h-20 rounded-full bg-accent/30 blur-2xl animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-primary/20 blur-3xl animate-float-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-10 left-1/3 w-24 h-24 rounded-full bg-secondary/30 blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        {/* No title animations; GIF animates itself */}
      </div>
    </div>
  );
};

export default Landing;
