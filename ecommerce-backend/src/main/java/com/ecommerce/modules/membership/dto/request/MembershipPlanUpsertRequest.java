package com.ecommerce.modules.membership.dto.request;

import lombok.Data;

@Data
public class MembershipPlanUpsertRequest {
    private String code;
    private String name;
    private String description;
    private Integer durationMonths;
    private Long price;
    private Long originalPrice;
    private Boolean highlight;
    private String badge;
    private Boolean active;
}
