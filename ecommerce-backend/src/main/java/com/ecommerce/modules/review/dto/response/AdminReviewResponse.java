package com.ecommerce.modules.review.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReviewResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productSlug;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userAvatar;
    private Long orderId;
    private Integer rating;
    private String comment;
    private List<String> images;
    private Boolean verifiedPurchase;
    private Boolean visible;
    private String shopReply;
    private String shopReplyBy;
    private LocalDateTime shopReplyAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
