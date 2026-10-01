import { useEffect, useRef } from "react";
import { Volume2, Mic, MicOff, PhoneOff, Video, VideoOff, MonitorUp, MonitorOff } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./Avatar";
import { useVoice } from "@/hooks/useVoice";

function MediaTile({ stream, muted, name, you }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  const hasVideo = stream && stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live");
  return (
    <div data-testid={`voice-tile-${name}`} className="relative w-56 h-40 rounded-2xl overflow-hidden bg-[#101a38] border border-[#19a9ff]/20 flex items-center justify-center">
      <video ref={ref} autoPlay playsInline muted={muted} className={`absolute inset-0 w-full h-full object-cover ${hasVideo ? "" : "hidden"}`} />
      {!hasVideo && (
        <div className="flex flex-col items-center gap-2">
          <div className="p-1 rounded-full border-2 border-[#22c55e]/60"><Avatar user={{ name }} size={56} /></div>
        </div>
      )}
      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/50 text-xs text-white">{name}{you ? " (você)" : ""}</span>
    </div>
  );
}

export default function VoiceRoom({ channel, user }) {
  const { joined, participants, muted, videoOn, sharing, hasVideo, localStream, remoteStreams, join, leave, toggleMute, toggleVideo, toggleScreenShare } = useVoice(channel.channel_id, user);

  const doJoin = async () => {
    const ok = await join();
    if (!ok) toast.error("Não foi possível acessar microfone/câmera. Permita o acesso.");
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#0a1228]">
      <div className="h-14 px-5 flex items-center gap-2 border-b border-[#19a9ff]/10">
        <Volume2 className="w-5 h-5 text-[#93a4cc]" />
        <span className="font-heading font-semibold" data-testid="voice-title">{channel.name}</span>
        <span className="text-sm text-[#93a4cc] ml-2 hidden sm:inline">canal de voz e vídeo</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {participants.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#101a38] flex items-center justify-center mb-4"><Volume2 className="w-7 h-7 text-[#19a9ff]" /></div>
            <p className="font-heading font-semibold text-cream text-lg">Ninguém na chamada ainda</p>
            <p className="text-sm text-[#93a4cc] mt-1">Entre para conversar por voz e vídeo ao vivo.</p>
          </div>
        )}
        <div className="flex flex-wrap gap-5 justify-center">
          {joined && <MediaTile stream={localStream} muted name={user.name} you />}
          {participants.filter((p) => p.user_id !== user.user_id).map((p) => (
            <MediaTile key={p.user_id} stream={remoteStreams[p.user_id]} muted={false} name={p.name} />
          ))}
        </div>
      </div>

      <div className="p-4 flex items-center justify-center gap-3 border-t border-[#19a9ff]/10">
        {!joined ? (
          <button data-testid="voice-join-button" onClick={doJoin} className="px-8 py-3 rounded-full bg-[#22c55e] text-[#0a1228] font-semibold flex items-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] transition-transform">
            <Mic className="w-5 h-5" /> Entrar na chamada
          </button>
        ) : (
          <>
            <button data-testid="voice-mute-button" onClick={toggleMute} title={muted ? "Ativar microfone" : "Silenciar"} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${muted ? "bg-[#f43f5e] text-white" : "bg-[#17264b] text-cream hover:bg-[#22407a]"}`}>
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button data-testid="voice-video-button" onClick={toggleVideo} disabled={!hasVideo} title={videoOn ? "Desligar câmera" : "Ligar câmera"} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${videoOn ? "bg-[#19a9ff] text-[#0a1228]" : "bg-[#17264b] text-cream hover:bg-[#22407a]"}`}>
              {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button data-testid="voice-screenshare-button" onClick={toggleScreenShare} title={sharing ? "Parar compartilhamento" : "Compartilhar tela"} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${sharing ? "bg-[#19a9ff] text-[#0a1228]" : "bg-[#17264b] text-cream hover:bg-[#22407a]"}`}>
              {sharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
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
