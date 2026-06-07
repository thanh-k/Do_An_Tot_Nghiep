package com.ecommerce.modules.behavior.dto.admin;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminBehaviorProductReportResponse {
    private List<AdminBehaviorProductReportItem> topViewed;
    private List<AdminBehaviorProductReportItem> topSearched;
    private List<AdminBehaviorProductReportItem> topAddedToCart;
    private List<AdminBehaviorProductReportItem> topAbandonedCheckout;
    private List<AdminBehaviorProductReportItem> topPurchased;
    private List<AdminBehaviorProductReportItem> topInterest;
}
