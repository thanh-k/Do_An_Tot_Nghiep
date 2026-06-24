package com.ecommerce.modules.livestream.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveChatMessageResponse {
    private String id;
    private Long livestreamId;
    private String senderName;
    private String senderRole;
    private String message;
    private Boolean pinned;
    private LocalDateTime pinnedAt;
    private LocalDateTime pinExpiresAt;
    private LocalDateTime createdAt;
}
