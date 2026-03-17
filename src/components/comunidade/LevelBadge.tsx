import { Trophy, Medal, Star, Shield } from "lucide-react";
import { UserLevel } from "@/mocks/community";

export function LevelBadge({ level }: { level?: UserLevel }) {
  if (!level) return null;

  const configs = {
    Bronze: {
      color: "bg-[#cd7f32]/10 text-[#cd7f32] border-[#cd7f32]/20",
      icon: <Shield size={10} className="fill-[#cd7f32]" />
    },
    Prata: {
      color: "bg-slate-300/10 text-slate-400 border-slate-300/20",
      icon: <Medal size={10} className="fill-slate-400" />
    },
    Ouro: {
      color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      icon: <Star size={10} className="fill-yellow-500" />
    },
    Diamante: {
      color: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]",
      icon: <Trophy size={10} className="fill-cyan-400" />
    }
  };

  const config = configs[level];

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded uppercase text-[8px] font-black tracking-wider border transition-colors ${config.color}`}>
      {config.icon}
      {level}
    </span>
  );
}
