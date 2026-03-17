import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getToday } from "@/lib/dateUtils";
import { optimisticFlameUpdate } from "@/lib/flameOptimistic";
import { checkAndUpdateFlame } from "@/lib/flameMotor";
import { onMealToggle } from "@/lib/coachNotifications";
import { MOCK_HABITS } from "@/lib/mockData";
import { useHustlePoints } from "./useHustlePoints";

export interface DailyHabit {
  id: string;
  user_id: string;
  date: string;
  water_liters: number;
  completed_meals: string[];
}

export function useDailyHabits(date?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { awardPoints } = useHustlePoints();
  const targetDate = date || getToday();
  const isMock = localStorage.getItem("USE_MOCK") === "true";

  const { data: habits, isLoading } = useQuery({
    queryKey: ["daily-habits", user?.id, targetDate],
    queryFn: async () => {
      if (isMock) {
        return {
          id: "mock-habit",
          user_id: user?.id || "mock-user",
          date: targetDate,
          water_liters: 2.5,
          completed_meals: MOCK_HABITS.filter(h => h.completado).map(h => h.id)
        } as DailyHabit;
      }
      if (!user) return null;
      const { data, error } = await supabase
        .from("daily_habits")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", targetDate)
        .maybeSingle();
      if (error) throw error;
      return data as DailyHabit | null;
    },
    enabled: !!user || isMock,
  });

  const upsertHabits = useMutation({
    mutationFn: async (updates: { water_liters?: number; completed_meals?: string[] }) => {
      if (isMock) return;
      if (!user) throw new Error("Not authenticated");

      const payload = {
        user_id: user.id,
        date: targetDate,
        ...updates,
      };

      const { error } = await supabase
        .from("daily_habits")
        .upsert(payload, { onConflict: "user_id,date" });

      if (error) throw error;
      await checkAndUpdateFlame(user.id);
    },
    onMutate: async () => {
      if (isMock) return;
      await queryClient.cancelQueries({ queryKey: ["flame-state", user?.id] });
      await queryClient.cancelQueries({ queryKey: ["daily-habits", user?.id, targetDate] });
      const previousHabits = queryClient.getQueryData(["daily-habits", user?.id, targetDate]);
      return { previousHabits };
    },
    onError: (_err, _vars, context) => {
      if (isMock) return;
      if (context?.previousHabits) {
        queryClient.setQueryData(["daily-habits", user?.id, targetDate], context.previousHabits);
      }
    },
    onSuccess: () => {},
  });

  const setWater = (liters: number) => {
    const clamped = Math.max(0, Math.min(10, liters));
    const oldWater = habits?.water_liters ?? 0;
    const newHabit = {
      ...(habits || { id: "", user_id: user?.id || "", date: targetDate, completed_meals: [] as string[] }),
      water_liters: clamped,
    };

    queryClient.setQueryData(["daily-habits", user?.id, targetDate], () => newHabit);

    if (user && !isMock) {
      const oldScore = Math.round(Math.min(oldWater / 2.5, 1) * 10);
      const newScore = Math.round(Math.min(clamped / 2.5, 1) * 10);
      optimisticFlameUpdate(queryClient, user.id, { adherenceDelta: newScore - oldScore });
      upsertHabits.mutate({ water_liters: clamped, completed_meals: habits?.completed_meals || [] });

      // Award Hustle Points for hitting water goal
      if (clamped >= 2.5 && oldWater < 2.5) {
        awardPoints({ action: "habit_water" });
      }
    }
  };

  const toggleMeal = (mealId: string, totalMeals?: number) => {
    const current = habits?.completed_meals || [];
    const isRemoving = current.includes(mealId);
    const next = isRemoving
      ? current.filter((id) => id !== mealId)
      : [...current, mealId];

    queryClient.setQueryData(
      ["daily-habits", user?.id, targetDate],
      (old: DailyHabit | null) => ({
        ...(old || { id: "", user_id: user?.id || "", date: targetDate, water_liters: 0 }),
        completed_meals: next,
      })
    );

    if (user && !isMock) {
      const mealCount = totalMeals && totalMeals > 0 ? totalMeals : 6;
      const perMealDelta = Math.round(40 / mealCount);
      const delta = isRemoving ? -perMealDelta : perMealDelta;
      optimisticFlameUpdate(queryClient, user.id, {
        adherenceDelta: delta,
        forceActive: !isRemoving && next.length >= 1,
      });
      upsertHabits.mutate({ water_liters: habits?.water_liters || 0, completed_meals: next });

      // Award Hustle Points for completing all meals (Layer 1: Registration)
      if (!isRemoving && next.length === mealCount) {
        awardPoints({ action: "diet_log" });
      }
    }
  };

  return {
    waterIntake: habits?.water_liters ?? 0,
    completedMeals: new Set(habits?.completed_meals ?? []),
    mealsCompletedCount: habits?.completed_meals?.length ?? 0,
    isLoading,
    setWater,
    toggleMeal,
  };
}

export function useDailyHabitsRange(days: number) {
  const { user } = useAuth();
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split("T")[0];
  const isMock = localStorage.getItem("USE_MOCK") === "true";

  return useQuery({
    queryKey: ["daily-habits-range", user?.id, days],
    queryFn: async () => {
      if (isMock) return [];
      if (!user) return [];
      const { data, error } = await supabase
        .from("daily_habits")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startStr)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DailyHabit[];
    },
    enabled: !!user || isMock,
  });
}
