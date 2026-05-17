package com.ecommerce.modules.announcement.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AnnouncementBarResponse {
    private Long id;
    private String message;
    private Boolean active;
    private String backgroundColor;
    private String textColor;
    private Integer speedSeconds;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
