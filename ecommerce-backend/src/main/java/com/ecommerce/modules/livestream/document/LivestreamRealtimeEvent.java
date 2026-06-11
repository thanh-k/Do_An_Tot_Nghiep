package com.ecommerce.modules.livestream.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "livestream_realtime_events")
public class LivestreamRealtimeEvent {
    @Id
    private String id;

    @Indexed
    private Long livestreamId;

    @Indexed
    private String eventType;

    private String actorSessionId;
    private Long productId;
    private Integer viewerCount;
    private Map<String, Object> payload;

    @Indexed
    private LocalDateTime createdAt;
}
