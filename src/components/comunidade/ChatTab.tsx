import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Heart, MessageCircle, Share2, Plus } from "lucide-react";
import { mockUnifiedChat, UnifiedMessage } from "@/mocks/community";
import { LevelBadge } from "./LevelBadge";

interface ChatTabProps {
  isLoading: boolean;
}

const AVAILABLE_REACTIONS = ["💪", "🔥", "🏆", "👊"];

export function ChatTab({ isLoading }: ChatTabProps) {
  const [messages, setMessages] = useState<UnifiedMessage[]>(mockUnifiedChat);
  const [newMessage, setNewMessage] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg: UnifiedMessage = {
      id: `c_${Date.now()}`,
      type: "text",
      authorId: "me",
      authorName: "Você",
      authorLevel: "Prata", 
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: newMessage.trim(),
      isCurrentUser: true,
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage("");
  };

  const handleReaction = (postId: string, emoji: string) => {
    setMessages(prev => 
      prev.map(msg => {
        if (msg.id === postId && msg.type === 'post') {
          let currentRevs = msg.postReactions ? [...msg.postReactions] : [];
          
          // Remove old user reaction if exists
          if (msg.userReactedWith) {
             const oldIdx = currentRevs.findIndex(r => r.emoji === msg.userReactedWith);
             if (oldIdx !== -1) {
                currentRevs[oldIdx].count -= 1;
                if (currentRevs[oldIdx].count <= 0) currentRevs.splice(oldIdx, 1);
             }
          }

          // If clicking the same emoji, just remove it entirely (unlike)
          if (msg.userReactedWith === emoji) {
             return { ...msg, postReactions: currentRevs, userReactedWith: undefined };
          }

          // Add new reaction
          const newIdx = currentRevs.findIndex(r => r.emoji === emoji);
          if (newIdx !== -1) {
             currentRevs[newIdx].count += 1;
          } else {
             currentRevs.push({ emoji, count: 1 });
          }

          return { 
            ...msg, 
            postReactions: currentRevs,
            userReactedWith: emoji
          };
        }
        return msg;
      })
    );
  };

  return (
    <div className="flex flex-col animate-in fade-in zoom-in-95 duration-500 pb-24">
      {/* Messages / Timeline */}
      <div className="flex-1 space-y-5">
        {isLoading ? (
          [1, 2, 3].map(i => <UnifiedSkeleton key={i} />)
        ) : (
          <>
            <div className="flex justify-center mb-6 mt-4">
              <span className="px-3 py-1 bg-secondary/80 rounded-full text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Hoje
              </span>
            </div>
            {messages.map(msg => (
              <UnifiedMessageBubble key={msg.id} message={msg} onReaction={(emoji) => handleReaction(msg.id, emoji)} />
            ))}
            <div ref={endOfMessagesRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="fixed bottom-[72px] md:bottom-0 left-0 right-0 p-3 sm:p-4 bg-background/90 backdrop-blur-xl border-t border-border/50 z-40">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button 
            type="button"
            className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
          >
            <ImageIcon size={20} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Mensagem para a comunidade..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full bg-secondary/40 border border-border/50 rounded-full py-2.5 pl-4 pr-4 h-11 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-11 h-11 flex flex-shrink-0 items-center justify-center rounded-full bg-accent text-white disabled:opacity-50 disabled:bg-secondary transition-all hover:shadow-[0_0_15px_rgba(255,107,0,0.4)]"
          >
            <Send size={18} className={`${newMessage.trim() ? "ml-0.5" : ""}`} />
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

function UnifiedMessageBubble({ message, onReaction }: { message: UnifiedMessage, onReaction: (emoji: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);

  if (message.type === 'event') {
    return (
      <div className="flex justify-center my-6">
        <div className="bg-accent/10 border border-accent/20 text-accent text-xs font-semibold px-4 py-2 rounded-full shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const isMe = message.isCurrentUser;

  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 w-full max-w-[90%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isMe && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-cinzel font-bold text-xs text-foreground mt-auto">
            {message.authorAvatar ? (
              <img src={message.authorAvatar} alt={message.authorName} className="w-full h-full rounded-full object-cover" />
            ) : (
              message.authorName.charAt(0)
            )}
          </div>
        )}

        {/* Content Container */}
        <div className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}>
          {!isMe && (
            <div className="flex items-center gap-1.5 ml-1 mb-1">
              <span className="text-[10px] text-muted-foreground font-semibold tracking-wide">
                {message.authorName}
              </span>
              <LevelBadge level={message.authorLevel} />
              {message.authorId.startsWith('admin') && (
                <span className="px-1.5 py-0.5 bg-accent/20 text-accent rounded uppercase text-[8px] font-black">Admin</span>
              )}
            </div>
          )}

          {message.type === 'text' && (
            <div 
              className={`px-4 py-2.5 rounded-2xl text-sm relative ${
                isMe 
                  ? 'bg-accent/20 text-foreground border border-accent/20 rounded-br-sm'
                  : 'bg-secondary/60 text-foreground border border-border/40 rounded-bl-sm'
               }`}
            >
              <p style={{ wordBreak: 'break-word' }}>{message.content}</p>
            </div>
          )}

          {message.type === 'announcement' && (
            <div className={`w-full max-w-xs sm:max-w-md bg-accent/5 border border-accent/20 rounded-2xl p-4 shadow-sm mt-1 ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-accent">Aviso Importante</span>
              </div>
              <p className="text-sm text-foreground/90">{message.content}</p>
              <button className="mt-3 w-full py-1.5 bg-accent/10 hover:bg-accent/20 text-accent font-semibold text-xs rounded-lg transition-colors">
                Ver detalhes
              </button>
            </div>
          )}

          {message.type === 'post' && (
            <div className={`w-full bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm mt-1 sm:max-w-md ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'} relative`}>
               {/* Emoji Picker Modal */}
               {showPicker && (
                 <div className="absolute top-1/2 left-4 z-50 bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-full p-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                   {AVAILABLE_REACTIONS.map(emoji => (
                     <button 
                       key={emoji}
                       onClick={() => { onReaction(emoji); setShowPicker(false); }}
                       className="w-10 h-10 text-xl flex items-center justify-center hover:bg-secondary rounded-full transition-transform hover:scale-110"
                     >
                       {emoji}
                     </button>
                   ))}
                   <button onClick={() => setShowPicker(false)} className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center ml-1 text-xs font-bold">X</button>
                 </div>
               )}

               <div className="w-full aspect-[4/3] bg-secondary/30 relative">
                 <img src={message.imageUrl} alt="Post visual" className="w-full h-full object-cover" />
               </div>
               <div className="p-3">
                 <div className="flex items-center gap-3 mb-2 relative">
                   <button 
                     onClick={() => showPicker ? setShowPicker(false) : setShowPicker(true)} 
                     className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${message.userReactedWith ? 'bg-accent/10 text-accent ring-1 ring-accent/30' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
                   >
                     {message.userReactedWith ? (
                       <span className="text-sm">{message.userReactedWith}</span>
                     ) : (
                       <Plus size={16} />
                     )}
                   </button>
                   <button className="text-foreground hover:text-muted-foreground"><MessageCircle size={20} /></button>
                   <button className="text-foreground hover:text-muted-foreground"><Share2 size={20} /></button>
                 </div>
                 
                 {/* Reaction Summary */}
                 {message.postReactions && message.postReactions.length > 0 && (() => {
                    const sorted = [...message.postReactions].sort((a,b) => b.count - a.count);
                    const total = sorted.reduce((acc, curr) => acc + curr.count, 0);
                    const top3 = sorted.slice(0, 3);
                    return (
                      <div className="flex items-center gap-1.5 mb-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                         <div className="flex -space-x-1.5">
                           {top3.map((r, i) => (
                             <span key={i} className="w-5 h-5 bg-background border border-border/30 rounded-full flex items-center justify-center text-[10px] z-[3]">{r.emoji}</span>
                           ))}
                         </div>
                         <span className="text-xs font-semibold text-foreground ml-1">{total} reações</span>
                      </div>
                    )
                 })()}

                 <div className="text-xs mb-2 mt-1">
                   <span className="font-bold mr-1.5 text-foreground">{message.authorName}</span>
                   <span className="text-foreground/90">{message.content}</span>
                 </div>
                 {message.comments && message.comments.length > 0 && (
                   <div className="space-y-1 mt-2 border-t border-border/20 pt-2">
                     {message.comments.slice(-1).map(c => (
                       <div key={c.id} className="text-[10px] leading-tight flex items-start gap-1">
                         <span className="font-bold text-foreground shrink-0">{c.author}</span>
                         <span className="text-foreground/80 truncate">{c.content}</span>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          )}
          
          <span className={`text-[9px] text-muted-foreground mt-1 mx-1`}>{message.createdAt}</span>
        </div>
      </div>
    </div>
  );
}

function UnifiedSkeleton() {
  const isMe = Math.random() > 0.5;
  const isPost = Math.random() > 0.7;
  
  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex gap-2 max-w-[75%] w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && <div className="w-8 h-8 rounded-full bg-muted animate-pulse mt-auto" />}
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full`}>
          {!isMe && <div className="h-2 w-16 bg-muted rounded animate-pulse ml-1 mb-1" />}
          
          {isPost ? (
             <div className="w-full max-w-sm aspect-[4/3] bg-muted/50 rounded-2xl animate-pulse" />
          ) : (
             <div className={`h-10 w-${isMe ? '48' : '32'} bg-muted rounded-2xl animate-pulse ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`} />
          )}

          <div className="h-2 w-8 bg-muted rounded animate-pulse mt-1 mx-1" />
        </div>
      </div>
    </div>
  );
}
