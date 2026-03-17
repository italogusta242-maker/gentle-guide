import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "./PostCard";
import { Loader2, MessageSquare } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { motion } from "framer-motion";

export function CommunityFeed() {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ["community-posts"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await (supabase as any)
        .from("community_posts")
        .select(`
          *,
          profiles:user_id (nome, avatar_url),
          community_reactions (user_id, reaction_type)
        `)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + 9);

      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length * 10 : undefined;
    },
    initialPageParam: 0,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === "pending") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (data?.pages[0]?.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground bg-card/30 rounded-2xl border border-dashed border-border">
        <MessageSquare className="mx-auto mb-4 opacity-10" size={64} />
        <p className="font-cinzel font-bold text-foreground/50">O Feed está silencioso...</p>
        <p className="text-sm">Seja o primeiro gladiador a compartilhar sua vitória!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data?.pages.map((page, i) => (
        <div key={i} className="flex flex-col gap-6">
          {page.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ))}
      
      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <Loader2 className="animate-spin text-accent" size={24} />
          ) : (
            <p className="text-xs text-muted-foreground font-cinzel tracking-widest">DESCENDO AO CAMPO DE BATALHA</p>
          )}
        </div>
      )}

      {!hasNextPage && data && data.pages[0].length > 0 && (
        <p className="text-center text-[10px] text-muted-foreground font-cinzel tracking-widest py-10 opacity-50">
          — VOCÊ CHEGOU AO INÍCIO DA JORNADA —
        </p>
      )}
    </div>
  );
}
