package com.ecommerce.modules.auth.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.EmailOtp;
import com.ecommerce.modules.auth.repository.EmailOtpRepository;
import com.ecommerce.modules.auth.service.EmailOtpService;
import com.ecommerce.modules.mail.MailService;
import com.ecommerce.modules.user.repository.UserRepository;
import com.ecommerce.modules.validation.InputValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class EmailOtpServiceImpl implements EmailOtpService {

    private static final String PURPOSE_REGISTER = "REGISTER";
    private static final String PURPOSE_FORGOT_PASSWORD = "FORGOT_PASSWORD";

    private final EmailOtpRepository emailOtpRepository;
    private final UserRepository userRepository;
    private final MailService mailService;
    private final InputValidator inputValidator;

    @Value("${app.otp.expiration-seconds:90}")
    private int expirationSeconds;

    @Override
    @Transactional
    public void sendRegistrationOtp(String email) {
        String normalizedEmail = inputValidator.normalizeEmail(email);
        inputValidator.validateEmail(normalizedEmail);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        createAndSendOtp(normalizedEmail, PURPOSE_REGISTER, "Mã xác thực đăng ký tài khoản");
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyRegistrationOtp(String email, String code) {
        verifyOtp(inputValidator.normalizeEmail(email), code, PURPOSE_REGISTER);
    }

    @Override
    @Transactional
    public void sendForgotPasswordOtp(String email) {
        String normalizedEmail = inputValidator.normalizeEmail(email);
        inputValidator.validateEmail(normalizedEmail);
        if (!userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        createAndSendOtp(normalizedEmail, PURPOSE_FORGOT_PASSWORD, "Mã xác thực quên mật khẩu");
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyForgotPasswordOtp(String email, String code) {
        verifyOtp(inputValidator.normalizeEmail(email), code, PURPOSE_FORGOT_PASSWORD);
    }

    private void createAndSendOtp(String email, String purpose, String subject) {
        String code = String.format("%06d", new Random().nextInt(1_000_000));
        EmailOtp otp = EmailOtp.builder()
                .email(email)
                .code(code)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusSeconds(expirationSeconds))
                .used(false)
                .build();
        emailOtpRepository.save(otp);
        mailService.sendOtpEmail(email, subject, code, expirationSeconds);
    }

    private void verifyOtp(String email, String code, String purpose) {
        if (code == null || !code.matches("^\\d{6}$")) {
            throw new AppException(ErrorCode.OTP_INVALID);
        }
        EmailOtp otp = emailOtpRepository.findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> new AppException(ErrorCode.OTP_INVALID));
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }
        if (!otp.getCode().equals(code)) {
            throw new AppException(ErrorCode.OTP_INVALID);
        }
        otp.setUsed(true);
        emailOtpRepository.save(otp);
    }
}
