package com.ecommerce.modules.livestream.realtime;

import com.ecommerce.modules.livestream.document.LivestreamRealtimeEvent;
import com.ecommerce.modules.livestream.repository.mongo.LivestreamRealtimeEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LivestreamRealtimeEventService {
    private final LivestreamRealtimeEventRepository repository;

    public void saveEvent(Long livestreamId, String eventType, String actorSessionId, Map<String, Object> payload) {
        try {
            Long productId = extractLong(payload.get("productId"));
            Integer viewerCount = extractInteger(payload.get("viewerCount"));
            repository.save(LivestreamRealtimeEvent.builder()
                    .livestreamId(livestreamId)
                    .eventType(eventType)
                    .actorSessionId(actorSessionId)
                    .productId(productId)
                    .viewerCount(viewerCount)
                    .payload(payload)
                    .createdAt(LocalDateTime.now())
                    .build());
        } catch (Exception exception) {
            // Không để MongoDB làm ngắt livestream. Nếu Mongo lỗi, WebRTC/WebSocket vẫn chạy bình thường.
            log.warn("Không lưu được sự kiện realtime livestream vào MongoDB: {}", exception.getMessage());
        }
    }

    private Long extractLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        try { return Long.parseLong(String.valueOf(value)); } catch (Exception ignored) { return null; }
    }

    private Integer extractInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.intValue();
        try { return Integer.parseInt(String.valueOf(value)); } catch (Exception ignored) { return null; }
    }
}
