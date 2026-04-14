package com.ecommerce.modules.auth.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.User;
import com.ecommerce.modules.auth.dto.request.ChangePasswordRequest;
import com.ecommerce.modules.auth.dto.request.LoginRequest;
import com.ecommerce.modules.auth.dto.request.RegisterRequest;
import com.ecommerce.modules.auth.dto.response.AuthResponse;
import com.ecommerce.modules.auth.service.AuthService;
import com.ecommerce.modules.phoneprefix.service.PhonePrefixService;
import com.ecommerce.modules.role.entity.RoleName;
import com.ecommerce.modules.user.repository.UserRepository;
import com.ecommerce.modules.user.service.UserMapper;
import com.ecommerce.modules.validation.InputValidator;
import com.ecommerce.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final InputValidator inputValidator;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final PhonePrefixService phonePrefixService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedName = inputValidator.normalizeFullName(request.getFullName());
        inputValidator.validateFullName(normalizedName);

        String normalizedPhone = inputValidator.normalizePhone(request.getPhone());
        inputValidator.validatePhone(normalizedPhone);
        phonePrefixService.validateAllowedPrefix(normalizedPhone);

        String normalizedEmail = inputValidator.normalizeEmail(request.getEmail());
        inputValidator.validateEmail(normalizedEmail);

        if (request.getPassword() == null || request.getPassword().trim().length() < 6) {
            throw new AppException(ErrorCode.PASSWORD_INVALID);
        }

        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS);
        }
        if (normalizedEmail != null && userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = User.builder()
                .fullName(normalizedName)
                .phone(normalizedPhone)
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(RoleName.USER)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        String tokenSubject = savedUser.getEmail() != null ? savedUser.getEmail() : savedUser.getPhone();

        return AuthResponse.builder()
                .accessToken(jwtTokenProvider.generateToken(tokenSubject, savedUser.getRole().name()))
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
                : userRepository.findByPhone(identifier).orElseThrow(() -> new AppException(ErrorCode.LOGIN_FAILED));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new AppException(ErrorCode.USER_DISABLED);
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.LOGIN_FAILED);
        }

        String tokenSubject = user.getEmail() != null ? user.getEmail() : user.getPhone();
        return AuthResponse.builder()
                .accessToken(jwtTokenProvider.generateToken(tokenSubject, user.getRole().name()))
                .tokenType("Bearer")
                .user(userMapper.toResponse(user))
                .build();
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByPhone(principal)
                .or(() -> userRepository.findByEmailIgnoreCase(principal))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (request.getCurrentPassword() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.CURRENT_PASSWORD_INCORRECT);
        }
        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 6) {
            throw new AppException(ErrorCode.PASSWORD_INVALID);
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
