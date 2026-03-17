import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_PROFILE } from "@/lib/mockData";

export const useProfile = () => {
  const { user } = useAuth();
  const isMock = localStorage.getItem("USE_MOCK") === "true";

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (isMock) return MOCK_PROFILE;
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user || isMock,
  });
};
