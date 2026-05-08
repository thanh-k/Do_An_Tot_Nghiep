package com.ecommerce.modules.membership.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MembershipPlanResponse {
    private Long id;
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
