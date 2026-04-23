package com.ecommerce.modules.auth.service;

import com.ecommerce.modules.auth.dto.request.ChangePasswordRequest;
import com.ecommerce.modules.auth.dto.request.CompleteGoogleRegistrationRequest;
import com.ecommerce.modules.auth.dto.request.LoginRequest;
import com.ecommerce.modules.auth.dto.request.SendOtpRequest;
import com.ecommerce.modules.auth.dto.request.RegisterRequest;
import com.ecommerce.modules.auth.dto.request.ResetPasswordRequest;
import com.ecommerce.modules.auth.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    void changePassword(ChangePasswordRequest request);
    AuthResponse completeGoogleRegistration(CompleteGoogleRegistrationRequest request);
    void sendRegistrationOtp(SendOtpRequest request);
    void sendForgotPasswordOtp(SendOtpRequest request);
    void resetPassword(ResetPasswordRequest request);
}
