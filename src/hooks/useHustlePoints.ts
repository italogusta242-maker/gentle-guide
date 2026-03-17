import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type HustleAction = 
  | "workout_complete" 
  | "workout_weekly_bonus" 
  | "workout_streak"
  | "diet_log" 
  | "diet_calories" 
  | "diet_protein" 
  | "diet_all_macros" 
  | "diet_weekly_bonus"
  | "habit_water" 
  | "habit_sleep" 
  | "habit_combined_bonus"
  | "lesson_complete" 
  | "module_complete"
  | "community_post" 
  | "community_reaction_bonus";

export const pointsConfig: Record<HustleAction, number> = {
  workout_complete: 10,
  workout_weekly_bonus: 20,
  workout_streak: 3,
  diet_log: 5,
  diet_calories: 5,
  diet_protein: 3,
  diet_all_macros: 5,
  diet_weekly_bonus: 15,
  habit_water: 5,
  habit_sleep: 5,
  habit_combined_bonus: 3,
  lesson_complete: 8,
  module_complete: 15,
  community_post: 2,
  community_reaction_bonus: 3,
};

export function useHustlePoints() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMock = localStorage.getItem("USE_MOCK") === "true";

  const { data: totalPoints = 0 } = useQuery({
    queryKey: ["hustle-points-total", user?.id],
    queryFn: async () => {
      if (isMock) return 1250;
      if (!user) return 0;
      const { data, error } = await (supabase as any)
        .from("user_hustle_points")
        .select("points")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return (data as any[]).reduce((acc, curr) => acc + curr.points, 0);
    },
    enabled: !!user || isMock,
  });

  const awardPointsMutation = useMutation({
    mutationFn: async ({ action, groupId, metadata = {} }: { action: HustleAction; groupId?: string; metadata?: any }) => {
      if (isMock) return pointsConfig[action];
      if (!user) return;

      const points = pointsConfig[action];
      
      // Check if already awarded today for non-stackable actions
      const date = new Date().toISOString().split('T')[0];
      
      // Some actions can be stackable (like lessons or posts)
      const stackable = ["lesson_complete", "community_post"];
      
      if (!stackable.includes(action)) {
        const { data: existing } = await (supabase as any)
          .from("user_hustle_points")
          .select("id")
          .eq("user_id", user.id)
          .eq("action_type", action)
          .gte("created_at", `${date}T00:00:00Z`)
          .maybeSingle();

        if (existing) {
          console.log(`Action ${action} already awarded today.`);
          return;
        }
      }

      const { error: pointsError } = await (supabase as any)
        .from("user_hustle_points")
        .insert({
          user_id: user.id,
          action_type: action,
          points,
          group_id: groupId || 'global',
          metadata
        });

      if (pointsError) throw pointsError;
      
      // Update profile XP/Level
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", user.id)
        .single();
      
      if (profile && !profileError) {
        const currentXp = (profile as any).xp || 0;
        const currentLevel = (profile as any).level || 1;
        const newXp = currentXp + points;
        const newLevel = Math.floor(newXp / 1000) + 1; // Simple linear leveling: 1000xp per level
        
        await supabase
          .from("profiles")
          .update({ xp: newXp, level: newLevel } as any)
          .eq("id", user.id);
        
        if (newLevel > currentLevel) {
          toast.success(`NÍVEL SUBIU! Você agora é nível ${newLevel}! 🏛️`, {
             duration: 5000,
             icon: '👑'
          });
        }
      }

      return points;
    },
    onSuccess: (points, variables) => {
      if (points) {
        toast(`+${points} Hustle Points! 🔥`, {
          description: `Ação: ${variables.action.replace(/_/g, ' ')}`,
        });
        queryClient.invalidateQueries({ queryKey: ["hustle-points-total", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      }
    },
  });

  return {
    totalPoints,
    awardPoints: awardPointsMutation.mutate,
    awardPointsAsync: awardPointsMutation.mutateAsync,
    isAwarding: awardPointsMutation.isPending,
  };
}
