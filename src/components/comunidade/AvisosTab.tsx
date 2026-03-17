import { useState } from "react";
import { Megaphone, Calendar, CheckCircle2 } from "lucide-react";
import { mockAvisos, Announcement } from "@/mocks/community";

interface AvisosTabProps {
  isLoading: boolean;
}

export function AvisosTab({ isLoading }: AvisosTabProps) {
  const [avisos, setAvisos] = useState<Announcement[]>(mockAvisos);

  const handleReact = (avisoId: string, emojiStr: string) => {
    setAvisos(prev => 
      prev.map(aviso => {
        if (aviso.id === avisoId) {
          const updatedReactions = aviso.reactions.map(r => 
            r.emoji === emojiStr 
              ? { ...r, count: r.userReacted ? r.count - 1 : r.count + 1, userReacted: !r.userReacted }
              : r
          );
          return { ...aviso, reactions: updatedReactions };
        }
        return aviso;
      })
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => <AnnouncementSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {avisos.map(aviso => (
        <AnnouncementCard key={aviso.id} aviso={aviso} onReact={handleReact} />
      ))}
    </div>
  );
}

function AnnouncementCard({ aviso, onReact }: { aviso: Announcement, onReact: (id: string, emoji: string) => void }) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-cinzel font-bold text-accent shrink-0">
          {aviso.authorAvatar ? (
            <img src={aviso.authorAvatar} alt={aviso.author} className="w-full h-full rounded-full object-cover" />
          ) : (
            aviso.author.charAt(0)
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">{aviso.author}</h3>
            <span className="px-2 py-0.5 rounded-full bg-accent/10 sm:text-[10px] text-[8px] font-black tracking-widest text-accent uppercase">
              {aviso.authorRole}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{aviso.createdAt}</p>
        </div>
        {aviso.isImportant && (
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Megaphone size={16} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="text-foreground/90 text-sm leading-relaxed mb-5">
        {aviso.content}
      </div>

      {/* Enquete/Event Extra */}
      {aviso.type === 'event' && aviso.eventDate && (
        <div className="bg-secondary/40 rounded-xl p-4 mb-5 flex items-center justify-between border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Data do Evento</p>
              <p className="text-sm font-semibold text-foreground">{aviso.eventDate}</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent font-semibold text-xs rounded-lg transition-colors">
            Confirmar Presença
          </button>
        </div>
      )}

      {/* Footer / Reações */}
      <div className="pt-4 border-t border-border/50 flex flex-wrap gap-2">
        {aviso.reactions.map((reaction, i) => (
          <button
            key={i}
            onClick={() => onReact(aviso.id, reaction.emoji)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${reaction.userReacted ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border border-transparent'}`}
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AnnouncementSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-12 bg-accent/20 rounded-full animate-pulse" />
          </div>
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-3 mb-5">
        <div className="h-3 w-full bg-muted rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-muted rounded animate-pulse" />
        <div className="h-3 w-4/6 bg-muted rounded animate-pulse" />
      </div>
      <div className="pt-4 border-t border-border/50 flex gap-2">
        <div className="h-8 w-16 bg-secondary/50 rounded-full animate-pulse" />
        <div className="h-8 w-16 bg-secondary/50 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
