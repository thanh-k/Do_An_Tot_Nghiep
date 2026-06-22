package com.ecommerce.modules.productvideo.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVideoResponse {
    private Long id;
    private String title;
    private String description;
    private String videoUrl;
    private String thumbnailUrl;
    private Boolean active;

    private Long productId;
    private String productName;
    private String productSlug;
    private String productThumbnail;
    private Double productPrice;
    private String brandName;
    private String categoryName;

    private Long viewCount;
    private Long productClickCount;
    private Long addToCartCount;
    private Long orderCount;
    private Long totalWatchSeconds;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
