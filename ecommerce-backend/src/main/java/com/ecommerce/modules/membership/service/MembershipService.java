package com.ecommerce.modules.membership.service;

import com.ecommerce.modules.membership.dto.request.MembershipPlanUpsertRequest;
import com.ecommerce.modules.membership.dto.request.MembershipPurchaseRequest;
import com.ecommerce.modules.membership.dto.response.MembershipCurrentResponse;
import com.ecommerce.modules.membership.dto.response.MembershipPlanResponse;
import com.ecommerce.modules.membership.dto.response.MembershipPurchaseResponse;

import java.util.List;

public interface MembershipService {
    List<MembershipPlanResponse> getActivePlans();
    List<MembershipPlanResponse> getAllPlans();
    MembershipCurrentResponse getCurrentMembership();
    MembershipPurchaseResponse purchaseMembership(MembershipPurchaseRequest request);
    MembershipPlanResponse createPlan(MembershipPlanUpsertRequest request);
    MembershipPlanResponse updatePlan(Long id, MembershipPlanUpsertRequest request);
    void deletePlan(Long id);
}
