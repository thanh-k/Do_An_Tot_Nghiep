package com.ecommerce.modules.livestream.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveDealResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Double originalPrice;
    private Double dealPrice;
    private Double discountPercent;
    private Integer quantityLimit;
    private Integer quantitySold;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private Boolean active;
}
