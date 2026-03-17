import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Flame, Trophy, Dumbbell, MessageSquare, MoreHorizontal, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function PostCard({ post }: { post: any }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reactions = post.community_reactions || [];
  
  const hasReacted = (type: string) => 
    reactions.some((r: any) => r.user_id === user?.id && r.reaction_type === type);
    
  const getReactionCount = (type: string) => 
    reactions.filter((r: any) => r.reaction_type === type).length;

  const reactMutation = useMutation({
    mutationFn: async (type: string) => {
      if (!user) return;
      
      const existing = reactions.find((r: any) => r.user_id === user.id && r.reaction_type === type);
      
      if (existing) {
        await (supabase as any)
          .from("community_reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .eq("reaction_type", type);
      } else {
        await (supabase as any)
          .from("community_reactions")
          .insert({
            post_id: post.id,
            user_id: user.id,
            reaction_type: type
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt={post.profiles.nome} className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold font-cinzel text-foreground leading-tight">{post.profiles?.nome || "Gladiador Anônimo"}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-cinzel">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{post.content}</p>
      </div>

      {/* Media */}
      {post.media_url && (
        <div className="px-4 pb-4">
          <div className="rounded-2xl overflow-hidden border border-border aspect-video bg-secondary/20">
            <img src={post.media_url} alt="Post media" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-4">
        <ReactionButton 
          icon={<Flame size={16} />} 
          count={getReactionCount("fire")} 
          active={hasReacted("fire")}
          onClick={() => reactMutation.mutate("fire")}
          color="group-hover:text-orange-500"
          activeColor="text-orange-500 bg-orange-500/10 border-orange-500/20"
        />
        <ReactionButton 
          icon={<Dumbbell size={16} />} 
          count={getReactionCount("muscle")} 
          active={hasReacted("muscle")}
          onClick={() => reactMutation.mutate("muscle")}
          color="group-hover:text-blue-500"
          activeColor="text-blue-500 bg-blue-500/10 border-blue-500/20"
        />
        <ReactionButton 
          icon={<Trophy size={16} />} 
          count={getReactionCount("trophy")} 
          active={hasReacted("trophy")}
          onClick={() => reactMutation.mutate("trophy")}
          color="group-hover:text-yellow-500"
          activeColor="text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
        />
        
        <div className="flex-1" />
        
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:text-accent transition-colors">
          <MessageSquare size={16} />
          <span className="text-xs font-bold">0</span>
        </button>
      </div>
    </motion.div>
  );
}

function ReactionButton({ icon, count, active, onClick, color, activeColor }: any) {
  return (
    <button 
      onClick={onClick}
      className={`
        group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-transparent 
        transition-all duration-200
        ${active ? activeColor : 'text-muted-foreground hover:bg-secondary'}
      `}
    >
      <span className={active ? '' : color}>{icon}</span>
      <span className="text-xs font-bold">{count}</span>
    </button>
  );
}
