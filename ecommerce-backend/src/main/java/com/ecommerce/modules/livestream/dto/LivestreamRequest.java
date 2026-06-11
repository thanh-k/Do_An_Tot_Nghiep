package com.ecommerce.modules.livestream.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LivestreamRequest {
    private String title;
    private String description;
    private String thumbnailUrl;
    private LocalDateTime scheduledAt;
}
