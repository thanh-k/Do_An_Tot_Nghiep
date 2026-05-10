package com.ecommerce.modules.membership.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MembershipPurchaseRequest {
    private Long planId;
    private String note;
}
