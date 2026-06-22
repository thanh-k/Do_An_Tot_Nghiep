package com.ecommerce.modules.dashboard.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.dashboard.dto.AdminDashboardResponse;
import com.ecommerce.modules.dashboard.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {
    private final AdminDashboardService adminDashboardService;

    @PreAuthorize("hasAuthority('DASHBOARD_VIEW') or hasAuthority('ORDER_VIEW') or hasAuthority('PRODUCT_VIEW')")
    @GetMapping
    public ApiResponse<AdminDashboardResponse> getDashboard() {
        return ApiResponse.<AdminDashboardResponse>builder()
                .result(adminDashboardService.getDashboard())
                .build();
    }
}
