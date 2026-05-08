package com.ecommerce.modules.membership.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MembershipCurrentResponse {
    private String membershipCode;
    private String membershipName;
    private boolean vip;
    private boolean active;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private MembershipPlanResponse currentPlan;
    private String paymentMethod;
    private String paymentStatus;
    private String status;
}
