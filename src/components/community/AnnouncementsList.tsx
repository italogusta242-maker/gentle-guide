import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, ShieldAlert, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AnnouncementsList() {
  const isMock = localStorage.getItem("USE_MOCK") === "true";

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["community-announcements"],
    queryFn: async () => {
      if (isMock) {
        return [
          {
            id: "1",
            title: "Novo Desafio: 30 Dias de Gladiador",
            content: "Preparem-se, o novo cronograma de treinos e dieta focado em definição extrema começa na próxima segunda-feira!",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            priority: "high"
          },
          {
            id: "2",
            title: "Live Exclusiva amanhã",
            content: "Teremos uma live com o Coach às 20h para tirar todas as dúvidas sobre o novo protocolo de suplementação.",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            priority: "normal"
          }
        ];
      }
      const { data, error } = await (supabase as any)
        .from("community_announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground bg-card/30 rounded-2xl border border-dashed border-border">
        <Megaphone className="mx-auto mb-4 opacity-10" size={64} />
        <p className="font-cinzel font-bold text-foreground/50">Sem avisos oficiais no momento</p>
        <p className="text-sm">Fique atento, novas convocações podem surgir.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement: any) => (
        <motion.div
          key={announcement.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border-l-4 border-l-accent border border-border rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={16} className="text-accent" />
            <span className="text-[10px] font-bold font-cinzel tracking-widest text-accent uppercase">
              {announcement.priority === 'high' ? 'Aviso Prioritário' : 'Aviso Oficial'}
            </span>
            <span className="flex-1" />
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-cinzel">
              <Clock size={12} />
              {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true, locale: ptBR })}
            </div>
          </div>
          <h3 className="font-cinzel font-bold text-sm text-foreground mb-1">{announcement.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{announcement.content}</p>
        </motion.div>
      ))}
    </div>
  );
}
