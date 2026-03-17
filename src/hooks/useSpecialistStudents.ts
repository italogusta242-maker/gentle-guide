import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_STUDENTS } from "@/lib/mockData";

export interface StudentWithDetails {
  id: string;
  name: string;
  email: string;
  status: "ativo" | "alerta" | "inativo";
  specialty: string;
  telefone: string | null;
  nascimento: string | null;
  sexo: string | null;
  peso: string | null;
  altura: string | null;
  avatar_url: string | null;
  created_at: string;
}

export const useSpecialistStudents = () => {
  const { user } = useAuth();
  const isMock = localStorage.getItem("USE_MOCK") === "true";

  return useQuery({
    queryKey: ["specialist-students", user?.id],
    queryFn: async () => {
      if (isMock) {
        return MOCK_STUDENTS.map(s => ({
          id: s.id,
          name: s.nome,
          email: `${s.id}@example.com`,
          status: s.status as any,
          specialty: "Consultoria",
          telefone: "11999999999",
          nascimento: "1990-01-01",
          sexo: "Masculino",
          peso: "80kg",
          altura: "180cm",
          avatar_url: s.foto,
          created_at: new Date().toISOString(),
        }));
      }
      if (!user) throw new Error("Not authenticated");

      const { data: links, error: linksError } = await supabase
        .from("student_specialists")
        .select("student_id, specialty")
        .eq("specialist_id", user.id);

      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      const studentIds = links.map((l) => l.student_id);

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, email, telefone, nascimento, sexo, peso, altura, avatar_url, status, created_at")
        .in("id", studentIds);

      if (profilesError) throw profilesError;

      const specMap = new Map(links.map((l) => [l.student_id, l.specialty]));

      return (profilesData ?? []).map((p): StudentWithDetails => {
        let status: "ativo" | "alerta" | "inativo" = "ativo";
        if (p.status === "inativo" || p.status === "cancelado") status = "inativo";
        else if (p.status === "pendente" || p.status === "pendente_onboarding") status = "alerta";

        return {
          id: p.id,
          name: p.nome ?? p.email ?? "Sem nome",
          email: p.email ?? "",
          status,
          specialty: specMap.get(p.id) ?? "",
          telefone: p.telefone,
          nascimento: p.nascimento,
          sexo: p.sexo,
          peso: p.peso,
          altura: p.altura,
          avatar_url: p.avatar_url ?? null,
          created_at: p.created_at,
        };
      });
    },
    enabled: !!user || isMock,
  });
};

export const useMySpecialty = () => {
  const { user } = useAuth();
  const isMock = localStorage.getItem("USE_MOCK") === "true";

  return useQuery({
    queryKey: ["my-specialty", user?.id],
    queryFn: async () => {
      if (isMock) return "admin";
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("student_specialists")
        .select("specialty")
        .eq("specialist_id", user.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data?.specialty) return data.specialty;

      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["nutricionista", "personal"]);
      if (rolesErr) throw rolesErr;
      if (roles && roles.length > 0) return roles[0].role;

      return null;
    },
    enabled: !!user || isMock,
  });
};

export const useStudentAnamnese = (studentId: string | null) => {
  const isMock = localStorage.getItem("USE_MOCK") === "true";
  return useQuery({
    queryKey: ["student-anamnese", studentId],
    queryFn: async () => {
      if (isMock) return { objetivo: "Ganho de massa", experiencia_treino: "Intermediário" };
      if (!studentId) return null;
      const { data, error } = await supabase
        .from("anamnese")
        .select("*")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!studentId || isMock,
  });
};
