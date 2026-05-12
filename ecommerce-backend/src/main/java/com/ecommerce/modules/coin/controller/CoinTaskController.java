package com.ecommerce.modules.coin.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.coin.dto.request.CoinTaskUpsertRequest;
import com.ecommerce.modules.coin.dto.response.CoinClaimResponse;
import com.ecommerce.modules.coin.dto.response.CoinOverviewResponse;
import com.ecommerce.modules.coin.dto.response.CoinRedeemOptionResponse;
import com.ecommerce.modules.coin.dto.response.CoinTaskResponse;
import com.ecommerce.modules.coin.service.CoinTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CoinTaskController {

    private final CoinTaskService coinTaskService;

    @PreAuthorize("hasAuthority('COIN_TASK_VIEW')")
    @GetMapping("/coin-tasks/admin")
    public ApiResponse<List<CoinTaskResponse>> getAdminTasks() {
        return ApiResponse.<List<CoinTaskResponse>>builder()
                .result(coinTaskService.getAdminTasks())
                .build();
    }

    @PreAuthorize("hasAuthority('COIN_TASK_CREATE')")
    @PostMapping("/coin-tasks/admin")
    public ApiResponse<CoinTaskResponse> create(@RequestBody CoinTaskUpsertRequest request) {
        return ApiResponse.<CoinTaskResponse>builder()
                .result(coinTaskService.createTask(request))
                .build();
    }

    @PreAuthorize("hasAuthority('COIN_TASK_UPDATE')")
    @PutMapping("/coin-tasks/admin/{id}")
    public ApiResponse<CoinTaskResponse> update(@PathVariable Long id, @RequestBody CoinTaskUpsertRequest request) {
        return ApiResponse.<CoinTaskResponse>builder()
                .result(coinTaskService.updateTask(id, request))
                .build();
    }

    @PreAuthorize("hasAuthority('COIN_TASK_DELETE')")
    @DeleteMapping("/coin-tasks/admin/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        coinTaskService.deleteTask(id);
        return ApiResponse.<Void>builder().build();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/coins/overview")
    public ApiResponse<CoinOverviewResponse> getOverview() {
        return ApiResponse.<CoinOverviewResponse>builder()
                .result(coinTaskService.getUserOverview())
                .build();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/coins/tasks")
    public ApiResponse<List<CoinTaskResponse>> getUserTasks() {
        return ApiResponse.<List<CoinTaskResponse>>builder()
                .result(coinTaskService.getUserTasks())
                .build();
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/coins/tasks/{taskCode}/claim")
    public ApiResponse<CoinClaimResponse> claimTask(@PathVariable String taskCode) {
        return ApiResponse.<CoinClaimResponse>builder()
                .result(coinTaskService.claimTask(taskCode))
                .build();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/coins/redeems")
    public ApiResponse<List<CoinRedeemOptionResponse>> getRedeems() {
        return ApiResponse.<List<CoinRedeemOptionResponse>>builder()
                .result(coinTaskService.getRedeemOptions())
                .build();
    }
}
