package com.ecommerce.modules.livestream.websocket;

import com.ecommerce.modules.livestream.document.LivestreamChatMessage;
import com.ecommerce.modules.livestream.realtime.LivestreamRealtimeEventService;
import com.ecommerce.modules.livestream.repository.LivestreamRepository;
import com.ecommerce.modules.livestream.repository.mongo.LivestreamChatMessageRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class LivestreamSignalingHandler extends TextWebSocketHandler {
    private final ObjectMapper mapper = new ObjectMapper();
    private final LivestreamRepository livestreamRepository;
    private final LivestreamRealtimeEventService realtimeEventService;
    private final LivestreamChatMessageRepository chatMessageRepository;

    private final Map<String, WebSocketSession> hosts = new ConcurrentHashMap<>();
    private final Map<String, Map<String, WebSocketSession>> viewers = new ConcurrentHashMap<>();
    private final Map<String, Map<String, WebSocketSession>> observers = new ConcurrentHashMap<>();
    private final Map<String, String> sessionLiveMap = new ConcurrentHashMap<>();
    private final Map<String, String> sessionRoleMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String liveId = extractLiveId(session.getUri());
        String role = extractQuery(session.getUri(), "role", "viewer");
        sessionLiveMap.put(session.getId(), liveId);
        sessionRoleMap.put(session.getId(), role);

        if ("host".equalsIgnoreCase(role)) {
            hosts.put(liveId, session);
            updateViewerCount(liveId, 0);
            send(session, Map.of("type", "host-ready", "liveId", liveId, "hostId", session.getId()));
            broadcastAll(liveId, Map.of("type", "host-online", "liveId", liveId), session.getId());
            saveRealtimeEvent(liveId, "host-online", session.getId(), Map.of("type", "host-online"));
            broadcastViewerCount(liveId);
            return;
        }

        if ("observer".equalsIgnoreCase(role)) {
            observers.computeIfAbsent(liveId, ignored -> new ConcurrentHashMap<>()).put(session.getId(), session);
            send(session, Map.of(
                    "type", "observer-ready",
                    "liveId", liveId,
                    "observerId", session.getId(),
                    "viewerCount", viewerCount(liveId)
            ));
            return;
        }

        viewers.computeIfAbsent(liveId, ignored -> new ConcurrentHashMap<>()).put(session.getId(), session);
        send(session, Map.of(
                "type", "viewer-ready",
                "liveId", liveId,
                "viewerId", session.getId(),
                "viewerCount", viewerCount(liveId)
        ));

        incrementTotalViews(liveId);
        updateViewerCount(liveId, viewerCount(liveId));
        WebSocketSession host = hosts.get(liveId);
        if (host != null && host.isOpen()) {
            send(host, Map.of("type", "viewer-joined", "liveId", liveId, "viewerId", session.getId()));
        }
        broadcastViewerCount(liveId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String liveId = sessionLiveMap.get(session.getId());
        if (liveId == null) return;

        JsonNode root = mapper.readTree(message.getPayload());
        String target = root.hasNonNull("target") ? root.get("target").asText() : null;
        String type = root.hasNonNull("type") ? root.get("type").asText() : "signal";

        if (target != null && !target.isBlank()) {
            WebSocketSession targetSession = findSession(liveId, target);
            if (targetSession != null && targetSession.isOpen()) {
                Map<String, Object> forwarded = mapper.readValue(message.getPayload(), Map.class);
                forwarded.put("from", session.getId());
                targetSession.sendMessage(new TextMessage(mapper.writeValueAsString(forwarded)));
            }
            return;
        }

        if (shouldBroadcastRealtimeEvent(type)) {
            Map<String, Object> payload = mapper.readValue(message.getPayload(), Map.class);
            payload.put("liveId", liveId);
            broadcastAll(liveId, payload, session.getId());
            saveRealtimeEvent(liveId, type, session.getId(), payload);
            if ("chat".equals(type)) {
                saveChatMessage(liveId, payload);
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String liveId = sessionLiveMap.remove(session.getId());
        String role = sessionRoleMap.remove(session.getId());
        if (liveId == null) return;

        if ("host".equalsIgnoreCase(role)) {
            hosts.remove(liveId);
            updateViewerCount(liveId, 0);
            broadcastAll(liveId, Map.of("type", "host-offline", "liveId", liveId, "viewerCount", 0), null);
            saveRealtimeEvent(liveId, "host-offline", session.getId(), Map.of("type", "host-offline", "viewerCount", 0));
            return;
        }

        if ("observer".equalsIgnoreCase(role)) {
            Map<String, WebSocketSession> liveObservers = observers.get(liveId);
            if (liveObservers != null) liveObservers.remove(session.getId());
            return;
        }

        Map<String, WebSocketSession> liveViewers = viewers.get(liveId);
        if (liveViewers != null) liveViewers.remove(session.getId());

        WebSocketSession host = hosts.get(liveId);
        if (host != null && host.isOpen()) {
            send(host, Map.of("type", "viewer-left", "liveId", liveId, "viewerId", session.getId()));
        }
        updateViewerCount(liveId, viewerCount(liveId));
        broadcastViewerCount(liveId);
    }

    private boolean shouldBroadcastRealtimeEvent(String type) {
        return type.startsWith("live-")
                || "chat".equals(type)
                || "pin-product".equals(type)
                || "unpin-product".equals(type)
                || "product-removed".equals(type)
                || "deal-started".equals(type)
                || "deal-ended".equals(type)
                || "host-offline".equals(type)
                || "host-online".equals(type);
    }

    private WebSocketSession findSession(String liveId, String sessionId) {
        WebSocketSession host = hosts.get(liveId);
        if (host != null && host.getId().equals(sessionId)) return host;
        Map<String, WebSocketSession> liveViewers = viewers.get(liveId);
        WebSocketSession viewer = liveViewers == null ? null : liveViewers.get(sessionId);
        if (viewer != null) return viewer;
        Map<String, WebSocketSession> liveObservers = observers.get(liveId);
        return liveObservers == null ? null : liveObservers.get(sessionId);
    }

    private void broadcastAll(String liveId, Map<?, ?> payload, String exceptSessionId) throws IOException {
        String json = mapper.writeValueAsString(payload);
        broadcastTo(liveId, viewers, json, exceptSessionId);
        broadcastTo(liveId, observers, json, exceptSessionId);
        WebSocketSession host = hosts.get(liveId);
        if (host != null && host.isOpen() && !host.getId().equals(exceptSessionId)) {
            host.sendMessage(new TextMessage(json));
        }
    }

    private void broadcastTo(String liveId, Map<String, Map<String, WebSocketSession>> bucket, String json, String exceptSessionId) throws IOException {
        Map<String, WebSocketSession> sessions = bucket.get(liveId);
        if (sessions == null) return;
        for (WebSocketSession session : sessions.values()) {
            if (session.isOpen() && !session.getId().equals(exceptSessionId)) {
                session.sendMessage(new TextMessage(json));
            }
        }
    }

    private void broadcastViewerCount(String liveId) throws IOException {
        int count = viewerCount(liveId);
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "viewer-count");
        payload.put("liveId", liveId);
        payload.put("viewerCount", count);
        broadcastAll(liveId, payload, null);
        saveRealtimeEvent(liveId, "viewer-count", null, payload);
    }

    private int viewerCount(String liveId) {
        Map<String, WebSocketSession> liveViewers = viewers.get(liveId);
        return liveViewers == null ? 0 : (int) liveViewers.values().stream().filter(WebSocketSession::isOpen).count();
    }

    private void incrementTotalViews(String liveId) {
        parseLiveId(liveId).flatMap(livestreamRepository::findById).ifPresent(live -> {
            live.setTotalViews((live.getTotalViews() == null ? 0 : live.getTotalViews()) + 1);
            livestreamRepository.save(live);
        });
    }

    private void updateViewerCount(String liveId, int count) {
        parseLiveId(liveId).flatMap(livestreamRepository::findById).ifPresent(live -> {
            live.setViewerCount((long) Math.max(0, count));
            livestreamRepository.save(live);
        });
    }

    private void saveRealtimeEvent(String liveId, String type, String actorSessionId, Map<String, Object> payload) {
        parseLiveId(liveId).ifPresent(id -> realtimeEventService.saveEvent(id, type, actorSessionId, payload));
    }

    private void saveChatMessage(String liveId, Map<String, Object> payload) {
        parseLiveId(liveId).ifPresent(id -> {
            try {
                String message = String.valueOf(payload.getOrDefault("message", "")).trim();
                if (message.isBlank()) return;
                chatMessageRepository.save(LivestreamChatMessage.builder()
                        .livestreamId(id)
                        .senderName(String.valueOf(payload.getOrDefault("senderName", "Khách")))
                        .senderRole(String.valueOf(payload.getOrDefault("senderRole", "USER")))
                        .message(message.length() > 500 ? message.substring(0, 500) : message)
                        .createdAt(java.time.LocalDateTime.now())
                        .build());
            } catch (Exception exception) {
                log.warn("Không lưu được chat livestream vào MongoDB: {}", exception.getMessage());
            }
        });
    }

    private Optional<Long> parseLiveId(String liveId) {
        try { return Optional.of(Long.parseLong(liveId)); } catch (Exception ignored) { return Optional.empty(); }
    }

    private void send(WebSocketSession session, Map<?, ?> payload) throws IOException {
        session.sendMessage(new TextMessage(mapper.writeValueAsString(payload)));
    }

    private String extractLiveId(URI uri) {
        if (uri == null) return "0";
        String path = uri.getPath();
        int index = path.lastIndexOf('/');
        return index >= 0 ? path.substring(index + 1) : "0";
    }

    private String extractQuery(URI uri, String name, String fallback) {
        if (uri == null) return fallback;
        String value = UriComponentsBuilder.fromUri(uri).build().getQueryParams().getFirst(name);
        return value == null || value.isBlank() ? fallback : value;
    }
}
