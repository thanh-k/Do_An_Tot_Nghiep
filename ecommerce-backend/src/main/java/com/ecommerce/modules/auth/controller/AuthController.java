package com.ecommerce.modules.auth.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.auth.dto.request.ChangePasswordRequest;
import com.ecommerce.modules.auth.dto.request.CompleteGoogleRegistrationRequest;
import com.ecommerce.modules.auth.dto.request.LoginRequest;
import com.ecommerce.modules.auth.dto.request.RegisterRequest;
import com.ecommerce.modules.auth.dto.request.ResetPasswordRequest;
import com.ecommerce.modules.auth.dto.request.SendOtpRequest;
import com.ecommerce.modules.auth.dto.response.AuthResponse;
import com.ecommerce.modules.auth.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/send-otp")
    public ApiResponse<String> sendRegistrationOtp(@RequestBody SendOtpRequest request) {
        authService.sendRegistrationOtp(request);
        return ApiResponse.<String>builder().message("Đã gửi mã xác thực đến email").result("OK").build();
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ApiResponse.<AuthResponse>builder().message("Đăng ký thành công").result(authService.register(request)).build();
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@RequestBody LoginRequest request) {
        return ApiResponse.<AuthResponse>builder().message("Đăng nhập thành công").result(authService.login(request)).build();
    }

    @PostMapping("/change-password")
    public ApiResponse<String> changePassword(@RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ApiResponse.<String>builder().message("Đổi mật khẩu thành công").result("OK").build();
    }

    @PostMapping("/forgot-password/send-otp")
    public ApiResponse<String> sendForgotPasswordOtp(@RequestBody SendOtpRequest request) {
        authService.sendForgotPasswordOtp(request);
        return ApiResponse.<String>builder().message("Đã gửi mã đặt lại mật khẩu đến email").result("OK").build();
    }

    @PostMapping("/forgot-password/reset")
    public ApiResponse<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.<String>builder().message("Đặt lại mật khẩu thành công").result("OK").build();
    }

    @GetMapping("/oauth2/authorize/google")
    public ResponseEntity<Void> authorizeGoogle(@RequestParam(defaultValue = "login") String mode, HttpServletResponse response) {
        Cookie cookie = new Cookie("oauth2_mode", mode);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(300);
        response.addCookie(cookie);
        return ResponseEntity.status(302).header(HttpHeaders.LOCATION, "/oauth2/authorization/google").build();
    }

    @PostMapping("/google/complete-registration")
    public ApiResponse<AuthResponse> completeGoogleRegistration(@RequestBody CompleteGoogleRegistrationRequest request) {
        return ApiResponse.<AuthResponse>builder().message("Đăng ký Google thành công").result(authService.completeGoogleRegistration(request)).build();
    }
}
