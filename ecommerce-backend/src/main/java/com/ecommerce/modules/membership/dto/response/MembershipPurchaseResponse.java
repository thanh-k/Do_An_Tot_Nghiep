package com.ecommerce.modules.membership.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MembershipPurchaseResponse {
    private String message;
    private MembershipCurrentResponse subscription;
}
