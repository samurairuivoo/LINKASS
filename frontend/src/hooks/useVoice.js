import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";

// STUN for discovery + public TURN relays so peers connect across different networks/NAT.
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
  const [hasVideo, setHasVideo] = useState(false);
  const [localStreamState, setLocalStreamState] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  const localStream = useRef(null);
  const screenStream = useRef(null);
  const cameraTrack = useRef(null);
  const peers = useRef({});
  const pollRef = useRef(null);
  const joinedRef = useRef(false);

  const replaceVideoForAll = useCallback((track) => {
    Object.values(peers.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.__video);
      if (sender) sender.replaceTrack(track).catch(() => {});
      else if (track) { const ns = pc.addTrack(track, localStream.current || new MediaStream([track])); ns.__video = true; }
    });
  }, []);

  const cleanupPeer = useCallback((uid) => {
    const pc = peers.current[uid];
    if (pc) { try { pc.close(); } catch {} delete peers.current[uid]; }
    setRemoteStreams((s) => { const n = { ...s }; delete n[uid]; return n; });
  }, []);

  const createPeer = useCallback((otherId, initiator) => {
    if (peers.current[otherId]) return peers.current[otherId];
    const pc = new RTCPeerConnection(ICE);
    peers.current[otherId] = pc;
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => {
        const sender = pc.addTrack(t, localStream.current);
        if (t.kind === "video") sender.__video = true;
      });
    }
    if (sharing && screenStream.current) {
      const st = screenStream.current.getVideoTracks()[0];
      if (st && !pc.getSenders().some((s) => s.__video)) { const ns = pc.addTrack(st, screenStream.current); ns.__video = true; }
    }
    pc.onicecandidate = (e) => {
      if (e.candidate) api.post("/voice/signal", { channel_id: channelId, to: otherId, type: "ice", payload: e.candidate.toJSON() }).catch(() => {});
    };
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setRemoteStreams((s) => ({ ...s, [otherId]: stream }));
    };
    if (initiator) {
      pc.onnegotiationneeded = async () => {
        try {
          await pc.setLocalDescription(await pc.createOffer());
          await api.post("/voice/signal", { channel_id: channelId, to: otherId, type: "offer", payload: { sdp: pc.localDescription.sdp, type: pc.localDescription.type } });
        } catch {}
      };
    }
    return pc;
  }, [channelId, sharing]);

  const handleSignal = useCallback(async (sig) => {
    const from = sig.from;
    let pc = peers.current[from];
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
      const list = pres.data || [];
      setParticipants(list);
      const ids = list.map((p) => p.user_id);
      list.forEach((p) => {
        if (p.user_id !== user.user_id && !peers.current[p.user_id]) createPeer(p.user_id, user.user_id < p.user_id);
      });
      Object.keys(peers.current).forEach((uid) => { if (!ids.includes(uid)) cleanupPeer(uid); });
      const sig = await api.get(`/voice/signals`, { params: { channel_id: channelId } });
      for (const s of sig.data) await handleSignal(s);
    } catch {}
  }, [channelId, user, createPeer, cleanupPeer, handleSignal]);

  const join = useCallback(async () => {
    let stream;
    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getVideoTracks().forEach((t) => (t.enabled = false));
        cameraTrack.current = stream.getVideoTracks()[0] || null;
        setHasVideo(!!cameraTrack.current);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setHasVideo(false);
      }
    } catch { return false; }
    localStream.current = stream;
    setLocalStreamState(stream);
    try {
      await api.post(`/channels/${channelId}/voice/join`);
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      localStream.current = null; setLocalStreamState(null);
      return e?.response?.status === 403 ? "full" : false;
    }
    joinedRef.current = true;
    setJoined(true);
    await tick();
    pollRef.current = setInterval(tick, 1200);
    return true;
  }, [channelId, tick]);

  const leave = useCallback(async () => {
    joinedRef.current = false;
    setJoined(false); setSharing(false); setVideoOn(false);
    if (pollRef.current) clearInterval(pollRef.current);
    Object.keys(peers.current).forEach(cleanupPeer);
    screenStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current?.getTracks().forEach((t) => t.stop());
    screenStream.current = null; localStream.current = null; cameraTrack.current = null;
    setRemoteStreams({}); setParticipants([]); setLocalStreamState(null);
    try { await api.post(`/channels/${channelId}/voice/leave`); } catch {}
  }, [channelId, cleanupPeer]);

  const toggleMute = useCallback(() => {
    const t = localStream.current?.getAudioTracks()?.[0];
    if (t) { t.enabled = !t.enabled; setMuted(!t.enabled); }
  }, []);

  const toggleVideo = useCallback(() => {
    if (sharing) return;
    const t = cameraTrack.current;
    if (t) { t.enabled = !t.enabled; setVideoOn(t.enabled); setLocalStreamState(localStream.current); }
  }, [sharing]);

  const toggleScreenShare = useCallback(async () => {
    if (sharing) {
      screenStream.current?.getTracks().forEach((t) => t.stop());
      screenStream.current = null;
      if (cameraTrack.current) cameraTrack.current.enabled = false;
      replaceVideoForAll(cameraTrack.current || null);
      setVideoOn(false); setSharing(false); setLocalStreamState(localStream.current);
      return;
    }
    try {
      const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStream.current = ss;
      const track = ss.getVideoTracks()[0];
      replaceVideoForAll(track);
      track.onended = () => { if (joinedRef.current && screenStream.current) toggleScreenShare(); };
      setSharing(true); setLocalStreamState(ss);
    } catch {}
  }, [sharing, replaceVideoForAll]);

  useEffect(() => () => {
    joinedRef.current = false;
    if (pollRef.current) clearInterval(pollRef.current);
    Object.values(peers.current).forEach((pc) => { try { pc.close(); } catch {} });
    localStream.current?.getTracks().forEach((t) => t.stop());
    screenStream.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return { joined, participants, muted, videoOn, sharing, hasVideo, localStream: localStreamState, remoteStreams, join, leave, toggleMute, toggleVideo, toggleScreenShare };
}
