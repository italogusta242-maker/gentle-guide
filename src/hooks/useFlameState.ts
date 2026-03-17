import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toLocalDate } from "@/lib/dateUtils";

export type FlameState = "normal" | "ativa" | "tregua" | "extinta";

export interface FlameResult {
  state: FlameState;
  streak: number;
  adherence: number;
}

export function useFlameState(): FlameResult & { isLoading: boolean } {
  const { user } = useAuth();
  const isMock = localStorage.getItem("USE_MOCK") === "true";

  const { data, isLoading } = useQuery({
    queryKey: ["flame-state", user?.id],
    queryFn: async (): Promise<FlameResult> => {
      if (isMock) return { state: "ativa", streak: 30, adherence: 100 };
      if (!user) return { state: "normal", streak: 0, adherence: 0 };

      const { data: flameStatus } = await supabase
        .from("flame_status")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const adherence = await calculateAdherence(user.id);

      if (flameStatus) {
        return {
          state: flameStatus.state as FlameState,
          streak: flameStatus.streak,
          adherence,
        };
      }

      const todayApproved = await isDayApproved(user.id, toLocalDate(new Date()));
      const initialState: FlameState = todayApproved ? "ativa" : "normal";
      const initialStreak = todayApproved ? 1 : 0;

      await supabase
        .from("flame_status")
        .upsert({
          user_id: user.id,
          state: initialState,
          streak: initialStreak,
          last_approved_date: todayApproved ? toLocalDate(new Date()) : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      return { state: initialState, streak: initialStreak, adherence };
    },
    enabled: !!user || isMock,
    staleTime: 5 * 60 * 1000,
  });

  return {
    state: data?.state ?? "normal",
    streak: data?.streak ?? 0,
    adherence: data?.adherence ?? 0,
    isLoading,
  };
}

async function isDayApproved(userId: string, dateStr: string): Promise<boolean> {
  const { data: workouts } = await supabase.from("workouts").select("id").eq("user_id", userId).not("finished_at", "is", null).gte("finished_at", `${dateStr}T00:00:00`).lt("finished_at", `${dateStr}T23:59:59.999`).limit(1);
  if (workouts && workouts.length > 0) return true;
  return false;
}

async function calculateAdherence(userId: string): Promise<number> {
  return 85; // Default mock for adherence calculation if needed
}
