
/**
 * Mock data for the Shape Insano ecosystem.
 * Used for rapid UI prototyping "Lovable-style".
 */

export const MOCK_USER_ID = "e5e762f7-6e07-46ef-94e9-0ab1955f3a91";

export const MOCK_PROFILE = {
  id: MOCK_USER_ID,
  nome: "Admin Italo",
  email: "italogusta242@gmail.com",
  onboarded: true,
  classe: "centurio",
  avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
  xp: 999999,
  level: 99,
  league: "pretoriano",
  dracmas: 5000,
  streak: 30,
  flame_percent: 100,
  peso: 85.5,
  altura: 180,
};

export const MOCK_ADMIN_KPI = {
  mrr: 15450.00,
  arpu: 150.00,
  activeCount: 103,
  churnRate: 2.4,
  cac: 45.00,
  tcv: 85400.00,
};

export const MOCK_REVENUE_HISTORY = [
  { month: "Jan", receita: 12000, meta: 10000 },
  { month: "Fev", receita: 13500, meta: 11000 },
  { month: "Mar", receita: 14800, meta: 12000 },
  { month: "Abr", receita: 14200, meta: 13000 },
  { month: "Mai", receita: 15600, meta: 14000 },
  { month: "Jun", receita: 16800, meta: 15000 },
];

export const MOCK_STUDENTS = [
  { 
    id: "s1", 
    nome: "Carlos Silva", 
    status: "active", 
    ultimo_treino: "2024-03-15", 
    flame_status: 85,
    foto: "https://i.pravatar.cc/150?u=s1"
  },
  { 
    id: "s2", 
    nome: "Mariana Costa", 
    status: "warning", 
    ultimo_treino: "2024-03-10", 
    flame_status: 45,
    foto: "https://i.pravatar.cc/150?u=s2"
  },
  { 
    id: "s3", 
    nome: "Roberto Junior", 
    status: "inactive", 
    ultimo_treino: "2024-02-28", 
    flame_status: 0,
    foto: "https://i.pravatar.cc/150?u=s3"
  },
];

export const MOCK_HABITS = [
  { id: "h1", nome: "Beber 3L de Água", completado: true, icon: "Droplets" },
  { id: "h2", nome: "Treino do Dia", completado: false, icon: "Dumbbell" },
  { id: "h3", nome: "10 min Meditação", completado: true, icon: "Moon" },
];
