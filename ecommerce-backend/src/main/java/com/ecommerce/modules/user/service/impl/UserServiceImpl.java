package com.ecommerce.modules.user.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.User;
import com.ecommerce.modules.phoneprefix.service.PhonePrefixService;
import com.ecommerce.modules.role.entity.RoleName;
import com.ecommerce.modules.upload.service.CloudinaryService;
import com.ecommerce.modules.user.dto.request.AdminUserUpdateRequest;
import com.ecommerce.modules.user.dto.request.UserUpdateRequest;
import com.ecommerce.modules.user.dto.response.UserResponse;
import com.ecommerce.modules.user.repository.UserRepository;
import com.ecommerce.modules.user.service.UserMapper;
import com.ecommerce.modules.user.service.UserService;
import com.ecommerce.modules.validation.InputValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final InputValidator inputValidator;
    private final CloudinaryService cloudinaryService;
    private final PhonePrefixService phonePrefixService;

    @Override
    public UserResponse getCurrentUser() {
        return userMapper.toResponse(getCurrentAuthenticatedUser());
    }

    @Override
    @Transactional
    public UserResponse updateCurrentUser(UserUpdateRequest request) {
        User user = getCurrentAuthenticatedUser();
        applyProfileUpdate(user, request.getFullName(), request.getPhone(), request.getEmail(), request.getAddress(), user.getId());
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateAvatar(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.AVATAR_REQUIRED);
        }
        User user = getCurrentAuthenticatedUser();
        if (user.getAvatar() != null && !user.getAvatar().isBlank()) {
            cloudinaryService.deleteFile(user.getAvatar());
        }
        user.setAvatar(cloudinaryService.uploadFile(file, "avatars"));
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(userMapper::toResponse).toList();
    }

    @Override
    public UserResponse getUserById(Long id) {
        return userMapper.toResponse(findUserById(id));
    }

    @Override
    @Transactional
    public UserResponse adminUpdateUser(Long id, AdminUserUpdateRequest request) {
        User user = findUserById(id);
        applyProfileUpdate(user, request.getFullName(), request.getPhone(), request.getEmail(), request.getAddress(), user.getId());

        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                user.setRole(RoleName.valueOf(request.getRole().trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new AppException(ErrorCode.ROLE_INVALID);
            }
        }
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = findUserById(id);
        if (user.getRole() == RoleName.ADMIN) {
            throw new AppException(ErrorCode.ADMIN_CANNOT_DELETE);
        }
        if (user.getAvatar() != null && !user.getAvatar().isBlank()) {
            try {
                cloudinaryService.deleteFile(user.getAvatar());
            } catch (IOException ignored) {
            }
        }
        userRepository.delete(user);
    }

    private void applyProfileUpdate(User user, String fullName, String phone, String email, String address, Long currentUserId) {
        String normalizedName = inputValidator.normalizeFullName(fullName);
        inputValidator.validateFullName(normalizedName);

        String normalizedPhone = inputValidator.normalizePhone(phone);
        inputValidator.validatePhone(normalizedPhone);

        String normalizedEmail = inputValidator.normalizeEmail(email);
        inputValidator.validateEmail(normalizedEmail);

        phonePrefixService.validateAllowedPrefix(normalizedPhone);

        if (userRepository.existsByPhoneAndIdNot(normalizedPhone, currentUserId)) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS);
        }
        if (normalizedEmail != null && userRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, currentUserId)) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        user.setFullName(normalizedName);
        user.setPhone(normalizedPhone);
        user.setEmail(normalizedEmail);
        user.setAddress(address == null ? null : address.trim());
    }

    private User getCurrentAuthenticatedUser() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByPhone(principal)
                .or(() -> userRepository.findByEmailIgnoreCase(principal))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private User findUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
