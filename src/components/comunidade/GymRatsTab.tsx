import { useState } from "react";
import { Trophy, Medal, Flame } from "lucide-react";
import { mockGymRatsRanking, GymRatsUser } from "@/mocks/community";
import { LevelBadge } from "./LevelBadge";

interface GymRatsTabProps {
  isLoading: boolean;
}

export function GymRatsTab({ isLoading }: GymRatsTabProps) {
  const [ranking] = useState<GymRatsUser[]>(mockGymRatsRanking);
  const [selectedUser, setSelectedUser] = useState<GymRatsUser | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-card rounded-2xl animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const sortedRanking = [...ranking].sort((a, b) => a.rank - b.rank);
  const podium = sortedRanking.slice(0, 3);
  const others = sortedRanking.slice(3);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Info */}
      <div className="text-center mb-8">
        <h2 className="font-cinzel text-xl md:text-2xl font-black italic tracking-wider text-foreground uppercase flex items-center justify-center gap-2">
          <Trophy className="text-accent" /> TOP GLADIADORES
        </h2>
        <p className="text-muted-foreground text-sm mt-2">
          Mantenha a consistência, suba de nível e alcance o topo do Coliseu.
        </p>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 mb-10 h-64 pt-8">
        {/* 2nd Place */}
        {podium[1] && (
          <PodiumSeat user={podium[1]} position={2} height="h-32" color="bg-slate-300/20 text-slate-300 border-slate-300/30" />
        )}
        {/* 1st Place */}
        {podium[0] && (
          <PodiumSeat user={podium[0]} position={1} height="h-44" color="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]" isCenter />
        )}
        {/* 3rd Place */}
        {podium[2] && (
          <PodiumSeat user={podium[2]} position={3} height="h-24" color="bg-[#cd7f32]/20 text-[#cd7f32] border-[#cd7f32]/30" />
        )}
      </div>

      {/* Personal Rank Highlight (if not in top 3) */}
      {ranking.find(u => u.id === 'me' && u.rank > 3) && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                 #{ranking.find(u => u.id === 'me')?.rank}
               </div>
               <div>
                 <p className="font-bold text-foreground">Sua Posição</p>
                 <div className="flex items-center gap-2 mt-0.5">
                   <LevelBadge level={ranking.find(u => u.id === 'me')?.level} />
                   <span className="text-xs text-muted-foreground">{ranking.find(u => u.id === 'me')?.score} pts</span>
                 </div>
               </div>
            </div>
            <Flame className="text-accent" />
          </div>
          
          <div className="mt-4 border-t border-accent/10 pt-4">
             <div className="flex items-center justify-between text-xs mb-1.5">
               <span className="font-semibold text-foreground">Treinos desta semana</span>
               <span className="font-bold text-accent">{ranking.find(u => u.id === 'me')?.weeklyWorkouts}/{ranking.find(u => u.id === 'me')?.weeklyGoal}</span>
             </div>
             <div className="w-full h-1.5 bg-accent/20 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-accent rounded-full" 
                 style={{ width: `${((ranking.find(u => u.id === 'me')?.weeklyWorkouts || 0) / (ranking.find(u => u.id === 'me')?.weeklyGoal || 5)) * 100}%` }}
               />
             </div>
          </div>
        </div>
      )}

      {/* Ranking List */}
      <div className="space-y-3">
        {others.map(user => (
          <div 
            key={user.id} 
            onClick={() => setSelectedUser(user)}
            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:scale-[1.01] border transition-all ${user.id === 'me' ? 'bg-accent/5 border-accent/30' : 'bg-card border-border/50 shadow-sm'}`}
          >
            <span className="font-cinzel font-bold text-accent w-6 text-center">
              {user.rank}
            </span>
            
            <div className="w-10 h-10 rounded-full bg-secondary shrink-0 flex items-center justify-center font-cinzel font-bold text-foreground">
               {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : user.name.charAt(0)}
            </div>
            
            <div className="flex-1">
              <p className="font-bold text-foreground text-sm flex items-center gap-2">
                {user.name}
                {user.id === 'me' && <span className="text-[10px] bg-accent text-white px-1.5 rounded uppercase">Você</span>}
              </p>
              <div className="flex items-center gap-2 mt-1">
                 <LevelBadge level={user.level} />
              </div>
            </div>

            <div className="text-right flex flex-col items-end justify-center">
              <p className="font-bold text-foreground text-sm">{user.score} pts</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                <span className="font-bold text-foreground">{user.weeklyWorkouts}</span>/{user.weeklyGoal} treinos
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Profile Bottom Sheet */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative bg-card w-full max-w-3xl mx-auto rounded-t-3xl border-t border-border shadow-2xl animate-in slide-in-from-bottom-full duration-300 p-6 pb-12">
            <div className="w-12 h-1.5 bg-secondary rounded-full mx-auto mb-6" />
            
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-secondary border-4 border-background flex items-center justify-center font-cinzel font-bold text-2xl text-foreground shadow-lg shrink-0 overflow-hidden">
                {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" /> : selectedUser.name.charAt(0)}
              </div>
              <div className="pt-2">
                <h3 className="text-xl font-bold text-foreground leading-tight">{selectedUser.name}</h3>
                <div className="mt-1"><LevelBadge level={selectedUser.level} /></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
               <div className="bg-secondary/30 rounded-xl p-3 text-center">
                 <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Rank</p>
                 <p className="font-cinzel font-black text-xl text-foreground">#{selectedUser.rank}</p>
               </div>
               <div className="bg-secondary/30 rounded-xl p-3 text-center">
                 <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Pontos</p>
                 <p className="font-bold text-xl text-foreground">{selectedUser.score}</p>
               </div>
               <div className="bg-accent/10 rounded-xl p-3 text-center border border-accent/20">
                 <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Streak</p>
                 <p className="font-bold text-xl text-accent flex items-center justify-center gap-1">
                   <Flame size={18} /> {selectedUser.streak}
                 </p>
               </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-widest mb-3">Últimas Publicações</h4>
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3].map(i => (
                  <div key={i} className="aspect-square bg-secondary rounded-lg overflow-hidden border border-border/50">
                    <img src={`https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&q=80&sig=${selectedUser.id}${i}`} className="w-full h-full object-cover opacity-80" />
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

function PodiumSeat({ user, position, height, color, isCenter }: { user: GymRatsUser, position: number, height: string, color: string, isCenter?: boolean }) {
  return (
    <div className="flex flex-col items-center flex-1 max-w-[120px]">
      {/* Avatar & Info */}
      <div className={`relative flex flex-col items-center mb-3 ${isCenter ? '-mt-6 z-10' : ''}`}>
        {isCenter && <Trophy size={24} className="text-yellow-500 mb-2 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />}
        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-secondary border-2 sm:border-4 border-background flex items-center justify-center font-cinzel font-bold text-xl text-foreground z-10 shadow-lg`}>
          {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : user.name.charAt(0)}
        </div>
        <div className="mt-2 text-center">
          <p className="font-bold text-foreground text-xs sm:text-sm truncate w-20">{user.name}</p>
          <div className="mt-1 flex justify-center scale-90 sm:scale-100">
            <LevelBadge level={user.level} />
          </div>
        </div>
      </div>
      
      {/* Pedestal */}
      <div className={`w-full ${height} ${color} rounded-t-xl border-t border-l border-r flex flex-col items-center justify-start pt-4 relative overflow-hidden backdrop-blur-sm`}>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <span className="font-cinzel text-3xl font-black opacity-50 relative z-10">{position}</span>
        <span className="text-[10px] font-bold mt-1 opacity-70 relative z-10 uppercase tracking-widest">{user.score} pts</span>
      </div>
    </div>
  );
}
