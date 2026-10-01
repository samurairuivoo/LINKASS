import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";

// STUN (descoberta) + TURN público (relay) para conectar entre redes/NAT diferentes.
const ICE = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
  ],
};

export function useVoice(channelId, user) {
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [localVideoStream, setLocalVideoStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  const localStream = useRef(null); // apenas áudio
  const cameraTrack = useRef(null);
  const screenStream = useRef(null);
  const peers = useRef({});
  const videoSenders = useRef({}); // uid -> RTCRtpSender (via de vídeo pré-criada)
  const pollRef = useRef(null);
  const joinedRef = useRef(false);
  const videoOnRef = useRef(false);

  const setOutgoingVideo = useCallback((track) => {
    Object.values(videoSenders.current).forEach((s) => { try { s.replaceTrack(track); } catch {} });
    setLocalVideoStream(track ? new MediaStream([track]) : null);
  }, []);

  const cleanupPeer = useCallback((uid) => {
    try { peers.current[uid]?.close(); } catch {}
    delete peers.current[uid]; delete videoSenders.current[uid];
    setRemoteStreams((s) => { const n = { ...s }; delete n[uid]; return n; });
  }, []);

  const createPeer = useCallback((otherId, initiator) => {
    if (peers.current[otherId]) return peers.current[otherId];
    const pc = new RTCPeerConnection(ICE);
    peers.current[otherId] = pc;
    if (localStream.current) localStream.current.getAudioTracks().forEach((t) => pc.addTrack(t, localStream.current));
    // via de vídeo sempre presente => trocar câmera/tela depois NÃO exige renegociar
    const vtrans = pc.addTransceiver("video", { direction: "sendrecv" });
    videoSenders.current[otherId] = vtrans.sender;
    const current = (screenStream.current && screenStream.current.getVideoTracks()[0]) || (videoOnRef.current && cameraTrack.current) || null;
    if (current) { try { vtrans.sender.replaceTrack(current); } catch {} }
    pc.onicecandidate = (e) => { if (e.candidate) api.post("/voice/signal", { channel_id: channelId, to: otherId, type: "ice", payload: e.candidate.toJSON() }).catch(() => {}); };
    pc.ontrack = (e) => { const stream = e.streams[0] || new MediaStream([e.track]); setRemoteStreams((s) => ({ ...s, [otherId]: stream })); };
    if (initiator) {
      pc.onnegotiationneeded = async () => {
        try { await pc.setLocalDescription(await pc.createOffer()); await api.post("/voice/signal", { channel_id: channelId, to: otherId, type: "offer", payload: { sdp: pc.localDescription.sdp, type: pc.localDescription.type } }); } catch {}
      };
    }
    return pc;
  }, [channelId]);

  const handleSignal = useCallback(async (sig) => {
    const from = sig.from; let pc = peers.current[from];
    if (sig.type === "offer") {
      if (!pc) pc = createPeer(from, false);
      await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
      await pc.setLocalDescription(await pc.createAnswer());
      await api.post("/voice/signal", { channel_id: channelId, to: from, type: "answer", payload: { sdp: pc.localDescription.sdp, type: pc.localDescription.type } });
    } else if (sig.type === "answer") {
      if (pc && pc.signalingState === "have-local-offer") await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
    } else if (sig.type === "ice") {
      if (pc) { try { await pc.addIceCandidate(new RTCIceCandidate(sig.payload)); } catch {} }
    }
  }, [channelId, createPeer]);

  const tick = useCallback(async () => {
    if (!joinedRef.current) return;
    try {
      const pres = await api.post(`/channels/${channelId}/voice/join`);
      const list = pres.data || []; setParticipants(list);
      const ids = list.map((p) => p.user_id);
      list.forEach((p) => { if (p.user_id !== user.user_id && !peers.current[p.user_id]) createPeer(p.user_id, user.user_id < p.user_id); });
      Object.keys(peers.current).forEach((uid) => { if (!ids.includes(uid)) cleanupPeer(uid); });
      const sig = await api.get(`/voice/signals`, { params: { channel_id: channelId } });
      for (const s of sig.data) await handleSignal(s);
    } catch {}
  }, [channelId, user, createPeer, cleanupPeer, handleSignal]);

  const join = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return { error: "insecure" };
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
      const n = e?.name || "";
      if (n.includes("NotAllowed") || n.includes("Security") || n.includes("Permission")) return { error: "denied" };
      if (n.includes("NotFound") || n.includes("NotReadable") || n.includes("Overconstrained")) return { error: "nodevice" };
      return { error: "other" };
    }
    localStream.current = stream;
    try { await api.post(`/channels/${channelId}/voice/join`); }
    catch (e) { stream.getTracks().forEach((t) => t.stop()); localStream.current = null; return e?.response?.status === 403 ? { error: "full" } : { error: "other" }; }
    joinedRef.current = true; setJoined(true);
    await tick(); pollRef.current = setInterval(tick, 1200);
    return true;
  }, [channelId, tick]);

  const leave = useCallback(async () => {
    joinedRef.current = false; setJoined(false); setSharing(false); setVideoOn(false); videoOnRef.current = false;
    if (pollRef.current) clearInterval(pollRef.current);
    Object.keys(peers.current).forEach(cleanupPeer);
    cameraTrack.current?.stop(); cameraTrack.current = null;
    screenStream.current?.getTracks().forEach((t) => t.stop()); screenStream.current = null;
    localStream.current?.getTracks().forEach((t) => t.stop()); localStream.current = null;
    setRemoteStreams({}); setParticipants([]); setLocalVideoStream(null);
    try { await api.post(`/channels/${channelId}/voice/leave`); } catch {}
  }, [channelId, cleanupPeer]);

  const toggleMute = useCallback(() => {
    const t = localStream.current?.getAudioTracks()?.[0];
    if (t) { t.enabled = !t.enabled; setMuted(!t.enabled); }
  }, []);

  const toggleVideo = useCallback(async () => {
    if (sharing) return { error: "sharing" };
    if (videoOnRef.current && cameraTrack.current) {
      cameraTrack.current.stop(); cameraTrack.current = null; videoOnRef.current = false; setVideoOn(false); setOutgoingVideo(null); return true;
    }
    try {
      const vs = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraTrack.current = vs.getVideoTracks()[0];
      videoOnRef.current = true; setVideoOn(true); setOutgoingVideo(cameraTrack.current);
      cameraTrack.current.onended = () => { cameraTrack.current = null; videoOnRef.current = false; setVideoOn(false); setOutgoingVideo(null); };
      return true;
    } catch { return { error: "camera" }; }
  }, [sharing, setOutgoingVideo]);

  const toggleScreenShare = useCallback(async () => {
    if (sharing) {
      screenStream.current?.getTracks().forEach((t) => t.stop()); screenStream.current = null; setSharing(false);
      setOutgoingVideo(videoOnRef.current && cameraTrack.current ? cameraTrack.current : null); return true;
    }
    try {
      const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStream.current = ss; const track = ss.getVideoTracks()[0];
      setSharing(true); setOutgoingVideo(track);
      track.onended = () => { screenStream.current = null; setSharing(false); setOutgoingVideo(videoOnRef.current && cameraTrack.current ? cameraTrack.current : null); };
      return true;
    } catch { return { error: "screen" }; }
  }, [sharing, setOutgoingVideo]);

  useEffect(() => () => {
    joinedRef.current = false;
    if (pollRef.current) clearInterval(pollRef.current);
    Object.values(peers.current).forEach((pc) => { try { pc.close(); } catch {} });
    cameraTrack.current?.stop();
    screenStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return { joined, participants, muted, videoOn, sharing, localVideoStream, remoteStreams, join, leave, toggleMute, toggleVideo, toggleScreenShare };
}
