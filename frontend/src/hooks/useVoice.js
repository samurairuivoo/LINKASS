import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";

const ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };

// WebRTC mesh voice with REST signaling. The peer with the smaller user_id initiates the offer.
export function useVoice(channelId, user) {
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [muted, setMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({}); // userId -> MediaStream

  const localStream = useRef(null);
  const peers = useRef({}); // userId -> RTCPeerConnection
  const pollRef = useRef(null);
  const joinedRef = useRef(false);

  const cleanupPeer = useCallback((uid) => {
    const pc = peers.current[uid];
    if (pc) { try { pc.close(); } catch {} delete peers.current[uid]; }
    setRemoteStreams((s) => { const n = { ...s }; delete n[uid]; return n; });
  }, []);

  const createPeer = useCallback((otherId, initiator) => {
    if (peers.current[otherId]) return peers.current[otherId];
    const pc = new RTCPeerConnection(ICE);
    peers.current[otherId] = pc;
    localStream.current?.getTracks().forEach((t) => pc.addTrack(t, localStream.current));
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        api.post("/voice/signal", { channel_id: channelId, to: otherId, type: "ice", payload: e.candidate.toJSON() }).catch(() => {});
      }
    };
    pc.ontrack = (e) => {
      setRemoteStreams((s) => ({ ...s, [otherId]: e.streams[0] }));
    };
    if (initiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await api.post("/voice/signal", { channel_id: channelId, to: otherId, type: "offer", payload: { sdp: pc.localDescription.sdp, type: pc.localDescription.type } });
        } catch {}
      };
    }
    return pc;
  }, [channelId]);

  const handleSignal = useCallback(async (sig) => {
    const from = sig.from;
    if (sig.type === "offer") {
      const pc = createPeer(from, false);
      await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await api.post("/voice/signal", { channel_id: channelId, to: from, type: "answer", payload: { sdp: pc.localDescription.sdp, type: pc.localDescription.type } });
    } else if (sig.type === "answer") {
      const pc = peers.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
    } else if (sig.type === "ice") {
      const pc = peers.current[from];
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
      // connect to peers
      list.forEach((p) => {
        if (p.user_id !== user.user_id && !peers.current[p.user_id]) {
          createPeer(p.user_id, user.user_id < p.user_id);
        }
      });
      // drop gone peers
      Object.keys(peers.current).forEach((uid) => { if (!ids.includes(uid)) cleanupPeer(uid); });
      // signals
      const sig = await api.get(`/voice/signals`, { params: { channel_id: channelId } });
      for (const s of sig.data) { await handleSignal(s); }
    } catch {}
  }, [channelId, user, createPeer, cleanupPeer, handleSignal]);

  const join = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      joinedRef.current = true;
      setJoined(true);
      await tick();
      pollRef.current = setInterval(tick, 1500);
      return true;
    } catch (e) {
      return false;
    }
  }, [tick]);

  const leave = useCallback(async () => {
    joinedRef.current = false;
    setJoined(false);
    if (pollRef.current) clearInterval(pollRef.current);
    Object.keys(peers.current).forEach(cleanupPeer);
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    setRemoteStreams({});
    setParticipants([]);
    try { await api.post(`/channels/${channelId}/voice/leave`); } catch {}
  }, [channelId, cleanupPeer]);

  const toggleMute = useCallback(() => {
    const track = localStream.current?.getAudioTracks()?.[0];
    if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); }
  }, []);

  // cleanup on unmount
  useEffect(() => () => { joinedRef.current = false; if (pollRef.current) clearInterval(pollRef.current); Object.values(peers.current).forEach((pc) => { try { pc.close(); } catch {} }); localStream.current?.getTracks().forEach((t) => t.stop()); }, []);

  return { joined, participants, muted, remoteStreams, join, leave, toggleMute };
}
