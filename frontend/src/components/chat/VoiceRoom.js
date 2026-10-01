import { useEffect, useRef } from "react";
import { Volume2, Mic, MicOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./Avatar";
import { useVoice } from "@/hooks/useVoice";

function RemoteAudio({ stream }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}

export default function VoiceRoom({ channel, user }) {
  const { joined, participants, muted, remoteStreams, join, leave, toggleMute } = useVoice(channel.channel_id, user);

  const doJoin = async () => {
    const ok = await join();
    if (!ok) toast.error("Não foi possível acessar o microfone. Permita o acesso ao microfone.");
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#0c1411]">
      <div className="h-14 px-5 flex items-center gap-2 border-b border-[#e78662]/10">
        <Volume2 className="w-5 h-5 text-[#a3b8b0]" />
        <span className="font-heading font-semibold" data-testid="voice-title">{channel.name}</span>
        <span className="text-sm text-[#a3b8b0] ml-2 hidden sm:inline">canal de voz</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {participants.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#121e1a] flex items-center justify-center mb-4"><Volume2 className="w-7 h-7 text-[#e78662]" /></div>
            <p className="font-heading font-semibold text-cream text-lg">Ninguém na chamada ainda</p>
            <p className="text-sm text-[#a3b8b0] mt-1">Entre para começar a conversar por voz ao vivo.</p>
          </div>
        )}
        <div className="flex flex-wrap gap-6 justify-center">
          {participants.map((p) => {
            const you = p.user_id === user.user_id;
            const talking = you ? !muted : true;
            return (
              <div key={p.user_id} data-testid={`voice-participant-${p.user_id}`} className="flex flex-col items-center gap-2">
                <div className={`p-1 rounded-full border-2 transition-colors ${talking ? "border-[#22c55e]/70 shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "border-[#64748b]/40"}`}>
                  <Avatar user={p} size={76} />
                </div>
                <span className="text-sm font-medium text-cream">{p.name}{you ? " (você)" : ""}</span>
              </div>
            );
          })}
        </div>
      </div>

      {Object.entries(remoteStreams).map(([uid, stream]) => <RemoteAudio key={uid} stream={stream} />)}

      <div className="p-4 flex items-center justify-center gap-3 border-t border-[#e78662]/10">
        {!joined ? (
          <button data-testid="voice-join-button" onClick={doJoin} className="px-8 py-3 rounded-full bg-[#22c55e] text-[#0c1411] font-semibold flex items-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] transition-transform">
            <Mic className="w-5 h-5" /> Entrar na chamada
          </button>
        ) : (
          <>
            <button data-testid="voice-mute-button" onClick={toggleMute} title={muted ? "Ativar microfone" : "Silenciar"} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${muted ? "bg-[#f43f5e] text-white" : "bg-[#1a2a25] text-cream hover:bg-[#26413a]"}`}>
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button data-testid="voice-leave-button" onClick={leave} title="Sair da chamada" className="w-12 h-12 rounded-full bg-[#f43f5e] text-white flex items-center justify-center hover:-translate-y-0.5 transition-transform">
              <PhoneOff className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
