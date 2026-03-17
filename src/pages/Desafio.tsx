import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Play, 
  Utensils, 
  Dumbbell, 
  MessageSquare, 
  BookOpen, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Lock,
  Download,
  MessageCircle,
  Clock,
  ExternalLink,
  Flame
} from "lucide-react";
import { toast } from "sonner";

// --- Mock Data ---

const banners = [
  {
    id: 1,
    titleTop: "O QUE TEM NO",
    titleMain: "DESAFIO",
    subtitle: "Descubra como transformar seu corpo em 30 dias com o método Gladiador.",
    bg: "bg-[#0A0A0A]",
    cta: "Explorar Módulos",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop",
    features: []
  },
  {
    id: 2,
    titleTop: "QUER O PAINEL DE",
    titleMain: "GLADIADOR\nCOMPLETO?",
    subtitle: "O desafio é apenas o aquecimento. No Infosaas, você tem acompanhamento especializado e acesso a ferramentas de elite:",
    bg: "bg-[#0A0A0A]",
    cta: "QUERO O ACESSO COMPLETO",
    image: "https://images.unsplash.com/photo-1541534741688-6078c64b5903?q=80&w=2070&auto=format&fit=crop",
    features: [
      "Planos de treino 100% personalizados",
      "Ajuste de macros em tempo real",
      "Comunidade exclusiva Gym Rats"
    ]
  }
];

const modules = [
  { id: "boas-vindas", title: "COMECE AQUI", icon: BookOpen, type: "lessons" },
  { id: "comunidade", title: "COMUNIDADE", icon: Users, type: "community" },
  { id: "dieta", title: "CARDÁPIOS", icon: Utensils, type: "diets" },
  { id: "treino", title: "TREINOS", icon: Dumbbell, type: "workouts" },
  { id: "bonus", title: "MATERIAIS BÔNUS", icon: Flame, type: "lessons" },
];

const lessons = [
  { id: 1, title: "Boas-vindas ao Coliseu", duration: "05:20", status: "completed", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 2, title: "Mentalidade Inabalável", duration: "12:45", status: "in-progress", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 3, title: "Como usar as planilhas", duration: "08:15", status: "locked", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
];

const diets = [
  { id: 1, name: "Cutting Gladiador", goal: "Emagrecimento", cals: "1800 kcal", tag: "Definição" },
  { id: 2, name: "Bulking de Respeito", goal: "Ganho de Massa", cals: "2800 kcal", tag: "Volume" },
];

const workouts = [
  { id: 1, name: "Full Body Iniciante", focus: "Resistência", period: "Fase 01" },
  { id: 2, name: "Push/Pull/Legs", focus: "Hipertrofia", period: "Fase 02" },
];

// --- Sub-Components ---

const BannerCarousel = () => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % banners.length);
  const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

  return (
    <div className="relative w-full h-auto min-h-[400px] md:h-[450px] overflow-hidden rounded-[2.5rem] shadow-2xl group border border-white/5">
      <AnimatePresence mode="wait">
        <motion.div
          key={banners[current].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 flex flex-col md:flex-row items-center justify-between p-8 md:p-14 ${banners[current].bg}`}
        >
          <div className="z-10 max-w-lg w-full md:w-[55%] flex flex-col items-start gap-4">
            
            <div className="flex flex-col mb-2">
              <motion.h3 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/20 font-black font-cinzel text-2xl md:text-3xl tracking-wide uppercase italic leading-tight"
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}
              >
                {banners[current].titleTop}
              </motion.h3>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[32px] md:text-[54px] font-cinzel font-black text-accent leading-[1.1] tracking-tight italic uppercase whitespace-pre-line drop-shadow-[0_0_15px_rgba(255,107,0,0.3)]"
              >
                {banners[current].titleMain}
              </motion.h2>
            </div>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground/80 md:text-white/60 text-sm md:text-base leading-relaxed max-w-[400px]"
            >
              {banners[current].subtitle}
            </motion.p>

            {banners[current].features && banners[current].features.length > 0 && (
              <motion.ul 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-3 my-4 w-full"
              >
                {banners[current].features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs md:text-sm text-white/40">
                    <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </motion.ul>
            )}

            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className={`mt-4 px-8 py-3.5 rounded-2xl font-black text-xs md:text-sm tracking-widest uppercase transition-all shadow-xl
                ${current === 1 
                  ? 'bg-white text-black hover:bg-white/90 shadow-white/10' 
                  : 'bg-accent text-white hover:bg-accent/90 shadow-accent/20'}
              `}
            >
              {banners[current].cta}
            </motion.button>
          </div>
          
          <div className="absolute right-0 top-0 h-full w-full md:w-1/2 overflow-hidden pointer-events-none opacity-20 md:opacity-100">
             <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent to-[#0A0A0A] z-10" />
             <div className="absolute inset-0 bg-[#0A0A0A]/40 z-10 mix-blend-multiply" />
             <img 
               src={banners[current].image} 
               className="w-full h-full object-cover scale-105" 
               alt="Banner" 
               style={{ filter: 'grayscale(50%) contrast(1.2)' }}
             />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-accent' : 'w-2 bg-white/20'}`} 
          />
        ))}
      </div>

      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hidden md:block">
        <ChevronLeft size={24} />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hidden md:block">
        <ChevronRight size={24} />
      </button>
    </div>
  );
};

const Challenge = () => {
  const [selectedModule, setSelectedModule] = useState(modules[0]);
  const [activeLesson, setActiveLesson] = useState(lessons[0]);
  const [addedItems, setAddedItems] = useState<string[]>([]);

  const toggleItem = (id: string, type: 'dieta' | 'treino') => {
    if (addedItems.includes(id)) return;
    setAddedItems([...addedItems, id]);
    toast.success(`${type === 'dieta' ? 'Dieta' : 'Treino'} adicionado ao seu painel principal!`, {
      description: "Agora você pode acessá-lo na aba correspondente.",
      icon: <CheckCircle2 className="text-accent" />
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        
        {/* Header - Sutil */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-cinzel font-black tracking-tighter italic">
              ÁREA DE <span className="text-accent">MEMBROS</span>
            </h1>
            <p className="text-muted mt-2 uppercase tracking-[0.3em] font-medium text-sm">
              Desafio Shape Insano • Gladiador
            </p>
          </div>
          <div className="bg-muted/40 dark:bg-white/5 border border-border dark:border-white/10 px-6 py-3 rounded-2xl flex items-center gap-4">
             <div className="h-2 w-32 bg-muted dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-accent w-1/3" />
             </div>
             <span className="text-xs font-bold text-accent">33% CONCLUÍDO</span>
          </div>
        </div>

        {/* Carousel */}
        <div className="mb-16">
          <BannerCarousel />
        </div>

        {/* Modules Grid */}
        <div className="mb-12">
          <h3 className="text-sm font-black text-foreground/30 dark:text-white/50 uppercase tracking-[0.4em] mb-6 px-2">SELECIONE O MÓDULO</h3>
          <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar scroll-smooth">
            {modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className={`flex-shrink-0 w-36 md:w-48 aspect-[3/4] rounded-3xl relative overflow-hidden group transition-all duration-300 border-2 bg-muted/20 dark:bg-transparent ${
                  selectedModule.id === mod.id ? 'border-accent scale-95 shadow-glow' : 'border-border dark:border-white/5'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10`} />
                <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20">
                  {selectedModule.id === mod.id && (
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-4 bg-accent text-[8px] font-black px-2 py-0.5 rounded-full text-white tracking-tighter"
                    >
                      EM ANDAMENTO
                    </motion.span>
                  )}
                  <mod.icon 
                    size={32} 
                    className={`mb-4 transition-all duration-300 ${selectedModule.id === mod.id ? 'text-accent scale-110' : 'text-foreground/40 dark:text-white/60'}`} 
                  />
                  <span className="text-xs md:text-sm font-black font-cinzel tracking-wider text-center leading-tight transition-colors group-hover:text-white">
                    {mod.title}
                  </span>
                </div>
                
                {selectedModule.id === mod.id && (
                  <motion.div layoutId="glow" className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-accent/40 blur-[40px]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden min-h-[600px] shadow-3xl flex flex-col items-center justify-center transition-colors">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedModule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full h-full p-6 md:p-12"
            >
              {selectedModule.type === "lessons" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Video Player + Detail */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="aspect-video bg-obsidian rounded-3xl border border-border overflow-hidden shadow-2xl relative">
                      <iframe 
                        className="w-full h-full"
                        src={activeLesson.videoUrl}
                        title="Lesson Player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                      <div>
                        <h2 className="text-2xl font-bold italic">{activeLesson.title}</h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                           <span className="flex items-center gap-1.5 text-accent"><Clock size={14}/> {activeLesson.duration}</span>
                           <span className="h-1 w-1 bg-white/20 rounded-full" />
                           <span className="text-white/40">Módulo: {selectedModule.title}</span>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all font-bold border border-white/5 group">
                         <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> Baixar PDF
                      </button>
                    </div>
                    
                    <div className="bg-background/40 rounded-3xl p-8 border border-border">
                       <h4 className="text-sm font-black uppercase text-accent tracking-[0.3em] mb-4">Sobre esta aula</h4>
                       <p className="text-muted-foreground leading-relaxed">
                         Nesta aula fundamental, mergulhamos nas estratégias do Coliseu para garantir que você saiba exatamente o que fazer 
                         nos primeiros 7 dias de transição. Foco total em consistência.
                       </p>
                    </div>
                  </div>

                  {/* Lessons List */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold italic border-l-4 border-accent pl-4">AULAS DO MÓDULO</h3>
                    <div className="space-y-3">
                      {lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLesson(lesson)}
                          disabled={lesson.status === 'locked'}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                            activeLesson.id === lesson.id 
                              ? 'bg-accent/10 border-accent/20' 
                              : lesson.status === 'locked' 
                                ? 'opacity-50 cursor-not-allowed border-transparent'
                                : 'bg-card/40 border-border hover:border-accent/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${
                               lesson.status === 'completed' 
                                 ? 'bg-green-500/20 text-green-500' 
                                 : lesson.status === 'locked'
                                   ? 'bg-white/5 text-white/20'
                                   : 'bg-accent/20 text-accent'
                             }`}>
                                {lesson.status === 'completed' ? <CheckCircle2 size={18} /> : lesson.status === 'locked' ? <Lock size={18} /> : <Play size={18} />}
                             </div>
                             <div className="text-left">
                               <p className="text-sm font-bold tracking-tight line-clamp-1">{lesson.title}</p>
                               <span className="text-[10px] text-white/40 uppercase tracking-widest">{lesson.duration}</span>
                             </div>
                          </div>
                          {lesson.status !== 'locked' && <ChevronRight size={16} className="text-white/20" />}
                        </button>
                      ))}
                    </div>

                    <div className="pt-8 border-t border-border/50">
                       <h4 className="text-[10px] font-black uppercase text-accent tracking-[0.3em] mb-4">Comentários da Aula</h4>
                       <div className="flex gap-3 mb-6">
                           <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent shrink-0">TU</div>
                           <input 
                              type="text" 
                              placeholder="Compartilhe sua experiência nesta aula..." 
                              className="flex-1 bg-background/50 border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-accent/40"
                           />
                       </div>
                       <div className="space-y-4 opacity-70">
                          <div className="flex gap-3">
                             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white/40 shrink-0">GA</div>
                             <div>
                                <p className="text-[10px] font-bold text-accent">Gabriel Alvez <span className="text-white/20 ml-2 font-normal">Há 5min</span></p>
                                <p className="text-[11px] text-muted-foreground leading-snug">Muito bem explicado, bora aplicar!</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedModule.type === "diets" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold italic">CARDÁPIOS EXCLUSIVOS</h2>
                    <span className="text-accent bg-accent/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-accent/20">
                      INFO PRODUTO
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {diets.map((diet) => (
                      <div key={diet.id} className="bg-card/50 border border-border rounded-3xl p-6 flex flex-col justify-between hover:border-accent/30 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                           <Utensils size={80} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">{diet.tag}</span>
                          <h3 className="text-xl font-bold mt-1 uppercase italic">{diet.name}</h3>
                          <p className="text-muted-foreground text-sm mt-4">{diet.goal} • {diet.cals}</p>
                        </div>
                        <div className="mt-8 flex gap-3">
                          <button 
                            disabled={addedItems.includes(`diet-${diet.id}`)}
                            onClick={() => toggleItem(`diet-${diet.id}`, 'dieta')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${
                              addedItems.includes(`diet-${diet.id}`)
                                ? 'bg-green-500/20 text-green-500 border border-green-500/20'
                                : 'bg-accent hover:bg-accent/90 text-white'
                            }`}
                          >
                            {addedItems.includes(`diet-${diet.id}`) ? <CheckCircle2 size={16}/> : <ExternalLink size={16}/>}
                            {addedItems.includes(`diet-${diet.id}`) ? 'JÁ ADICIONADA' : 'USAR NO PAINEL'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedModule.type === "workouts" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold italic">TREINOS DE ELITE</h2>
                    <span className="text-accent bg-accent/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-accent/20">
                      ACADEMIA / CASA
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workouts.map((workout) => (
                      <div key={workout.id} className="bg-card/50 border border-border rounded-3xl p-6 flex flex-col justify-between hover:border-accent/30 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                           <Dumbbell size={80} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">{workout.period}</span>
                          <h3 className="text-xl font-bold mt-1 uppercase italic">{workout.name}</h3>
                          <p className="text-muted-foreground text-sm mt-4">Foco: {workout.focus}</p>
                        </div>
                        <div className="mt-8 flex gap-3">
                           <button 
                            disabled={addedItems.includes(`workout-${workout.id}`)}
                            onClick={() => toggleItem(`workout-${workout.id}`, 'treino')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${
                              addedItems.includes(`workout-${workout.id}`)
                                ? 'bg-green-500/20 text-green-500 border border-green-500/20'
                                : 'bg-accent hover:bg-accent/90 text-white'
                            }`}
                          >
                            {addedItems.includes(`workout-${workout.id}`) ? <CheckCircle2 size={16}/> : <Flame size={16}/>}
                            {addedItems.includes(`workout-${workout.id}`) ? 'JÁ ADICIONADO' : 'USAR NO PAINEL'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedModule.type === "community" && (
                <div className="flex flex-col items-center justify-center py-12 text-center max-w-2xl mx-auto">
                   <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-8 border-2 border-green-500/20 animate-pulse">
                      <MessageCircle size={48} className="text-green-500" />
                   </div>
                   <h2 className="text-4xl font-black font-cinzel italic mb-4">NOSSA COMUNIDADE</h2>
                   <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                     Junte-se a centenas de gladiadores que estão trilhando o mesmo caminho que você. 
                     Dúvidas, motivação e troca de experiências direto no seu WhatsApp.
                   </p>
                   <button className="bg-green-600 hover:bg-green-700 text-white px-12 py-5 rounded-3xl font-black text-lg shadow-2xl shadow-green-600/20 flex items-center gap-4 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest">
                      Entrar no Grupo VIP <ExternalLink size={24} />
                   </button>
                   
                   <div className="mt-12 w-full max-w-md bg-accent/5 border border-accent/10 rounded-3xl p-6 flex items-center gap-4 group cursor-pointer hover:bg-accent/10 transition-all">
                      <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                         <Users size={24} />
                      </div>
                      <div className="text-left">
                         <h4 className="text-xs font-black uppercase text-accent tracking-widest">Gym Rats Hub</h4>
                         <p className="text-[10px] text-muted-foreground">Veja como outros gladiadores estão indo no desafio (Em breve)</p>
                      </div>
                      <ChevronRight size={16} className="ml-auto text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Upsell Banner */}
        <div className="mt-20">
           <div className="bg-gradient-to-br from-[#121212] to-black p-8 md:p-12 rounded-[3.5rem] border border-accent/20 shadow-glow relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent/10 rounded-full blur-[100px] border border-accent/10 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 items-center gap-12">
                 <div>
                    <h3 className="text-3xl md:text-5xl font-cinzel font-black italic mb-6 leading-tight">
                      QUER O PAINEL DE <br/><span className="text-accent">GLADIADOR COMPLETO?</span>
                    </h3>
                    <p className="text-muted-foreground text-lg mb-6 max-w-md">
                      O desafio é apenas o aquecimento. No Infosaas, você tem acompanhamento especializado e acesso a ferramentas de elite:
                    </p>
                    <ul className="space-y-3 mb-8">
                       {['Planos de treino 100% personalizados', 'Ajuste de macros em tempo real', 'Comunidade exclusiva Gym Rats'].map((item, idx) => (
                         <li key={idx} className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                            <CheckCircle2 size={16} className="text-accent" /> {item}
                         </li>
                       ))}
                    </ul>
                    <button className="bg-white text-black px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-xl">
                       QUERO O ACESSO COMPLETO
                    </button>
                 </div>
                 <div className="flex justify-center md:justify-end">
                    <img 
                      src="https://images.unsplash.com/photo-1593079831268-3381b0f02742?q=80&w=2070&auto=format&fit=crop" 
                      className="w-full max-w-sm rounded-3xl border border-white/10 rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-2xl" 
                      alt="Preview" 
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Comments Section */}
        <div className="mt-20 border-t border-white/5 pt-20">
           <div className="flex items-center gap-4 mb-12">
              <MessageSquare className="text-accent" size={32} />
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Comentários do Desafio (Geral)</h3>
           </div>

           <div className="bg-white/5 p-8 rounded-3xl border border-white/10 mb-12">
              <textarea 
                placeholder="Compartilhe sua experiência neste módulo..." 
                className="w-full bg-background/40 border border-border rounded-2xl p-6 text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-accent/40 transition-all min-h-[150px]"
              />
              <div className="flex justify-end mt-4">
                 <button className="bg-accent text-white px-10 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-accent/20">
                    ENVIAR COMENTÁRIO
                 </button>
              </div>
           </div>

           <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-6 p-6 rounded-3xl border border-white/5 h-fit bg-gradient-to-r from-white/5 to-transparent">
                   <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-black">
                      {i === 1 ? 'M' : 'J'}
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-accent">Marcus Gladius</span>
                        <span className="text-xs text-white/20">Há 2 horas</span>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Excelente conteúdo! O módulo de dietas facilitou muito minha organização semanal. 
                        A aula de boas-vindas já me deu uma clareza absurda. Bora pra cima! 🛡️🔥
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Challenge;
