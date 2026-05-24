package com.ecommerce.modules.accountcancellation.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.accountcancellation.dto.AccountCancellationCreateRequest;
import com.ecommerce.modules.accountcancellation.dto.AccountCancellationProcessRequest;
import com.ecommerce.modules.accountcancellation.dto.AccountCancellationResponse;
import com.ecommerce.modules.accountcancellation.service.AccountCancellationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AccountCancellationController {

    private final AccountCancellationService accountCancellationService;

    @PostMapping("/users/me/cancellation-request")
    public ApiResponse<AccountCancellationResponse> createMyRequest(@RequestBody AccountCancellationCreateRequest request) {
        return ApiResponse.<AccountCancellationResponse>builder()
                .message("Đã gửi yêu cầu hủy tài khoản. Quản trị viên sẽ xử lý yêu cầu của bạn.")
                .result(accountCancellationService.createMyRequest(request))
                .build();
    }

    @PreAuthorize("hasAnyAuthority('USER_DELETE','USER_VIEW')")
    @GetMapping("/admin/account-cancellation-requests")
    public ApiResponse<List<AccountCancellationResponse>> getAllRequests() {
        return ApiResponse.<List<AccountCancellationResponse>>builder()
                .result(accountCancellationService.getAllRequests())
                .build();
    }

    @PreAuthorize("hasAuthority('USER_DELETE')")
    @PatchMapping("/admin/account-cancellation-requests/{id}/approve")
    public ApiResponse<AccountCancellationResponse> approve(@PathVariable Long id, @RequestBody(required = false) AccountCancellationProcessRequest request) {
        return ApiResponse.<AccountCancellationResponse>builder()
                .message("Đã duyệt yêu cầu và ngưng hoạt động tài khoản")
                .result(accountCancellationService.approveRequest(id, request == null ? new AccountCancellationProcessRequest() : request))
                .build();
    }

    @PreAuthorize("hasAuthority('USER_DELETE')")
    @PatchMapping("/admin/account-cancellation-requests/{id}/reject")
    public ApiResponse<AccountCancellationResponse> reject(@PathVariable Long id, @RequestBody(required = false) AccountCancellationProcessRequest request) {
        return ApiResponse.<AccountCancellationResponse>builder()
                .message("Đã từ chối yêu cầu hủy tài khoản")
                .result(accountCancellationService.rejectRequest(id, request == null ? new AccountCancellationProcessRequest() : request))
                .build();
    }
}
