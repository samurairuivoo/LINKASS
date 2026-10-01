import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Server, Home } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ServerRail from "@/components/chat/ServerRail";
import ChannelSidebar from "@/components/chat/ChannelSidebar";
import ChatArea from "@/components/chat/ChatArea";
import MemberList from "@/components/chat/MemberList";
import DirectMessages from "@/components/chat/DirectMessages";
import VoiceRoom from "@/components/chat/VoiceRoom";
import { CreateServerModal, CreateChannelModal, ProfileModal } from "@/components/chat/modals";

export default function AppShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState("dm"); // dm | server
  const [servers, setServers] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [modal, setModal] = useState(null); // create-server | create-channel | profile

  const loadServers = useCallback(async () => {
    try { const res = await api.get("/servers"); setServers(res.data); return res.data; } catch { return []; }
  }, []);

  useEffect(() => {
    (async () => {
      const list = await loadServers();
      const pending = localStorage.getItem("lc_pending_invite");
      if (pending) {
        localStorage.removeItem("lc_pending_invite");
        try { const res = await api.post("/servers/join", { invite_code: pending }); const l2 = await loadServers(); openServer(res.data); return; } catch {}
      }
      const openId = localStorage.getItem("lc_open_server");
      if (openId) {
        localStorage.removeItem("lc_open_server");
        const srv = list.find((s) => s.server_id === openId);
        if (srv) openServer(srv);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadServers]);

  const openServer = useCallback(async (server) => {
    setView("server");
    setActiveServer(server);
    try {
      const res = await api.get(`/servers/${server.server_id}`);
      setChannels(res.data.channels);
      setMembers(res.data.members);
      setActiveServer(res.data.server);
      setActiveChannel(res.data.channels[0] || null);
    } catch {}
  }, []);

  // poll members presence for active server
  useEffect(() => {
    if (view !== "server" || !activeServer) return;
    const id = setInterval(async () => {
      try { const res = await api.get(`/servers/${activeServer.server_id}`); setMembers(res.data.members); } catch {}
    }, 15000);
    return () => clearInterval(id);
  }, [view, activeServer]);

  // load + poll channel messages
  const loadMessages = useCallback(async (ch) => {
    if (!ch) return;
    try { const res = await api.get(`/channels/${ch.channel_id}/messages`); setMessages(res.data); } catch {}
  }, []);

  useEffect(() => {
    if (view !== "server" || !activeChannel || activeChannel.type === "voice") { return; }
    loadMessages(activeChannel);
    const id = setInterval(() => loadMessages(activeChannel), 2500);
    return () => clearInterval(id);
  }, [view, activeChannel, loadMessages]);

  const sendChannel = async (payload) => {
    const res = await api.post(`/channels/${activeChannel.channel_id}/messages`, payload);
    setMessages((m) => [...m, res.data]);
  };

  const reactMessage = async (messageId, emoji) => {
    const res = await api.post(`/messages/${messageId}/react`, { emoji });
    setMessages((m) => m.map((x) => (x.message_id === messageId ? { ...x, reactions: res.data.reactions } : x)));
  };

  const onServerCreated = async (srv) => {
    await loadServers();
    openServer(srv);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0a1228] text-cream">
      {/* Barra fixa: alterna entre Conversas e Servidores, com voltar ao site */}
      <div className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-[#19a9ff]/15 bg-[#060c1e]">
        <button data-testid="topbar-home-button" onClick={() => navigate("/")} title="Voltar ao site" className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-[#93a4cc] hover:text-cream hover:bg-[#101a38] transition-colors">
          <Home className="w-4 h-4" /> <span className="hidden sm:inline">Voltar</span>
        </button>
        <div className="w-px h-6 bg-[#19a9ff]/15" />
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#101a38]">
          <button data-testid="topbar-conversas" onClick={() => setView("dm")} className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-semibold transition-colors ${view === "dm" ? "bg-gradient-to-r from-[#5948ff] to-[#19a9ff] text-white" : "text-[#93a4cc] hover:text-cream"}`}>
            <MessageSquare className="w-4 h-4" /> Conversas
          </button>
          <button data-testid="topbar-servidores" onClick={() => { if (servers[0]) openServer(servers[0]); else setModal("create-server"); }} className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-semibold transition-colors ${view === "server" ? "bg-gradient-to-r from-[#5948ff] to-[#19a9ff] text-white" : "text-[#93a4cc] hover:text-cream"}`}>
            <Server className="w-4 h-4" /> Servidores
          </button>
        </div>
        <span className="ml-auto font-heading font-bold text-sm tracking-tight text-cream/90">Linkas</span>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
      <ServerRail
        servers={servers}
        activeServer={activeServer}
        view={view}
        onSelectServer={openServer}
        onSelectDM={() => setView("dm")}
        onCreate={() => setModal("create-server")}
      />

      {view === "dm" ? (
        <DirectMessages onProfile={() => setModal("profile")} />
      ) : activeServer ? (
        <>
          <ChannelSidebar
            server={activeServer}
            channels={channels}
            activeChannel={activeChannel}
            onSelectChannel={setActiveChannel}
            onCreateChannel={() => setModal("create-channel")}
            onProfile={() => setModal("profile")}
          />
          {activeChannel?.type === "voice" ? (
            <VoiceRoom channel={activeChannel} user={user} />
          ) : (
            <ChatArea
              title={activeChannel ? `#${activeChannel.name}` : "Canal"}
              room={activeChannel?.channel_id}
              messages={messages}
              onSend={sendChannel}
              onReact={reactMessage}
              placeholder={activeChannel ? `Mensagem em #${activeChannel.name}` : "Mensagem"}
              emptyText={activeChannel ? `Bem-vindo a #${activeChannel.name}` : "Selecione um canal"}
            />
          )}
          <MemberList members={members} />
        </>
      ) : null}
      </div>

      {modal === "create-server" && <CreateServerModal onClose={() => setModal(null)} onCreated={onServerCreated} />}
      {modal === "create-channel" && activeServer && (
        <CreateChannelModal
          serverId={activeServer.server_id}
          onClose={() => setModal(null)}
          onCreated={(ch) => { setChannels((c) => [...c, ch]); setActiveChannel(ch); }}
        />
      )}
      {modal === "profile" && <ProfileModal onClose={() => setModal(null)} />}
    </div>
  );
}
