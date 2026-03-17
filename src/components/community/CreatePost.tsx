import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useHustlePoints } from "@/hooks/useHustlePoints";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image, Send, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CreatePost() {
  const { user } = useAuth();
  const { awardPoints } = useHustlePoints();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!user || (!content.trim() && !image)) return;

      let mediaUrl = null;

      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("community_media")
          .upload(fileName, image);

        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from("community_media")
          .getPublicUrl(fileName);
        mediaUrl = publicUrl;
      }

      const { error } = await (supabase as any)
        .from("community_posts")
        .insert({
          user_id: user.id,
          content: content.trim(),
          media_url: mediaUrl,
          media_type: image ? "image" : null,
        });

      if (error) throw error;
      
      awardPoints({ action: "community_post" });
    },
    onSuccess: () => {
      setContent("");
      removeImage();
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Postagem realizada com sucesso! 🔥");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao realizar postagem.");
    },
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-sm">
      <div className="flex gap-4">
        <div className="flex-1 space-y-3">
          <Textarea 
            placeholder="Compartilhe sua batalha de hoje..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] bg-secondary/30 border-none resize-none focus-visible:ring-accent rounded-xl p-3 placeholder:text-muted-foreground/60"
          />
          
          <AnimatePresence>
            {preview && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative rounded-xl overflow-hidden aspect-video border border-border"
              >
                <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                <button 
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-background/80 blur-backdrop rounded-full text-foreground hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleImageChange} 
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                className="text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg gap-2"
              >
                <Image size={18} />
                <span className="text-xs">Foto</span>
              </Button>
            </div>
            
            <Button 
              disabled={(!content.trim() && !image) || createPostMutation.isPending}
              onClick={() => createPostMutation.mutate()}
              className="bg-accent hover:bg-accent/90 text-white rounded-xl px-6 gap-2 font-cinzel font-bold text-xs tracking-widest"
            >
              {createPostMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              POSTAR
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
