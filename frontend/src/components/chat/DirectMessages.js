import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import api from "@/lib/api";
import { Avatar, PresenceDot } from "./Avatar";
import ChatArea from "./ChatArea";
import { UserFooter } from "./ChannelSidebar";
import { useAuth } from "@/context/AuthContext";

export default function DirectMessages({ onProfile }) {
  const { user, logout } = useAuth();
  const [people, setPeople] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [q, setQ] = useState("");

  const loadPeople = useCallback(async () => {
    try { const res = await api.get("/dm/all-users"); setPeople(res.data); } catch {}
  }, []);

  useEffect(() => { loadPeople(); const id = setInterval(loadPeople, 15000); return () => clearInterval(id); }, [loadPeople]);

  const loadMessages = useCallback(async (other) => {
    if (!other) return;
    try { const res = await api.get(`/dm/${other.user_id}/messages`); setMessages(res.data); } catch {}
  }, []);

  useEffect(() => {
    if (!active) return;
    loadMessages(active);
    const id = setInterval(() => loadMessages(active), 2500);
    return () => clearInterval(id);
  }, [active, loadMessages]);

  const send = async (payload) => {
    const res = await api.post(`/dm/${active.user_id}/messages`, payload);
    setMessages((m) => [...m, res.data]);
  };

  const reactDM = async (messageId, emoji) => {
    const res = await api.post(`/messages/${messageId}/react`, { emoji });
    setMessages((m) => m.map((x) => (x.message_id === messageId ? { ...x, reactions: res.data.reactions } : x)));
  };

  const dmRoom = active ? [user.user_id, active.user_id].sort().join("_") : null;

  const filtered = people.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="h-full w-[240px] shrink-0 bg-[#0a1228] flex flex-col border-r border-[#19a9ff]/10">
        <div className="h-14 px-4 flex items-center border-b border-[#19a9ff]/10">
          <span className="font-heading font-bold">Mensagens diretas</span>
        </div>
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#93a4cc]" />
            <input
              data-testid="dm-search-input"
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar pessoas..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#101a38] border border-[#19a9ff]/15 text-sm text-cream placeholder:text-[#64748b] outline-none focus:border-[#19a9ff]/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {filtered.length === 0 && <p className="text-sm text-[#93a4cc] px-2 py-4">Nenhum usuário ainda.</p>}
          {filtered.map((p) => (
            <button
              key={p.user_id}
              data-testid={`dm-person-${p.user_id}`}
              onClick={() => setActive(p)}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors ${active?.user_id === p.user_id ? "bg-[#17264b]" : "hover:bg-[#101a38]"}`}
            >
              <div className="relative">
                <Avatar user={p} size={34} />
                <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot online={p.online} size={10} ring="#0a1228" /></span>
              </div>
              <span className="text-sm font-medium text-cream truncate">{p.name}</span>
            </button>
          ))}
        </div>
        <UserFooter user={user} logout={logout} onProfile={onProfile} />
      </div>

      {active ? (
        <ChatArea
          title={active.name}
          subtitle={active.online ? "online" : "offline"}
          messages={messages}
          onSend={send}
          onReact={reactDM}
          room={dmRoom}
          placeholder={`Mensagem para ${active.name}`}
          emptyText={`Converse com ${active.name}`}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#0a1228] text-center px-6">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-[#101a38] flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-[#19a9ff]" />
            </div>
            <p className="font-heading font-semibold text-cream text-lg">Escolha alguém para conversar</p>
            <p className="text-sm text-[#93a4cc] mt-1">Selecione um usuário na lista ao lado.</p>
          </div>
        </div>
      )}
    </>
  );
}
