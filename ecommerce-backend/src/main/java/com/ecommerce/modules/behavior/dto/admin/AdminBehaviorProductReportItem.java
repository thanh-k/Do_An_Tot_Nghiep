package com.ecommerce.modules.behavior.dto.admin;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminBehaviorProductReportItem {
    private Long productId;
    private String productName;
    private String productThumbnail;
    private String categoryName;
    private String brandName;
    private Long totalCount;
    private Double totalScore;
}
