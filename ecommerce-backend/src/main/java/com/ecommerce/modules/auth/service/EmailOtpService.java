package com.ecommerce.modules.auth.service;

public interface EmailOtpService {
    void sendRegistrationOtp(String email);
    void verifyRegistrationOtp(String email, String code);
    void sendForgotPasswordOtp(String email);
    void verifyForgotPasswordOtp(String email, String code);
}
