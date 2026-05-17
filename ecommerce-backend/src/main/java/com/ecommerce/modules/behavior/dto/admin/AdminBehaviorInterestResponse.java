package com.ecommerce.modules.behavior.dto.admin;

import com.ecommerce.modules.behavior.entity.BehaviorEventType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminBehaviorInterestResponse {
    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String sessionId;
    private Long productId;
    private String productName;
    private String productThumbnail;
    private String categoryName;
    private String brandName;
    private Double score;
    private Long viewCount;
    private Long cartCount;
    private Long wishlistCount;
    private Long checkoutCount;
    private Long purchaseCount;
    private BehaviorEventType lastEventType;
    private LocalDateTime lastInteractedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
