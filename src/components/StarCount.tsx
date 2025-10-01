import { Star } from "lucide-react";
import shinyStar from "@/assets/shiny-star.png";

interface StarCountProps {
  count: number;
  showAnimation?: boolean;
}

export const StarCount = ({ count, showAnimation = false }: StarCountProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-effect border border-white/20">
      <img 
        src={shinyStar} 
        alt="Shiny Star" 
        className={cn("w-6 h-6", showAnimation && "animate-sparkle")}
      />
      <span className="font-bold text-lg text-glow">{count}</span>
      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
    </div>
  );
};

// Fix missing import
import { cn } from "@/lib/utils";
