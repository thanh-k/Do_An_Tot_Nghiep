import { useCallback, useEffect, useRef, useState } from "react";
import { buildLivestreamWsUrl } from "@/utils/livestream";

// Hook này nhận tín hiệu WebRTC từ host và hiển thị video realtime cho khách hàng.
export function useLivestreamViewer(livestreamId, onLiveEvent) {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const viewerIdRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const send = useCallback((payload) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (!livestreamId) return undefined;
    const socket = new WebSocket(buildLivestreamWsUrl(livestreamId, "viewer"));
    socketRef.current = socket;
    socket.onopen = () => {
    setConnected(true);
      setError("");
    };

    socket.onerror = () => {
      setConnected(false);
      setError("Không kết nối được máy chủ livestream.");
    };

    socket.onclose = () => {
      setConnected(false);
    };
    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "viewer-ready") {
        viewerIdRef.current = data.viewerId;
      }
      if (data.type === "offer") {
        const peer = new RTCPeerConnection({ iceServers: [] });
        peerRef.current = peer;
        peer.ontrack = (trackEvent) => {
          const [stream] = trackEvent.streams;
          if (videoRef.current) videoRef.current.srcObject = stream;
        };
        peer.onicecandidate = (iceEvent) => {
          if (iceEvent.candidate) {
            send({
              type: "ice-candidate",
              target: data.from || data.hostId,
              from: viewerIdRef.current,
              candidate: iceEvent.candidate,
            });
          }
        };
        await peer.setRemoteDescription(data.offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        send({ type: "answer", target: data.from || data.hostId, from: viewerIdRef.current, answer });
      }
      if (data.type === "ice-candidate" && data.candidate) {
        await peerRef.current?.addIceCandidate(data.candidate);
      }
      if (["pin-product", "deal-started", "deal-ended", "chat", "host-offline", "host-online", "viewer-count"].includes(data.type)) {
        onLiveEvent?.(data);
      }
    };
    return () => {
      peerRef.current?.close();
      socket.close();
    };
  }, [livestreamId, onLiveEvent, send]);

  const sendLiveEvent = useCallback((payload) => {
    send(payload);
  }, [send]);

  return { videoRef, connected, error, sendLiveEvent };
}

export default useLivestreamViewer;
