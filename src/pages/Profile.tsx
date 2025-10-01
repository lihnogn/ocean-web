import { Navbar } from "@/components/Navbar";
import { OceanBackground } from "@/components/OceanBackground";

const Profile = () => {
  return (
    <div className="min-h-screen relative">
      <OceanBackground />
      <Navbar />
      
      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-glow text-center animate-float">
            Your Profile
          </h1>
          
          <div className="glass-effect rounded-3xl border border-white/20 p-12 text-center">
            <p className="text-2xl text-white/80 mb-4">👤 Profile Customization Coming Soon!</p>
            <p className="text-white/60">Avatar • Name • Glow Color • Achievements</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
