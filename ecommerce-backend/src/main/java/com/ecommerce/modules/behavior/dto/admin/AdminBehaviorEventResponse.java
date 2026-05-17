package com.ecommerce.modules.behavior.dto.admin;

import com.ecommerce.modules.behavior.entity.BehaviorEventType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminBehaviorEventResponse {
    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String sessionId;
    private BehaviorEventType eventType;
    private Long productId;
    private String productName;
    private String productThumbnail;
    private Long categoryId;
    private String categoryName;
    private Long brandId;
    private String brandName;
    private String keyword;
    private String pageUrl;
    private String metadataJson;
    private LocalDateTime createdAt;
}
