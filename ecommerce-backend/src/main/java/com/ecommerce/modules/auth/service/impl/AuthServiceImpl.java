package com.ecommerce.modules.auth.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserAddress;
import com.ecommerce.modules.auth.dto.request.ChangePasswordRequest;
import com.ecommerce.modules.auth.dto.request.CompleteGoogleRegistrationRequest;
import com.ecommerce.modules.auth.dto.request.LoginRequest;
import com.ecommerce.modules.auth.dto.request.RegisterRequest;
import com.ecommerce.modules.auth.dto.request.ResetPasswordRequest;
import com.ecommerce.modules.auth.dto.request.SendOtpRequest;
import com.ecommerce.modules.auth.dto.response.AuthResponse;
import com.ecommerce.modules.auth.service.AuthService;
import com.ecommerce.modules.auth.service.EmailOtpService;
import com.ecommerce.modules.role.entity.RoleName;
import com.ecommerce.modules.user.repository.UserAddressRepository;
import com.ecommerce.modules.user.repository.UserRepository;
import com.ecommerce.modules.user.service.UserMapper;
import com.ecommerce.modules.validation.InputValidator;
import com.ecommerce.security.jwt.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final InputValidator inputValidator;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final EmailOtpService emailOtpService;

    @Override
    public void sendRegistrationOtp(SendOtpRequest request) {
        emailOtpService.sendRegistrationOtp(request.getEmail());
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedName = inputValidator.normalizeFullName(request.getFullName());
        inputValidator.validateFullName(normalizedName);

        String normalizedEmail = inputValidator.normalizeEmail(request.getEmail());
        inputValidator.validateEmail(normalizedEmail);
        inputValidator.validatePassword(request.getPassword());
        emailOtpService.verifyRegistrationOtp(normalizedEmail, request.getOtpCode());

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = User.builder()
                .fullName(normalizedName)
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(RoleName.USER)
                .active(true)
                .authProvider("LOCAL")
                .build();

        User savedUser = userRepository.save(user);
        return AuthResponse.builder()
                .accessToken(jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole().name()))
                .tokenType("Bearer")
                .user(userMapper.toResponse(savedUser))
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        if (request.getIdentifier() == null || request.getPassword() == null) {
            throw new AppException(ErrorCode.LOGIN_FAILED);
        }
        String identifier = request.getIdentifier().trim();
        User user = identifier.contains("@")
                ? userRepository.findByEmailIgnoreCase(identifier.toLowerCase()).orElseThrow(() -> new AppException(ErrorCode.LOGIN_FAILED))
                : userAddressRepository.findAll().stream().filter(item -> item.getPhone().equals(identifier)).findFirst().map(UserAddress::getUser)
                        .orElseThrow(() -> new AppException(ErrorCode.LOGIN_FAILED));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new AppException(ErrorCode.USER_DISABLED);
        }
        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new AppException(ErrorCode.LOGIN_USE_GOOGLE);
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.LOGIN_FAILED);
        }

        String tokenSubject = user.getEmail() != null ? user.getEmail() : user.getAddresses().stream().findFirst().map(UserAddress::getPhone).orElseThrow();
        return AuthResponse.builder()
                .accessToken(jwtTokenProvider.generateToken(tokenSubject, user.getRole().name()))
                .tokenType("Bearer")
                .user(userMapper.toResponse(user))
                .build();
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = findCurrentUser();
        if (user.getPasswordHash() == null || request.getCurrentPassword() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.CURRENT_PASSWORD_INCORRECT);
        }
        inputValidator.validatePassword(request.getNewPassword());
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public void sendForgotPasswordOtp(SendOtpRequest request) {
        emailOtpService.sendForgotPasswordOtp(request.getEmail());
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = inputValidator.normalizeEmail(request.getEmail());
        inputValidator.validateEmail(normalizedEmail);
        inputValidator.validatePassword(request.getNewPassword());
        emailOtpService.verifyForgotPasswordOtp(normalizedEmail, request.getOtpCode());

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setAuthProvider("LOCAL");
        userRepository.save(user);
    }

    @Override
    @Transactional
    public AuthResponse completeGoogleRegistration(CompleteGoogleRegistrationRequest request) {
        if (request.getToken() == null || !jwtTokenProvider.isValidToken(request.getToken())) {
            throw new AppException(ErrorCode.GOOGLE_TEMP_TOKEN_INVALID);
        }
        Claims claims = jwtTokenProvider.getClaims(request.getToken());
        if (!"GOOGLE_REGISTER_TEMP".equals(claims.get("purpose", String.class))) {
            throw new AppException(ErrorCode.GOOGLE_TEMP_TOKEN_INVALID);
        }
        String email = claims.getSubject();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new AppException(ErrorCode.GOOGLE_EMAIL_ALREADY_EXISTS);
        }

        User user = User.builder()
                .fullName(inputValidator.normalizeFullName(claims.get("fullName", String.class)))
                .email(email)
                .avatar(claims.get("avatar", String.class))
                .passwordHash(null)
                .role(RoleName.USER)
                .active(true)
                .authProvider("GOOGLE")
                .build();
        User saved = userRepository.save(user);

        return AuthResponse.builder()
                .accessToken(jwtTokenProvider.generateToken(saved.getEmail(), saved.getRole().name()))
                .tokenType("Bearer")
                .user(userMapper.toResponse(saved))
                .build();
    }

    private User findCurrentUser() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmailIgnoreCase(principal)
                .or(() -> userAddressRepository.findAll().stream().filter(item -> item.getPhone().equals(principal)).findFirst().map(UserAddress::getUser))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
