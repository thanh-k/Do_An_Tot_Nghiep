package com.ecommerce.modules.behavior.dto.admin;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminBehaviorSummaryResponse {
    private Long totalEvents;
    private Long totalInterests;
    private Long totalProductViews;
    private Long totalSearches;
    private Long totalAddToCart;
    private Long totalWishlist;
    private Long totalCheckoutStarts;
    private Long totalAbandonedCheckouts;
    private Long totalPurchases;
    private Map<String, Long> eventCounts;
}
