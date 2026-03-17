import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group overflow-hidden"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ y: 20, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.2 }}
          className="relative z-10"
        >
          {theme === "dark" ? (
            <Moon className="w-5 h-5 text-accent" strokeWidth={2.5} />
          ) : (
            <Sun className="w-5 h-5 text-accent" strokeWidth={2.5} />
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Subtle glow behind icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
         <div className="w-4 h-4 bg-accent blur-[12px] rounded-full" />
      </div>
    </button>
  );
};

export default ThemeToggle;
