package com.ecommerce.modules.review.dto.response;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewSummaryResponse {
    private Double averageRating;
    private Long totalReviews;
    private Map<Integer, Long> ratingCounts;
    private Boolean hasPurchased;
    private Boolean hasReviewed;
    private Boolean canReview;
    private List<ProductReviewItemResponse> reviews;
}
