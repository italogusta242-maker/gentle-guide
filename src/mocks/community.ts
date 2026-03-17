export type UserLevel = 'Prata' | 'Ouro' | 'Diamante';

export interface Announcement {
  id: string;
  author: string;
  authorRole: 'Admin' | 'Moderador';
  authorAvatar?: string;
  createdAt: string;
  content: string;
  isImportant: boolean;
  type: 'text' | 'poll' | 'event';
  eventDate?: string;
  pollOptions?: { id: string; text: string; votes: number }[];
  reactions: { emoji: string; count: number; userReacted: boolean }[];
}

export interface PostComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface PostReaction {
  emoji: string;
  count: number;
}

// Unified Chat Message Type
export interface UnifiedMessage {
  id: string;
  type: 'text' | 'post' | 'event' | 'announcement';
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorLevel?: UserLevel;
  createdAt: string;
  isCurrentUser: boolean;
  // For 'text' & 'post' & 'announcement'
  content?: string;
  // For 'post'
  imageUrl?: string;
  postReactions?: PostReaction[];
  userReactedWith?: string; // which emoji the current user clicked
  comments?: PostComment[];
}

export interface GymRatsUser {
  id: string;
  name: string;
  avatar?: string;
  level: UserLevel;
  streak: number;
  score: number;
  rank: number;
  weeklyWorkouts: number;
  weeklyGoal: number;
}

// Mocks

export const mockAvisos: Announcement[] = [
  {
    id: 'a1',
    author: 'Equipe Shape Insano',
    authorRole: 'Admin',
    createdAt: 'Hoje, 10:30',
    content: '🔥 NOVIDADE NA ÁREA! O novo módulo de hipertrofia avançada já está disponível para todos os alunos do plano anual. Não percam!',
    isImportant: true,
    type: 'text',
    reactions: [{ emoji: '🔥', count: 42, userReacted: true }, { emoji: '💪', count: 18, userReacted: false }]
  },
  {
    id: 'a2',
    author: 'Coach Vini',
    authorRole: 'Admin',
    createdAt: 'Ontem, 18:00',
    content: 'Como está o desafio dessa semana? Lembrem-se que sexta-feira temos live tira-dúvidas exclusiva aqui no painel.',
    isImportant: false,
    type: 'event',
    eventDate: 'Sexta-feira, 20:00',
    reactions: [{ emoji: '✅', count: 150, userReacted: false }]
  }
];

export const mockUnifiedChat: UnifiedMessage[] = [
  {
    id: 'e1',
    type: 'event',
    authorId: 'system',
    authorName: 'Sistema',
    createdAt: '09:00',
    content: '🔥 Carlos Eduardo completou 7 dias consecutivos de treino!',
    isCurrentUser: false
  },
  {
    id: 'c1',
    type: 'text',
    authorId: 'user_123',
    authorName: 'João Silva',
    authorLevel: 'Prata',
    createdAt: '11:00',
    content: 'Bora pra cima! Mais um dia de treino concluído.',
    isCurrentUser: false
  },
  {
    id: 'e2',
    type: 'event',
    authorId: 'system',
    authorName: 'Sistema',
    createdAt: '11:03',
    content: '⚡ João Silva concluiu o Treino B hoje — 2º dia consecutivo.',
    isCurrentUser: false
  },
  {
    id: 'p1',
    type: 'post',
    authorId: 'user_456',
    authorName: 'Carlos Eduardo',
    authorLevel: 'Prata',
    createdAt: '11:05',
    content: 'Depois de 3 meses de protocolo, finalmente batendo a meta de peso! 💪 O shape insano tá vindo.',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    postReactions: [
      { emoji: '💪', count: 32 },
      { emoji: '🔥', count: 18 },
      { emoji: '🏆', count: 5 }
    ],
    userReactedWith: '💪',
    comments: [
      { id: 'pc1', author: 'Marcos', content: 'Monstro! Parabéns pela evolução.', createdAt: '11:15' }
    ],
    isCurrentUser: false
  },
  {
    id: 'e3',
    type: 'event',
    authorId: 'system',
    authorName: 'Sistema',
    createdAt: '11:10',
    content: '🌟 Leticia Mendes subiu para o nível Ouro! Parabéns!',
    isCurrentUser: false
  },
  {
    id: 'e4',
    type: 'event',
    authorId: 'system',
    authorName: 'Sistema',
    createdAt: '11:12',
    content: '🏆 5 gladiadores treinaram hoje. E você?',
    isCurrentUser: false
  },
  {
    id: 'c2',
    type: 'text',
    authorId: 'admin_1',
    authorName: 'Coach Vini',
    authorLevel: 'Diamante',
    createdAt: '11:15',
    content: 'Excelente progresso galera! Mantenham a consistência.',
    isCurrentUser: false
  },
  {
    id: 'p2',
    type: 'post',
    authorId: 'user_789',
    authorName: 'Leticia Mendes',
    authorLevel: 'Ouro',
    createdAt: '11:30',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    content: 'Treino de pernas destruidor hoje. Alguém mais sofrendo pra subir escada? 🤣',
    postReactions: [
      { emoji: '👊', count: 12 },
      { emoji: '💪', count: 8 }
    ],
    comments: [
      { id: 'pc2', author: 'Coach Vini', content: 'É esse o espírito! O resultado vem no descanso agora.', createdAt: '11:45' },
      { id: 'pc3', author: 'Amanda', content: 'Nossa, eu também! Treino de ontem me deixou acabada.', createdAt: '12:00' }
    ],
    isCurrentUser: false
  },
  {
    id: 'c3',
    type: 'text',
    authorId: 'me',
    authorName: 'Você',
    authorLevel: 'Prata',
    createdAt: 'Agora',
    content: 'Hoje o treino foi pesado, mas sobrevivi hahaha',
    isCurrentUser: true
  }
];

export const mockGymRatsRanking: GymRatsUser[] = [
  { id: 'u1', name: 'Marcos Almeida', level: 'Diamante', streak: 45, score: 12500, rank: 1, weeklyWorkouts: 5, weeklyGoal: 5 },
  { id: 'u2', name: 'Leticia Mendes', level: 'Ouro', streak: 30, score: 11200, rank: 2, weeklyWorkouts: 4, weeklyGoal: 5 },
  { id: 'u3', name: 'Coach Vini', level: 'Diamante', streak: 120, score: 10800, rank: 3, weeklyWorkouts: 5, weeklyGoal: 5 },
  { id: 'u4', name: 'Carlos Eduardo', level: 'Prata', streak: 15, score: 8400, rank: 4, weeklyWorkouts: 3, weeklyGoal: 5 },
  { id: 'u5', name: 'João Silva', level: 'Prata', streak: 5, score: 3200, rank: 5, weeklyWorkouts: 2, weeklyGoal: 5 },
  { id: 'me', name: 'Você', level: 'Prata', streak: 12, score: 7800, rank: 45, weeklyWorkouts: 4, weeklyGoal: 5 } // Example mid-rank
];
