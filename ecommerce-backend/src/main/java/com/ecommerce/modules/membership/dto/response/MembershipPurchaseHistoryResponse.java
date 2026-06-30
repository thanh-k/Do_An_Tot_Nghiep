package com.ecommerce.modules.membership.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MembershipPurchaseHistoryResponse {
    private Long id;
    private Long planId;
    private String planCode;
    private String planName;
    private Integer durationMonths;
    private Long price;
    private LocalDateTime purchasedAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private String status;
    private String paymentStatus;
    private String paymentMethod;
}
