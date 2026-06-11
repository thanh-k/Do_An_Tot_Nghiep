import { useCallback, useEffect, useRef, useState } from "react";
import { buildLivestreamWsUrl } from "@/utils/livestream";

// Hook này xử lý camera/micro của nhân viên và gửi tín hiệu WebRTC cho người xem qua WebSocket nội bộ.
export function useLivestreamHost(livestreamId, onLiveEvent) {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const peersRef = useRef(new Map());
  const [started, setStarted] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState("");

  const send = useCallback((payload) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }, []);

  const createPeerForViewer = useCallback(async (viewerId) => {
    if (!streamRef.current || peersRef.current.has(viewerId)) return;
    const peer = new RTCPeerConnection({ iceServers: [] });
    peersRef.current.set(viewerId, peer);
    streamRef.current.getTracks().forEach((track) => peer.addTrack(track, streamRef.current));
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        send({ type: "ice-candidate", target: viewerId, candidate: event.candidate });
      }
    };
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    send({ type: "offer", target: viewerId, offer });
    setViewerCount(peersRef.current.size);
  }, [send]);

  const start = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const socket = new WebSocket(buildLivestreamWsUrl(livestreamId, "host"));
      socketRef.current = socket;
      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "viewer-joined") {
          await createPeerForViewer(data.viewerId);
        }
        if (data.type === "answer") {
          const peer = peersRef.current.get(data.from || data.viewerId);
          if (peer && data.answer) await peer.setRemoteDescription(data.answer);
        }
        if (data.type === "ice-candidate") {
          const peer = peersRef.current.get(data.from || data.viewerId);
          if (peer && data.candidate) await peer.addIceCandidate(data.candidate);
        }
        if (data.type === "viewer-left") {
          const peer = peersRef.current.get(data.viewerId);
          peer?.close();
          peersRef.current.delete(data.viewerId);
          setViewerCount(peersRef.current.size);
        }
        if (data.type === "viewer-count") {
          setViewerCount(Number(data.viewerCount || 0));
        }
        if (["chat", "pin-product", "deal-started", "deal-ended", "host-online", "host-offline"].includes(data.type)) {
          onLiveEvent?.(data);
        }
      };
      setStarted(true);
    } catch (err) {
      setError("Không mở được camera/micro. Vui lòng cấp quyền truy cập thiết bị.");
    }
  }, [createPeerForViewer, livestreamId, onLiveEvent]);

  const stop = useCallback(() => {
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    socketRef.current?.close();
    socketRef.current = null;
    setStarted(false);
    setViewerCount(0);
  }, []);

  const broadcastLiveEvent = useCallback((payload) => {
    send(payload);
  }, [send]);

  useEffect(() => stop, [stop]);

  return { videoRef, started, viewerCount, error, start, stop, broadcastLiveEvent };
}

export default useLivestreamHost;
