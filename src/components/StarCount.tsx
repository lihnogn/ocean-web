import { Star } from "lucide-react";

interface StarCountProps {
  count: number;
  showAnimation?: boolean;
}

export const StarCount = ({ count, showAnimation = false }: StarCountProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-effect border border-white/20">
      <span className="font-bold text-lg text-glow">{count}</span>
      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
    </div>
  );
};
