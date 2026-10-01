import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Send, Paperclip, X, SmilePlus, FileText, Download, Mic } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./Avatar";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "😮", "😢", "🙏"];
export const fileUrl = (u) => (!u ? u : u.startsWith("http") ? u : `${BACKEND_URL}${u}`);

function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function ChatArea({ title, subtitle, messages, onSend, onReact, room, placeholder, emptyText }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [reactFor, setReactFor] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const mediaRec = useRef(null);
  const recChunks = useRef([]);
  const recTimer = useRef(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const lastTyping = useRef(0);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!room) return;
    const load = async () => { try { const r = await api.get(`/typing/${encodeURIComponent(room)}`); setTypingUsers(r.data); } catch {} };
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, [room]);

  const emitTyping = useCallback(() => {
    if (!room) return;
    const now = Date.now();
    if (now - lastTyping.current > 2500) { lastTyping.current = now; api.post("/typing", { room }).catch(() => {}); }
  }, [room]);

  const pickFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 15MB)"); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", f);
      const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setAttachment(res.data);
    } catch { toast.error("Falha no upload"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const send = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !attachment) return;
    setSending(true);
    const payload = { content: text.trim() };
    if (attachment) {
      if (attachment.is_image) payload.image = attachment.url; else payload.file_url = attachment.url;
      payload.file_name = attachment.file_name;
      payload.file_type = attachment.file_type;
    }
    setText(""); setAttachment(null);
    try { await onSend(payload); }
    catch { toast.error("Falha ao enviar"); }
    finally { setSending(false); }
  };

  const react = async (messageId, emoji) => {
    setReactFor(null);
    try { await onReact?.(messageId, emoji); } catch {}
  };

  const sendVoice = async (blob) => {
    const file = new File([blob], `audio-${Date.now()}.webm`, { type: "audio/webm" });
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await onSend({ content: "", file_url: res.data.url, file_name: "Mensagem de voz", file_type: "audio/webm" });
    } catch { toast.error("Falha ao enviar áudio"); }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recChunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) recChunks.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recTimer.current) clearInterval(recTimer.current);
        setRecording(false); setRecSecs(0);
        const blob = new Blob(recChunks.current, { type: "audio/webm" });
        if (blob.size > 0) sendVoice(blob);
      };
      mediaRec.current = mr;
      mr.start();
      setRecording(true); setRecSecs(0);
      recTimer.current = setInterval(() => setRecSecs((s) => s + 1), 1000);
    } catch { toast.error("Não foi possível acessar o microfone"); }
  };

  const stopRec = (cancel) => {
    if (cancel) recChunks.current = [];
    try { mediaRec.current?.stop(); } catch {}
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#0a1228]">
      <div className="h-14 px-5 flex items-center gap-2 border-b border-[#19a9ff]/10 backdrop-blur-xl bg-[#0a1228]/70">
        {title?.startsWith("#") ? <Hash className="w-5 h-5 text-[#93a4cc]" /> : null}
        <span className="font-heading font-semibold" data-testid="chat-title">{title?.replace(/^#/, "") || title}</span>
        {subtitle && <span className="text-sm text-[#93a4cc] ml-2 hidden sm:inline">{subtitle}</span>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4" data-testid="messages-container">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#93a4cc]">
            <div className="w-16 h-16 rounded-2xl bg-[#101a38] flex items-center justify-center mb-4">
              <Hash className="w-7 h-7 text-[#19a9ff]" />
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
                className={`group flex gap-3 ${grouped ? "mt-0.5" : "mt-4"}`}
                data-testid="message-row"
              >
                <div className="w-9 shrink-0">
                  {!grouped && <Avatar user={m.author} size={36} />}
                </div>
                <div className="min-w-0 flex-1">
                  {!grouped && (
                    <div className="flex items-baseline gap-2">
                      <span className={`font-semibold text-sm ${mine ? "text-[#19a9ff]" : "text-cream"}`}>{m.author?.name || "Usuário"}</span>
                      <span className="text-xs text-[#64748b]">{fmtTime(m.created_at)}</span>
                    </div>
                  )}
                  {m.content && <p className="text-[15px] text-[#dbe5ff] leading-relaxed break-words whitespace-pre-wrap">{m.content}</p>}
                  {m.image && (
                    <img src={fileUrl(m.image)} alt={m.file_name || "imagem"} className="mt-2 max-w-xs sm:max-w-sm rounded-xl border border-[#19a9ff]/20" />
                  )}
                  {m.file_url && !m.image && (m.file_type || "").startsWith("video/") && (
                    <video src={fileUrl(m.file_url)} controls data-testid="message-video" className="mt-2 max-w-xs sm:max-w-sm rounded-xl border border-[#19a9ff]/20" />
                  )}
                  {m.file_url && !m.image && (m.file_type || "").startsWith("audio/") && (
                    <audio src={fileUrl(m.file_url)} controls data-testid="message-audio" className="mt-2 w-64 max-w-full" />
                  )}
                  {m.file_url && !m.image && !(m.file_type || "").startsWith("video/") && !(m.file_type || "").startsWith("audio/") && (
                    <a href={fileUrl(m.file_url)} target="_blank" rel="noreferrer" data-testid="message-file" className="mt-2 inline-flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#101a38] border border-[#19a9ff]/20 hover:border-[#19a9ff]/50 transition-colors max-w-xs">
                      <FileText className="w-5 h-5 text-[#19a9ff] shrink-0" />
                      <span className="text-sm text-cream truncate flex-1">{m.file_name || "arquivo"}</span>
                      <Download className="w-4 h-4 text-[#93a4cc]" />
                    </a>
                  )}
                  {m.reactions && Object.keys(m.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {Object.entries(m.reactions).map(([emoji, users]) => (
                        <button key={emoji} data-testid={`reaction-${emoji}`} onClick={() => react(m.message_id, emoji)}
                          className={`px-2 py-0.5 rounded-full text-sm flex items-center gap-1 border transition-colors ${users.includes(user.user_id) ? "bg-[#19a9ff]/20 border-[#19a9ff]/60" : "bg-[#101a38] border-[#19a9ff]/15 hover:border-[#19a9ff]/40"}`}>
                          <span>{emoji}</span><span className="text-xs text-[#93a4cc]">{users.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative self-start opacity-0 group-hover:opacity-100 transition-opacity">
                  <button data-testid={`react-button-${m.message_id}`} onClick={() => setReactFor(reactFor === m.message_id ? null : m.message_id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#93a4cc] hover:text-[#19a9ff] hover:bg-[#101a38]">
                    <SmilePlus className="w-4 h-4" />
                  </button>
                  {reactFor === m.message_id && (
                    <div className="absolute right-0 top-8 z-20 flex gap-1 p-1.5 rounded-xl bg-[#101a38] border border-[#19a9ff]/25 shadow-xl">
                      {EMOJIS.map((em) => (
                        <button key={em} onClick={() => react(m.message_id, em)} className="w-8 h-8 rounded-lg text-lg hover:bg-[#17264b]">{em}</button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {attachment && (
        <div className="px-5 pt-3">
          <div className="relative inline-flex items-center gap-2 p-2 pr-8 rounded-xl bg-[#101a38] border border-[#19a9ff]/20">
            {attachment.is_image ? (
              <img src={fileUrl(attachment.url)} alt="preview" className="h-16 rounded-lg" />
            ) : (
              <><FileText className="w-5 h-5 text-[#19a9ff]" /><span className="text-sm text-cream max-w-[200px] truncate">{attachment.file_name}</span></>
            )}
            <button onClick={() => setAttachment(null)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#f43f5e] text-white flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="px-6 h-5 text-xs text-[#19a9ff]" data-testid="typing-indicator">
        {typingUsers.length > 0 && (
          <span>{typingUsers.map((t) => t.name).join(", ")} {typingUsers.length === 1 ? "está digitando" : "estão digitando"}...</span>
        )}
      </div>

      <form onSubmit={send} className="px-4 pb-4 pt-1">
        {recording ? (
          <div className="flex items-center gap-3 bg-[#101a38] border border-[#f43f5e]/40 rounded-2xl px-4 py-3" data-testid="recording-bar">
            <span className="w-3 h-3 rounded-full bg-[#f43f5e] animate-pulse" />
            <span className="text-sm text-cream">Gravando áudio... {String(Math.floor(recSecs / 60)).padStart(2, "0")}:{String(recSecs % 60).padStart(2, "0")}</span>
            <button type="button" data-testid="cancel-recording-button" onClick={() => stopRec(true)} className="ml-auto px-3 h-8 rounded-lg text-sm text-[#93a4cc] hover:text-cream">Cancelar</button>
            <button type="button" data-testid="send-recording-button" onClick={() => stopRec(false)} className="w-9 h-9 rounded-xl bg-[#19a9ff] text-[#0a1228] flex items-center justify-center hover:-translate-y-0.5 transition-transform"><Send className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-end gap-2 bg-[#101a38] border border-[#19a9ff]/15 rounded-2xl px-3 py-2 focus-within:border-[#19a9ff]/50 transition-colors">
            <button type="button" data-testid="attach-image-button" disabled={uploading} onClick={() => fileRef.current?.click()} className="w-9 h-9 rounded-xl flex items-center justify-center text-[#93a4cc] hover:text-[#19a9ff] hover:bg-[#17264b] transition-colors disabled:opacity-50">
              {uploading ? <span className="w-4 h-4 rounded-full border-2 border-[#19a9ff] border-t-transparent animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip" hidden onChange={pickFile} data-testid="file-input" />
            <textarea
              data-testid="message-input"
              rows={1}
              value={text}
              onChange={(e) => { setText(e.target.value); emitTyping(); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={placeholder || "Mensagem..."}
              className="flex-1 bg-transparent resize-none outline-none text-cream placeholder:text-[#64748b] py-1.5 max-h-32"
            />
            {!text.trim() && !attachment ? (
              <button type="button" data-testid="record-audio-button" onClick={startRec} title="Gravar mensagem de voz" className="w-9 h-9 rounded-xl flex items-center justify-center text-[#93a4cc] hover:text-[#19a9ff] hover:bg-[#17264b] transition-colors">
                <Mic className="w-5 h-5" />
              </button>
            ) : (
              <button type="submit" data-testid="send-message-button" disabled={sending || uploading} className="w-9 h-9 rounded-xl bg-[#19a9ff] text-[#0a1228] flex items-center justify-center disabled:opacity-40 hover:-translate-y-0.5 active:scale-95 transition-transform">
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
