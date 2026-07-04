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

const CONNECT_TIMEOUT_MS = 12000;
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 2;

const isPeerReusable = (peer) => {
  if (!peer) return false;
  return !["failed", "closed"].includes(peer.connectionState) && peer.signalingState !== "closed";
};

// Hook này nhận tín hiệu WebRTC từ host và hiển thị video realtime cho khách hàng.
export function useLivestreamViewer(livestreamId, onLiveEvent) {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const viewerIdRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const connectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const closedByCleanupRef = useRef(false);
  const reconnectingRef = useRef(false);
  const hasRemoteStreamRef = useRef(false);
  const offerProcessingRef = useRef(false);
  const pendingRemoteCandidatesRef = useRef([]);
  const onLiveEventRef = useRef(onLiveEvent);

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onLiveEventRef.current = onLiveEvent;
  }, [onLiveEvent]);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  const closePeer = useCallback(() => {
    try {
      peerRef.current?.getSenders?.().forEach((sender) => sender.track?.stop?.());
      peerRef.current?.close?.();
    } catch (_) {
      // ignore cleanup errors
    }
    peerRef.current = null;
    pendingRemoteCandidatesRef.current = [];
    offerProcessingRef.current = false;
    pendingRemoteCandidatesRef.current = [];
  }, []);

  const send = useCallback((payload) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!livestreamId) return undefined;

    closedByCleanupRef.current = false;
    reconnectingRef.current = false;
    reconnectAttemptsRef.current = 0;
    hasRemoteStreamRef.current = false;
    offerProcessingRef.current = false;

    const cleanupSocket = () => {
      try {
        socketRef.current?.close?.();
      } catch (_) {
        // ignore
      }
      socketRef.current = null;
    };

    const connect = () => {
      if (closedByCleanupRef.current) return;

      const existingSocket = socketRef.current;
      if (existingSocket?.readyState === WebSocket.OPEN || existingSocket?.readyState === WebSocket.CONNECTING) {
        reconnectingRef.current = false;
        return;
      }

      if (!hasRemoteStreamRef.current) {
        setConnected(false);
        setError("");
      }

      const socket = new WebSocket(buildLivestreamWsUrl(livestreamId, "viewer"));
      socketRef.current = socket;

      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }

      connectTimeoutRef.current = setTimeout(() => {
        if (!closedByCleanupRef.current && !hasRemoteStreamRef.current) {
          reconnectingRef.current = false;
          setConnected(false);
          setError("Chưa nhận được tín hiệu livestream. Vui lòng đợi hoặc thử tải lại sau.");
        }
      }, CONNECT_TIMEOUT_MS);

      const scheduleReconnect = (reason = "") => {
        if (closedByCleanupRef.current || reconnectingRef.current) return;

        // Nếu video đang chạy rồi thì không tự reconnect vì sẽ làm reset video liên tục.
        if (hasRemoteStreamRef.current && reason !== "failed") return;

        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          reconnectingRef.current = false;
          if (!hasRemoteStreamRef.current) {
            setConnected(false);
            setError("Không thể kết nối livestream. Vui lòng kiểm tra mạng và thử lại.");
          }
          return;
        }

        reconnectingRef.current = true;
        reconnectAttemptsRef.current += 1;
        if (!hasRemoteStreamRef.current) {
          setConnected(false);
          setError("Đang kết nối lại livestream...");
        }
        clearTimers();

        reconnectTimerRef.current = setTimeout(() => {
          closePeer();
          cleanupSocket();
          reconnectingRef.current = false;
          connect();
        }, RECONNECT_DELAY_MS);
      };

      const createPeer = async (data) => {
        // Backend/host có thể gửi trùng offer khi viewer-count hoặc host reconnect.
        // Nếu đã có peer đang kết nối/đã có stream thì bỏ qua offer mới để tránh reset video liên tục.
        if (offerProcessingRef.current) return;
        if (hasRemoteStreamRef.current && isPeerReusable(peerRef.current)) return;
        if (isPeerReusable(peerRef.current) && ["have-remote-offer", "stable"].includes(peerRef.current.signalingState)) return;

        offerProcessingRef.current = true;
        closePeer();

        const peer = new RTCPeerConnection(PEER_CONFIG);
        peerRef.current = peer;

        peer.ontrack = (trackEvent) => {
          const [stream] = trackEvent.streams;
          if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
            // Ép trình duyệt Android chạy video
            setTimeout(() => {
              videoRef.current?.play().catch(err => console.warn("Autoplay blocked:", err));
            }, 100);
          }
          hasRemoteStreamRef.current = true;
          reconnectingRef.current = false;
          offerProcessingRef.current = false;
          setConnected(true);
          setError("");
          reconnectAttemptsRef.current = 0;
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = null;
          }
        };

        peer.onicecandidate = (iceEvent) => {
          if (!iceEvent.candidate) return;
          send({
            type: "ice-candidate",
            target: data.from || data.hostId,
            from: viewerIdRef.current,
            candidate: iceEvent.candidate,
          });
        };

        peer.oniceconnectionstatechange = () => {
          const state = peer.iceConnectionState;
          if (state === "connected" || state === "completed") {
            hasRemoteStreamRef.current = true;
            reconnectingRef.current = false;
            offerProcessingRef.current = false;
            setConnected(true);
            setError("");
            reconnectAttemptsRef.current = 0;
          }

          // Không reconnect ở trạng thái disconnected vì đây thường là trạng thái tạm thời khi mạng dao động.
          if (state === "failed") {
            scheduleReconnect("failed");
          }
        };

        peer.onconnectionstatechange = () => {
          if (peer.connectionState === "connected") {
            hasRemoteStreamRef.current = true;
            reconnectingRef.current = false;
            offerProcessingRef.current = false;
            setConnected(true);
            setError("");
            reconnectAttemptsRef.current = 0;
          }

          if (peer.connectionState === "failed") {
            scheduleReconnect("failed");
          }
        };

        try {
          await peer.setRemoteDescription(data.offer);

          if (pendingRemoteCandidatesRef.current.length) {
            const candidates = [...pendingRemoteCandidatesRef.current];
            pendingRemoteCandidatesRef.current = [];
            for (const candidate of candidates) {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          send({ type: "answer", target: data.from || data.hostId, from: viewerIdRef.current, answer });
        } catch (err) {
          offerProcessingRef.current = false;
          console.warn("Không tạo được kết nối livestream:", err);
          scheduleReconnect("failed");
        }
      };

      socket.onopen = () => {
        setError("");
      };

      socket.onerror = () => {
        if (!hasRemoteStreamRef.current) {
          setConnected(false);
          setError("Không kết nối được máy chủ livestream.");
        }
      };

      socket.onclose = () => {
        if (!hasRemoteStreamRef.current) {
          setConnected(false);
          if (!closedByCleanupRef.current) {
            scheduleReconnect("socket-close");
          }
        }
      };

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "viewer-ready") {
            viewerIdRef.current = data.viewerId;
          }

          if (data.type === "offer") {
            await createPeer(data);
          }

          if (data.type === "ice-candidate" && data.candidate) {
            const peer = peerRef.current;
            if (peer?.remoteDescription) {
              await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
            } else {
              pendingRemoteCandidatesRef.current.push(data.candidate);
            }
          }

          if (data.type === "host-offline") {
            if (!hasRemoteStreamRef.current) {
              closePeer();
              setConnected(false);
              setError("Livestream hiện chưa có tín hiệu từ host.");
            } else {
              setError("Tín hiệu host đang gián đoạn. Video sẽ tiếp tục nếu kết nối còn ổn định.");
            }
          }

          if (["pin-product", "deal-started", "deal-ended", "chat", "host-offline", "host-online", "viewer-count", "pin-chat-message", "unpin-chat-message"].includes(data.type)) {
            onLiveEventRef.current?.(data);
          }
        } catch (err) {
          console.warn("Không xử lý được tín hiệu livestream:", err);
        }
      };
    };

    connect();

    return () => {
      closedByCleanupRef.current = true;
      reconnectingRef.current = false;
      clearTimers();
      closePeer();
      cleanupSocket();
    };
  }, [livestreamId, send, closePeer, clearTimers]);

  const sendLiveEvent = useCallback((payload) => {
    send(payload);
  }, [send]);

  return { videoRef, connected, error, sendLiveEvent };
}

export default useLivestreamViewer;
