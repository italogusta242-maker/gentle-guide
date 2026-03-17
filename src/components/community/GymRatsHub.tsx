import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Medal, User, Zap, ChevronUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export function GymRatsHub() {
  const { user } = useAuth();
  const isMock = localStorage.getItem("USE_MOCK") === "true";

  const { data: ranking, isLoading } = useQuery({
    queryKey: ["gym-rats-ranking", user?.id],
    queryFn: async () => {
      if (isMock) {
        return [
          { user_id: "1", nome: "Marcus Aurelius", xp: 12500, level: 12, points: 450, change: 'up', position: 1 },
          { user_id: "2", nome: "Seneca", xp: 11200, level: 11, points: 420, change: 'down', position: 2 },
          { user_id: user?.id, nome: "Você (Gladiador)", xp: 9500, level: 9, points: 380, change: 'none', position: 3 },
          { user_id: "4", nome: "Epictetus", xp: 8900, level: 8, points: 350, change: 'up', position: 4 },
          { user_id: "5", nome: "Musonius Rufus", xp: 7500, level: 7, points: 310, change: 'down', position: 5 },
        ];
      }
      
      const { data: access } = await (supabase as any)
        .from("user_product_access")
        .select("group_id")
        .eq("user_id", user?.id)
        .maybeSingle();
      
      const groupId = access?.group_id || 'global';
      
      const { data, error } = await (supabase as any)
        .from("user_hustle_points")
        .select(`
          user_id,
          points,
          profiles:user_id (nome, avatar_url, level, xp)
        `)
        .eq("group_id", groupId)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      
      const grouped = (data as any[]).reduce((acc: any, curr: any) => {
        const uid = curr.user_id;
        if (!acc[uid]) {
          acc[uid] = { 
            user_id: uid, 
            nome: curr.profiles?.nome, 
            avatar_url: curr.profiles?.avatar_url,
            level: curr.profiles?.level || 1,
            xp: curr.profiles?.xp || 0,
            points: 0 
          };
        }
        acc[uid].points += curr.points;
        return acc;
      }, {});

      return Object.values(grouped)
        .sort((a: any, b: any) => b.points - a.points)
        .map((player: any, index) => ({ ...player, position: index + 1 }));
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top 3 Podium */}
      <div className="flex justify-center gap-4 mb-4 pt-10 px-2">
        {ranking?.slice(0, 3).map((player: any, idx) => {
          // idx 0 = 1st, idx 1 = 2nd, idx 2 = 3rd
          // Order them as 2nd, 1st, 3rd visually
          const visualOrder = idx === 0 ? "order-2" : idx === 1 ? "order-1" : "order-3";
          const isWinner = idx === 0;
          
          return (
            <motion.div 
              key={player.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col items-center flex-1 min-w-0 ${visualOrder}`}
            >
              <div className="relative mb-3">
                <div className={`
                  rounded-full p-1 border-2 
                  ${idx === 0 ? 'border-accent w-20 h-20 shadow-[0_0_15px_rgba(255,107,0,0.3)]' : idx === 1 ? 'border-zinc-400 w-16 h-16' : 'border-amber-700 w-16 h-16'}
                  overflow-hidden bg-card
                `}>
                  {player.avatar_url ? (
                    <img src={player.avatar_url} alt={player.nome} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={idx === 0 ? 32 : 24} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className={`
                  absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background shadow-lg font-bold text-[10px]
                  ${idx === 0 ? 'bg-accent text-white' : idx === 1 ? 'bg-zinc-400 text-black' : 'bg-amber-700 text-white'}
                `}>
                  {player.position}
                </div>
                {isWinner && (
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-orange-400"
                  >
                    <Trophy size={24} />
                  </motion.div>
                )}
              </div>
              <p className="text-[11px] font-bold font-cinzel text-foreground text-center truncate w-full px-1">{player.nome?.split(' ')[0]}</p>
              <div className="flex items-center gap-1 text-accent">
                <Zap size={10} className="fill-accent" />
                <span className="text-[10px] font-bold">{player.points} pts</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="px-2 pb-4">
        <p className="text-[10px] font-cinzel text-muted-foreground uppercase tracking-[0.2em] text-center mb-6 opacity-60">Ranking Semanal</p>
      </div>

      {/* Full List */}
      <div className="bg-card/50 border border-border/60 rounded-3xl overflow-hidden divide-y divide-border/30 backdrop-blur-sm">
        {ranking?.map((player: any) => (
          <div key={player.user_id} className={`flex items-center gap-3 p-4 transition-colors ${player.user_id === user?.id ? 'bg-accent/10' : 'hover:bg-white/5'}`}>
            <span className={`w-6 text-center font-cinzel text-xs font-bold ${player.position <= 3 ? 'text-accent' : 'text-muted-foreground'}`}>{player.position}</span>
            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden border border-border shrink-0">
               {player.avatar_url ? (
                 <img src={player.avatar_url} alt={player.nome} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center">
                   <User size={18} className="text-muted-foreground" />
                 </div>
               )}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-bold truncate flex items-center gap-2">
                 {player.nome}
                 {player.user_id === user?.id && <span className="text-[8px] bg-accent/20 text-accent px-1.5 py-0.5 rounded uppercase font-bold">Você</span>}
               </p>
               <p className="text-[10px] text-muted-foreground font-cinzel uppercase tracking-wider">Nível {player.level} • {player.xp} XP</p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 text-accent">
                <Zap size={12} className="fill-accent" />
                <span className="text-sm font-bold">{player.points}</span>
              </div>
              <div className="h-4 flex items-center">
                {player.change === 'up' && <ChevronUp size={12} className="text-green-500" />}
                {player.change === 'down' && <ChevronDown size={12} className="text-red-500" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!ranking || ranking.length === 0 && (
         <div className="text-center py-10 opacity-50">
           <Trophy size={48} className="mx-auto mb-2 opacity-10" />
           <p className="text-xs font-cinzel">A arena ainda está vazia.</p>
         </div>
      )}
    </div>
  );
}
