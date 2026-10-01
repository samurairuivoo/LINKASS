import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, LogIn } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Avatar } from "./Avatar";
import { useAuth } from "@/context/AuthContext";

function Shell({ children, onClose, testid }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        data-testid={testid}
      >
        <motion.div
          initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#121e1a] border border-[#e78662]/20 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function CreateServerModal({ onClose, onCreated }) {
  const [tab, setTab] = useState("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try { const res = await api.post("/servers", { name: name.trim() }); onCreated(res.data); toast.success("Servidor criado!"); onClose(); }
    catch { toast.error("Erro ao criar"); } finally { setBusy(false); }
  };
  const join = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try { const res = await api.post("/servers/join", { invite_code: code.trim() }); onCreated(res.data); toast.success(`Entrou em ${res.data.name}`); onClose(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Convite inválido"); } finally { setBusy(false); }
  };

  return (
    <Shell onClose={onClose} testid="create-server-modal">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-xl">Seu servidor</h3>
        <button onClick={onClose} className="text-[#a3b8b0] hover:text-cream"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex gap-2 mb-5 p-1 bg-[#0c1411] rounded-xl">
        <button data-testid="tab-create-server" onClick={() => setTab("create")} className={`flex-1 h-9 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${tab === "create" ? "bg-[#e78662] text-[#0c1411]" : "text-[#a3b8b0]"}`}>
          <Plus className="w-4 h-4" /> Criar
        </button>
        <button data-testid="tab-join-server" onClick={() => setTab("join")} className={`flex-1 h-9 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${tab === "join" ? "bg-[#e78662] text-[#0c1411]" : "text-[#a3b8b0]"}`}>
          <LogIn className="w-4 h-4" /> Entrar
        </button>
      </div>
      {tab === "create" ? (
        <>
          <label className="text-xs font-semibold tracking-wider uppercase text-[#a3b8b0]">Nome do servidor</label>
          <input data-testid="server-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Galera do Game"
            className="w-full mt-2 h-11 px-4 rounded-xl bg-[#0c1411] border border-[#e78662]/15 text-cream outline-none focus:border-[#e78662]/50" />
          <button data-testid="confirm-create-server" onClick={create} disabled={busy} className="w-full mt-5 h-11 rounded-xl bg-[#e78662] text-[#0c1411] font-semibold disabled:opacity-60 hover:-translate-y-0.5 transition-transform">
            {busy ? "Criando..." : "Criar servidor"}
          </button>
        </>
      ) : (
        <>
          <label className="text-xs font-semibold tracking-wider uppercase text-[#a3b8b0]">Código de convite</label>
          <input data-testid="invite-code-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Cole o código aqui"
            className="w-full mt-2 h-11 px-4 rounded-xl bg-[#0c1411] border border-[#e78662]/15 text-cream outline-none focus:border-[#e78662]/50" />
          <button data-testid="confirm-join-server" onClick={join} disabled={busy} className="w-full mt-5 h-11 rounded-xl bg-[#e78662] text-[#0c1411] font-semibold disabled:opacity-60 hover:-translate-y-0.5 transition-transform">
            {busy ? "Entrando..." : "Entrar no servidor"}
          </button>
        </>
      )}
    </Shell>
  );
}

export function CreateChannelModal({ onClose, onCreated, serverId }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try { const res = await api.post(`/servers/${serverId}/channels`, { name: name.trim().toLowerCase().replace(/\s+/g, "-") }); onCreated(res.data); toast.success("Canal criado!"); onClose(); }
    catch { toast.error("Erro ao criar canal"); } finally { setBusy(false); }
  };
  return (
    <Shell onClose={onClose} testid="create-channel-modal">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-xl">Novo canal</h3>
        <button onClick={onClose} className="text-[#a3b8b0] hover:text-cream"><X className="w-5 h-5" /></button>
      </div>
      <label className="text-xs font-semibold tracking-wider uppercase text-[#a3b8b0]">Nome do canal</label>
      <input data-testid="channel-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: anúncios"
        className="w-full mt-2 h-11 px-4 rounded-xl bg-[#0c1411] border border-[#e78662]/15 text-cream outline-none focus:border-[#e78662]/50" />
      <button data-testid="confirm-create-channel" onClick={create} disabled={busy} className="w-full mt-5 h-11 rounded-xl bg-[#e78662] text-[#0c1411] font-semibold disabled:opacity-60 hover:-translate-y-0.5 transition-transform">
        {busy ? "Criando..." : "Criar canal"}
      </button>
    </Shell>
  );
}

export function ProfileModal({ onClose }) {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [status, setStatus] = useState(user.status || "");
  const [picture, setPicture] = useState(user.picture || "");
  const [busy, setBusy] = useState(false);

  const pick = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error("Imagem muito grande (máx 2MB)"); return; }
    const r = new FileReader(); r.onload = () => setPicture(r.result); r.readAsDataURL(f);
  };
  const save = async () => {
    setBusy(true);
    try { const res = await api.put("/profile", { name, status, picture }); setUser(res.data); toast.success("Perfil atualizado!"); onClose(); }
    catch { toast.error("Erro ao salvar"); } finally { setBusy(false); }
  };

  return (
    <Shell onClose={onClose} testid="profile-modal">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-xl">Meu perfil</h3>
        <button onClick={onClose} className="text-[#a3b8b0] hover:text-cream"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex items-center gap-4 mb-5">
        <Avatar user={{ name, picture }} size={64} />
        <label className="px-4 py-2 rounded-xl bg-[#0c1411] border border-[#e78662]/15 text-sm font-semibold cursor-pointer hover:border-[#e78662]/50 transition-colors">
          Trocar avatar
          <input type="file" accept="image/*" hidden onChange={pick} data-testid="avatar-upload-input" />
        </label>
      </div>
      <label className="text-xs font-semibold tracking-wider uppercase text-[#a3b8b0]">Nome</label>
      <input data-testid="profile-name-input" value={name} onChange={(e) => setName(e.target.value)}
        className="w-full mt-2 mb-4 h-11 px-4 rounded-xl bg-[#0c1411] border border-[#e78662]/15 text-cream outline-none focus:border-[#e78662]/50" />
      <label className="text-xs font-semibold tracking-wider uppercase text-[#a3b8b0]">Status</label>
      <input data-testid="profile-status-input" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="O que você está fazendo?"
        className="w-full mt-2 h-11 px-4 rounded-xl bg-[#0c1411] border border-[#e78662]/15 text-cream outline-none focus:border-[#e78662]/50" />
      <button data-testid="save-profile-button" onClick={save} disabled={busy} className="w-full mt-6 h-11 rounded-xl bg-[#e78662] text-[#0c1411] font-semibold disabled:opacity-60 hover:-translate-y-0.5 transition-transform">
        {busy ? "Salvando..." : "Salvar"}
      </button>
    </Shell>
  );
}
