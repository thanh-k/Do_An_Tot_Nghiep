package com.ecommerce.modules.auth.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.auth.dto.request.ChangePasswordRequest;
import com.ecommerce.modules.auth.dto.request.LoginRequest;
import com.ecommerce.modules.auth.dto.request.RegisterRequest;
import com.ecommerce.modules.auth.dto.response.AuthResponse;
import com.ecommerce.modules.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ApiResponse.<AuthResponse>builder()
                .message("Đăng ký tài khoản thành công")
                .result(authService.register(request))
                .build();
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@RequestBody LoginRequest request) {
        return ApiResponse.<AuthResponse>builder()
                .message("Đăng nhập thành công")
                .result(authService.login(request))
                .build();
    }

    @PostMapping("/change-password")
    public ApiResponse<String> changePassword(@RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ApiResponse.<String>builder()
                .message("Đổi mật khẩu thành công")
                .result("OK")
                .build();
    }
}
