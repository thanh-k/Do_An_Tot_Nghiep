package com.ecommerce.modules.membership.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.membership.dto.request.MembershipPlanUpsertRequest;
import com.ecommerce.modules.membership.dto.request.MembershipPurchaseRequest;
import com.ecommerce.modules.membership.dto.response.MembershipCurrentResponse;
import com.ecommerce.modules.membership.dto.response.MembershipPlanResponse;
import com.ecommerce.modules.membership.dto.response.MembershipPurchaseResponse;
import com.ecommerce.modules.membership.service.MembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    @GetMapping("/plans")
    public ApiResponse<List<MembershipPlanResponse>> getPlans() {
        return ApiResponse.<List<MembershipPlanResponse>>builder()
                .result(membershipService.getActivePlans())
                .build();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/my")
    public ApiResponse<MembershipCurrentResponse> getMyMembership() {
        return ApiResponse.<MembershipCurrentResponse>builder()
                .result(membershipService.getCurrentMembership())
                .build();
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/purchase")
    public ApiResponse<MembershipPurchaseResponse> purchase(@RequestBody MembershipPurchaseRequest request) {
        MembershipPurchaseResponse response = membershipService.purchaseMembership(request);
        return ApiResponse.<MembershipPurchaseResponse>builder()
                .message(response.getMessage())
                .result(response)
                .build();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/purchase/{subscriptionId}/status")
    public ApiResponse<MembershipPurchaseResponse> getPurchaseStatus(@PathVariable Long subscriptionId) {
        MembershipPurchaseResponse response = membershipService.getPurchaseStatus(subscriptionId);
        return ApiResponse.<MembershipPurchaseResponse>builder()
                .message(response.getMessage())
                .result(response)
                .build();
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/purchase/{subscriptionId}/cancel")
    public ApiResponse<Void> cancelPendingPayment(@PathVariable Long subscriptionId) {
        membershipService.cancelPendingPayment(subscriptionId);
        return ApiResponse.<Void>builder()
                .message("Đã hủy thanh toán gói thành viên")
                .build();
    }

    @PreAuthorize("hasAuthority('MEMBERSHIP_MANAGE') or hasAuthority('MEMBERSHIP_VIEW')")
    @GetMapping("/admin/plans")
    public ApiResponse<List<MembershipPlanResponse>> getAdminPlans() {
        return ApiResponse.<List<MembershipPlanResponse>>builder()
                .result(membershipService.getAllPlans())
                .build();
    }

    @PreAuthorize("hasAuthority('MEMBERSHIP_MANAGE')")
    @PostMapping("/admin/plans")
    public ApiResponse<MembershipPlanResponse> createPlan(@RequestBody MembershipPlanUpsertRequest request) {
        return ApiResponse.<MembershipPlanResponse>builder()
                .message("Tạo gói thành viên thành công")
                .result(membershipService.createPlan(request))
                .build();
    }

    @PreAuthorize("hasAuthority('MEMBERSHIP_MANAGE')")
    @PutMapping("/admin/plans/{id}")
    public ApiResponse<MembershipPlanResponse> updatePlan(@PathVariable Long id, @RequestBody MembershipPlanUpsertRequest request) {
        return ApiResponse.<MembershipPlanResponse>builder()
                .message("Cập nhật gói thành viên thành công")
                .result(membershipService.updatePlan(id, request))
                .build();
    }

    @PreAuthorize("hasAuthority('MEMBERSHIP_MANAGE')")
    @DeleteMapping("/admin/plans/{id}")
    public ApiResponse<Void> deletePlan(@PathVariable Long id) {
        membershipService.deletePlan(id);
        return ApiResponse.<Void>builder()
                .message("Đã xóa gói thành viên")
                .build();
    }
}
