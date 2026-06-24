package com.ecommerce.modules.livestream.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "livestream_chat_messages")
public class LivestreamChatMessage {
    @Id
    private String id;

    @Indexed
    private Long livestreamId;

    private String senderName;
    private String senderRole;
    private String message;

    @Builder.Default
    private Boolean pinned = false;

    private LocalDateTime pinnedAt;
    private LocalDateTime pinExpiresAt;

    @Indexed
    private LocalDateTime createdAt;
}
