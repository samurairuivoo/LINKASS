import { Hash, Plus, LogOut, Settings, ChevronDown, Copy, Volume2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, PresenceDot } from "./Avatar";
import { useAuth } from "@/context/AuthContext";

export default function ChannelSidebar({ server, channels, activeChannel, onSelectChannel, onCreateChannel, onProfile }) {
  const { user, logout } = useAuth();

  const copyInvite = () => {
    const link = `${window.location.origin}/invite/${server.invite_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de convite copiado!");
  };

  const textChannels = channels.filter((c) => c.type !== "voice");
  const voiceChannels = channels.filter((c) => c.type === "voice");

  const renderChannel = (c) => {
    const active = activeChannel?.channel_id === c.channel_id;
    const Icon = c.type === "voice" ? Volume2 : Hash;
    return (
      <button
        key={c.channel_id}
        data-testid={`channel-item-${c.name}`}
        onClick={() => onSelectChannel(c)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
          active ? "bg-[#17264b] text-cream" : "text-[#93a4cc] hover:bg-[#101a38] hover:text-cream"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0 opacity-70" />
        <span className="truncate">{c.name}</span>
      </button>
    );
  };

  return (
    <div className="h-full w-[240px] shrink-0 bg-[#0a1228] flex flex-col border-r border-[#19a9ff]/10">
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#19a9ff]/10">
        <span className="font-heading font-bold truncate" data-testid="sidebar-server-name">{server.name}</span>
        <button data-testid="copy-invite-button" onClick={copyInvite} title="Copiar convite" className="text-[#93a4cc] hover:text-[#19a9ff] transition-colors">
          <Copy className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#93a4cc]">Canais de texto</span>
          <button data-testid="create-channel-button" onClick={onCreateChannel} className="text-[#93a4cc] hover:text-[#19a9ff]">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {textChannels.map(renderChannel)}

        {voiceChannels.length > 0 && (
          <>
            <div className="flex items-center justify-between px-2 mb-1 mt-4">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#93a4cc]">Canais de voz</span>
            </div>
            {voiceChannels.map(renderChannel)}
          </>
        )}

        <button data-testid="copy-invite-link-button" onClick={copyInvite} className="w-full flex items-center gap-2 px-2 py-2 mt-4 rounded-lg text-sm text-[#19a9ff] hover:bg-[#101a38] transition-colors">
          <Link2 className="w-4 h-4" /> Copiar link de convite
        </button>
      </div>

      <UserFooter user={user} logout={logout} onProfile={onProfile} />
    </div>
  );
}

export function UserFooter({ user, logout, onProfile }) {
  return (
    <div className="h-16 px-2 flex items-center gap-2 border-t border-[#19a9ff]/10 bg-[#060c1e]">
      <button data-testid="open-profile-button" onClick={onProfile} className="flex items-center gap-2 flex-1 min-w-0 px-2 py-1.5 rounded-lg hover:bg-[#101a38] transition-colors">
        <div className="relative">
          <Avatar user={user} size={34} />
          <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot online size={11} ring="#060c1e" /></span>
        </div>
        <div className="text-left min-w-0">
          <p className="text-sm font-semibold truncate text-cream">{user.name}</p>
          <p className="text-xs text-[#93a4cc] truncate">online</p>
        </div>
      </button>
      <button data-testid="logout-button" onClick={logout} title="Sair" className="w-9 h-9 rounded-lg flex items-center justify-center text-[#93a4cc] hover:text-[#f43f5e] hover:bg-[#101a38] transition-colors">
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
