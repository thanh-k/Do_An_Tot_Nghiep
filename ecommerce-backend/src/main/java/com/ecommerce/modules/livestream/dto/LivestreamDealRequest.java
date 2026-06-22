package com.ecommerce.modules.livestream.dto;

import lombok.Data;

@Data
public class LivestreamDealRequest {
    private Long productId;
    private Double dealPrice;
    private Double discountPercent;
    private Double discountAmount;
    private Integer durationMinutes;
    private Integer quantityLimit;
}
