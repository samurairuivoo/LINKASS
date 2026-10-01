import { useState, useEffect, useCallback } from "react";
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
    <div className="h-screen w-screen flex overflow-hidden bg-[#0c1411] text-cream">
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
