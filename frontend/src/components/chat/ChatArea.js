import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Send, ImagePlus, X, Smile } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./Avatar";
import { useAuth } from "@/context/AuthContext";

function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function ChatArea({ title, subtitle, messages, onSend, placeholder, emptyText }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const pickImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 4MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result); setFileName(f.name); };
    reader.readAsDataURL(f);
  };

  const send = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !image) return;
    setSending(true);
    const payload = { content: text.trim(), image, file_name: fileName };
    setText(""); setImage(null); setFileName(null);
    try { await onSend(payload); }
    catch { toast.error("Falha ao enviar"); }
    finally { setSending(false); }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#0c1411]">
      <div className="h-14 px-5 flex items-center gap-2 border-b border-[#e78662]/10 backdrop-blur-xl bg-[#0c1411]/70">
        {title?.startsWith("#") ? <Hash className="w-5 h-5 text-[#a3b8b0]" /> : null}
        <span className="font-heading font-semibold" data-testid="chat-title">{title?.replace(/^#/, "") || title}</span>
        {subtitle && <span className="text-sm text-[#a3b8b0] ml-2 hidden sm:inline">{subtitle}</span>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4" data-testid="messages-container">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#a3b8b0]">
            <div className="w-16 h-16 rounded-2xl bg-[#121e1a] flex items-center justify-center mb-4">
              <Hash className="w-7 h-7 text-[#e78662]" />
            </div>
            <p className="font-heading font-semibold text-cream text-lg">{emptyText || "Comece a conversa"}</p>
            <p className="text-sm mt-1">Seja o primeiro a enviar uma mensagem.</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const grouped = prev && prev.author_id === m.author_id;
            const mine = m.author_id === user.user_id;
            return (
              <motion.div
                key={m.message_id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${grouped ? "mt-0.5" : "mt-4"}`}
                data-testid="message-row"
              >
                <div className="w-9 shrink-0">
                  {!grouped && <Avatar user={m.author} size={36} />}
                </div>
                <div className="min-w-0 flex-1">
                  {!grouped && (
                    <div className="flex items-baseline gap-2">
                      <span className={`font-semibold text-sm ${mine ? "text-[#e78662]" : "text-cream"}`}>{m.author?.name || "Usuário"}</span>
                      <span className="text-xs text-[#64748b]">{fmtTime(m.created_at)}</span>
                    </div>
                  )}
                  {m.content && <p className="text-[15px] text-[#d8e3df] leading-relaxed break-words whitespace-pre-wrap">{m.content}</p>}
                  {m.image && (
                    <img src={m.image} alt={m.file_name || "imagem"} className="mt-2 max-w-xs sm:max-w-sm rounded-xl border border-[#e78662]/20" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {image && (
        <div className="px-5 pt-3">
          <div className="relative inline-block">
            <img src={image} alt="preview" className="h-24 rounded-xl border border-[#e78662]/20" />
            <button onClick={() => { setImage(null); setFileName(null); }} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#f43f5e] text-white flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={send} className="p-4">
        <div className="flex items-end gap-2 bg-[#121e1a] border border-[#e78662]/15 rounded-2xl px-3 py-2 focus-within:border-[#e78662]/50 transition-colors">
          <button type="button" data-testid="attach-image-button" onClick={() => fileRef.current?.click()} className="w-9 h-9 rounded-xl flex items-center justify-center text-[#a3b8b0] hover:text-[#e78662] hover:bg-[#1a2a25] transition-colors">
            <ImagePlus className="w-5 h-5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} data-testid="file-input" />
          <textarea
            data-testid="message-input"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={placeholder || "Mensagem..."}
            className="flex-1 bg-transparent resize-none outline-none text-cream placeholder:text-[#64748b] py-1.5 max-h-32"
          />
          <button type="submit" data-testid="send-message-button" disabled={sending || (!text.trim() && !image)} className="w-9 h-9 rounded-xl bg-[#e78662] text-[#0c1411] flex items-center justify-center disabled:opacity-40 hover:-translate-y-0.5 active:scale-95 transition-transform">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
