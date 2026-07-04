import { useCallback, useEffect, useRef, useState } from "react";
import { buildLivestreamWsUrl } from "@/utils/livestream";

const parseTurnUrls = (value) => (value || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const TURN_URL = parseTurnUrls(import.meta.env.VITE_TURN_URL);

const ICE_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ...(TURN_URL.length
    ? [
        {
          urls: TURN_URL,
          username: import.meta.env.VITE_TURN_USERNAME || "",
          credential: import.meta.env.VITE_TURN_PASSWORD || import.meta.env.VITE_TURN_CREDENTIAL || "",
        },
      ]
    : []),
];

const PEER_CONFIG = {
  iceServers: ICE_SERVERS,
  iceTransportPolicy: "all",
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceCandidatePoolSize: 4,
};


// Hook này xử lý camera/micro của nhân viên và gửi tín hiệu WebRTC cho người xem qua WebSocket nội bộ.
export function useLivestreamHost(livestreamId, onLiveEvent) {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const peersRef = useRef(new Map());
  const pendingRemoteCandidatesRef = useRef(new Map());
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
    const peer = new RTCPeerConnection(PEER_CONFIG);
    peersRef.current.set(viewerId, peer);
    streamRef.current.getTracks().forEach((track) => peer.addTrack(track, streamRef.current));
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        send({ type: "ice-candidate", target: viewerId, candidate: event.candidate });
      }
    };
    peer.oniceconnectionstatechange = () => {
      // Không xử lý trạng thái disconnected vì đây có thể là trạng thái tạm thời.
      // Chỉ đóng peer khi failed để tránh host gửi offer mới liên tục làm viewer bị reset video.
      if (peer.iceConnectionState === "failed") {
        peer.close();
        peersRef.current.delete(viewerId);
        setViewerCount(peersRef.current.size);
      }
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "failed" || peer.connectionState === "closed") {
        peer.close();
        peersRef.current.delete(viewerId);
        setViewerCount(peersRef.current.size);
      }
    };
    const offer = await peer.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
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
      socket.onerror = () => {
        setError("Không kết nối được máy chủ livestream. Vui lòng kiểm tra WebSocket hoặc mạng.");
      };
      socket.onclose = () => {
        if (started) {
          setError("Kết nối livestream bị gián đoạn. Vui lòng bấm dừng và bắt đầu lại.");
        }
      };
      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "viewer-joined") {
          await createPeerForViewer(data.viewerId);
        }
        if (data.type === "answer") {
          const viewerId = data.from || data.viewerId;
          const peer = peersRef.current.get(viewerId);
          if (peer && data.answer) {
            await peer.setRemoteDescription(data.answer);
            const pending = pendingRemoteCandidatesRef.current.get(viewerId) || [];
            pendingRemoteCandidatesRef.current.delete(viewerId);
            for (const candidate of pending) {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }
        }
        if (data.type === "ice-candidate") {
          const viewerId = data.from || data.viewerId;
          const peer = peersRef.current.get(viewerId);
          if (peer && data.candidate) {
            if (peer.remoteDescription) {
              await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
            } else {
              const pending = pendingRemoteCandidatesRef.current.get(viewerId) || [];
              pending.push(data.candidate);
              pendingRemoteCandidatesRef.current.set(viewerId, pending);
            }
          }
        }
        if (data.type === "viewer-left") {
          const peer = peersRef.current.get(data.viewerId);
          peer?.close();
          peersRef.current.delete(data.viewerId);
          pendingRemoteCandidatesRef.current.delete(data.viewerId);
          setViewerCount(peersRef.current.size);
        }
        if (data.type === "viewer-count") {
          setViewerCount(Number(data.viewerCount || 0));
        }
        if (["chat", "pin-product", "deal-started", "deal-ended", "host-online", "host-offline", "pin-chat-message", "unpin-chat-message"].includes(data.type)) {
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
    pendingRemoteCandidatesRef.current.clear();
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
