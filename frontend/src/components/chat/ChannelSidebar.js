import { Hash, Plus, LogOut, Settings, ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { Avatar, PresenceDot } from "./Avatar";
import { useAuth } from "@/context/AuthContext";

export default function ChannelSidebar({ server, channels, activeChannel, onSelectChannel, onCreateChannel, onProfile }) {
  const { user, logout } = useAuth();

  const copyInvite = () => {
    navigator.clipboard.writeText(server.invite_code);
    toast.success("Código de convite copiado!");
  };

  return (
    <div className="h-full w-[240px] shrink-0 bg-[#0c1411] flex flex-col border-r border-[#e78662]/10">
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#e78662]/10">
        <span className="font-heading font-bold truncate" data-testid="sidebar-server-name">{server.name}</span>
        <button data-testid="copy-invite-button" onClick={copyInvite} title="Copiar convite" className="text-[#a3b8b0] hover:text-[#e78662] transition-colors">
          <Copy className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#a3b8b0]">Canais de texto</span>
          <button data-testid="create-channel-button" onClick={onCreateChannel} className="text-[#a3b8b0] hover:text-[#e78662]">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {channels.map((c) => {
          const active = activeChannel?.channel_id === c.channel_id;
          return (
            <button
              key={c.channel_id}
              data-testid={`channel-item-${c.name}`}
              onClick={() => onSelectChannel(c)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                active ? "bg-[#1a2a25] text-cream" : "text-[#a3b8b0] hover:bg-[#121e1a] hover:text-cream"
              }`}
            >
              <Hash className="w-4 h-4 shrink-0 opacity-70" />
              <span className="truncate">{c.name}</span>
            </button>
          );
        })}
      </div>

      <UserFooter user={user} logout={logout} onProfile={onProfile} />
    </div>
  );
}

export function UserFooter({ user, logout, onProfile }) {
  return (
    <div className="h-16 px-2 flex items-center gap-2 border-t border-[#e78662]/10 bg-[#080f0d]">
      <button data-testid="open-profile-button" onClick={onProfile} className="flex items-center gap-2 flex-1 min-w-0 px-2 py-1.5 rounded-lg hover:bg-[#121e1a] transition-colors">
        <div className="relative">
          <Avatar user={user} size={34} />
          <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot online size={11} ring="#080f0d" /></span>
        </div>
        <div className="text-left min-w-0">
          <p className="text-sm font-semibold truncate text-cream">{user.name}</p>
          <p className="text-xs text-[#a3b8b0] truncate">online</p>
        </div>
      </button>
      <button data-testid="logout-button" onClick={logout} title="Sair" className="w-9 h-9 rounded-lg flex items-center justify-center text-[#a3b8b0] hover:text-[#f43f5e] hover:bg-[#121e1a] transition-colors">
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
