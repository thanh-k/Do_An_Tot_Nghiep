package com.ecommerce.modules.membership.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MembershipPurchaseResponse {
    private String message;
    private MembershipCurrentResponse subscription;
    private Long subscriptionId;
    private Long amount;
    private String paymentMethod;
    private String paymentStatus;
    private String paymentCode;
    private LocalDateTime expiredAt;
}
