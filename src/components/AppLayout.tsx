import { Outlet, useLocation, Link } from "react-router-dom";
import BottomNav from "./BottomNav";
import ThemeToggle from "./ThemeToggle";
import NotificationCenter from "@/components/NotificationCenter";
import PushPermissionBanner from "@/components/PushPermissionBanner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { MessageCircle, User } from "lucide-react";
import { motion } from "framer-motion";

interface AppLayoutProps {
  dishonorMode: boolean;
  setDishonorMode: (v: boolean) => void;
}

const AppLayout = ({ dishonorMode, setDishonorMode }: AppLayoutProps) => {
  const { pushState, requestPermission } = usePushNotifications();
  const location = useLocation();

  // Hide top notification bar on chat conversation pages and the main dashboard
  // (they have their own headers or we want a cleaner look)
  const isChatConversation = /^\/aluno\/chat\/[^/]+/.test(location.pathname);
  const isDashboard = location.pathname === "/aluno" || location.pathname === "/aluno/";
  const hideHeader = isChatConversation || isDashboard;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar with notification center — hidden inside chat conversations and dashboard */}
      {!hideHeader && (
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-2 bg-background/80 blur-backdrop border-b border-border/50">
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2">
            <Link to="/aluno/chat">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
              >
                <MessageCircle size={20} />
              </motion.button>
            </Link>
            <NotificationCenter />
            <Link to="/aluno/perfil">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
              >
                <User size={20} />
              </motion.button>
            </Link>
          </div>
        </header>
      )}
      <PushPermissionBanner pushState={pushState} onRequestPermission={requestPermission} />
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
