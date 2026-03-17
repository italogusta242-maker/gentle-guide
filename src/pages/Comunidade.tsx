import { useState, useEffect } from "react";
import { Shield, MessageCircle, Trophy } from "lucide-react";
import { AvisosTab } from "@/components/comunidade/AvisosTab";
import { ChatTab } from "@/components/comunidade/ChatTab";
import { GymRatsTab } from "@/components/comunidade/GymRatsTab";

type TabType = "avisos" | "geral" | "gymrats";

export default function Comunidade() {
  const [activeTab, setActiveTab] = useState<TabType>("geral");
  const [isLoading, setIsLoading] = useState(true);

  // Simulate network request
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [activeTab]); // Reset loading when tab changes to show the skeleton

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 transition-colors duration-500">
      <div className="max-w-3xl mx-auto pt-8 px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="font-cinzel text-3xl md:text-5xl font-black italic tracking-tighter uppercase">
            COMUNI<span className="text-accent">DADE</span>
          </h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            Shape Insano • Gladiador
          </p>
        </div>

        {/* Segmented Control / Tabs */}
        <div className="bg-secondary/30 border border-border/50 p-1.5 rounded-2xl flex items-center mb-8 sticky top-4 z-20 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("geral")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "geral" ? "bg-accent text-white shadow-[0_0_15px_rgba(255,107,0,0.3)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            <MessageCircle size={18} />
            <span className="hidden sm:inline">Comunidade</span>
            <span className="sm:hidden">Geral</span>
          </button>
          <button
            onClick={() => setActiveTab("avisos")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "avisos" ? "bg-accent text-white shadow-[0_0_15px_rgba(255,107,0,0.3)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Shield size={18} />
            Avisos
          </button>
          <button
            onClick={() => setActiveTab("gymrats")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "gymrats" ? "bg-accent text-white shadow-[0_0_15px_rgba(255,107,0,0.3)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Trophy size={18} />
            Gym Rats
          </button>
        </div>

        {/* Tab Content */}
        <div className="relative">
          {activeTab === "geral" && <ChatTab isLoading={isLoading} />}
          {activeTab === "avisos" && <AvisosTab isLoading={isLoading} />}
          {activeTab === "gymrats" && <GymRatsTab isLoading={isLoading} />}
        </div>
      </div>
    </div>
  );
}
