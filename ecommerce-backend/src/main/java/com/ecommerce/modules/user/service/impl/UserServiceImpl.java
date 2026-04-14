package com.ecommerce.modules.user.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserAddress;
import com.ecommerce.modules.phoneprefix.service.PhonePrefixService;
import com.ecommerce.modules.role.entity.RoleName;
import com.ecommerce.modules.upload.service.CloudinaryService;
import com.ecommerce.modules.user.dto.request.AdminUserUpdateRequest;
import com.ecommerce.modules.user.dto.request.UserAddressRequest;
import com.ecommerce.modules.user.dto.request.UserUpdateRequest;
import com.ecommerce.modules.user.dto.response.UserAddressResponse;
import com.ecommerce.modules.user.dto.response.UserResponse;
import com.ecommerce.modules.user.repository.UserAddressRepository;
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
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
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
        String normalizedName = inputValidator.normalizeFullName(request.getFullName());
        inputValidator.validateFullName(normalizedName);
        String normalizedEmail = inputValidator.normalizeEmail(request.getEmail());
        inputValidator.validateEmail(normalizedEmail);
        if (normalizedEmail != null && userRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, user.getId())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        user.setFullName(normalizedName);
        user.setEmail(normalizedEmail);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateAvatar(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.AVATAR_REQUIRED);
        }
        User user = getCurrentAuthenticatedUser();
        if (user.getAvatar() != null && !user.getAvatar().isBlank() && user.getAvatar().startsWith("http")) {
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
        String normalizedName = inputValidator.normalizeFullName(request.getFullName());
        inputValidator.validateFullName(normalizedName);
        String normalizedEmail = inputValidator.normalizeEmail(request.getEmail());
        inputValidator.validateEmail(normalizedEmail);
        if (normalizedEmail != null && userRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, user.getId())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        user.setFullName(normalizedName);
        user.setEmail(normalizedEmail);
        if (request.getRole() != null && !request.getRole().isBlank()) {
            user.setRole(RoleName.valueOf(request.getRole().trim().toUpperCase()));
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
        if (user.getAvatar() != null && !user.getAvatar().isBlank() && user.getAvatar().startsWith("http")) {
            try { cloudinaryService.deleteFile(user.getAvatar()); } catch (IOException ignored) {}
        }
        userRepository.delete(user);
    }

    @Override
    public List<UserAddressResponse> getCurrentUserAddresses() {
        return userAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(getCurrentAuthenticatedUser().getId())
                .stream().map(userMapper::toAddressResponse).toList();
    }

    @Override
    @Transactional
    public UserAddressResponse createCurrentUserAddress(UserAddressRequest request) {
        User user = getCurrentAuthenticatedUser();
        UserAddress address = UserAddress.builder().user(user).build();
        applyAddress(address, request, user.getId(), true);
        return userMapper.toAddressResponse(userAddressRepository.save(address));
    }

    @Override
    @Transactional
    public UserAddressResponse updateCurrentUserAddress(Long addressId, UserAddressRequest request) {
        User user = getCurrentAuthenticatedUser();
        UserAddress address = userAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));
        applyAddress(address, request, user.getId(), false);
        return userMapper.toAddressResponse(userAddressRepository.save(address));
    }

    @Override
    @Transactional
    public void deleteCurrentUserAddress(Long addressId) {
        User user = getCurrentAuthenticatedUser();
        UserAddress address = userAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));
        userAddressRepository.delete(address);
        List<UserAddress> remaining = userAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId());
        if (!remaining.isEmpty() && remaining.stream().noneMatch(UserAddress::getIsDefault)) {
            remaining.get(0).setIsDefault(true);
            userAddressRepository.save(remaining.get(0));
        }
    }

    @Override
    @Transactional
    public UserAddressResponse setDefaultAddress(Long addressId) {
        User user = getCurrentAuthenticatedUser();
        UserAddress target = userAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));
        userAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId()).forEach(address -> address.setIsDefault(address.getId().equals(addressId)));
        userAddressRepository.saveAll(userAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId()));
        return userMapper.toAddressResponse(target);
    }

    private void applyAddress(UserAddress address, UserAddressRequest request, Long userId, boolean creating) {
        String recipientName = inputValidator.normalizeFullName(request.getRecipientName());
        inputValidator.validateFullName(recipientName);
        String phone = inputValidator.normalizePhone(request.getPhone());
        inputValidator.validatePhone(phone);
        phonePrefixService.validateAllowedPrefix(phone);
        if (userAddressRepository.existsByPhoneAndUserIdNot(phone, userId)) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS);
        }
        String addressLine = request.getAddressLine() == null ? null : request.getAddressLine().trim();
        if (addressLine == null || addressLine.isBlank()) {
            throw new AppException(ErrorCode.ADDRESS_REQUIRED);
        }
        address.setRecipientName(recipientName);
        address.setPhone(phone);
        address.setAddressLine(addressLine);
        if (Boolean.TRUE.equals(request.getIsDefault()) || (creating && userAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId).isEmpty())) {
            userAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId).forEach(item -> item.setIsDefault(false));
            address.setIsDefault(true);
        } else if (address.getIsDefault() == null) {
            address.setIsDefault(false);
        }
    }

    private User getCurrentAuthenticatedUser() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmailIgnoreCase(principal)
                .or(() -> userAddressRepository.findAll().stream().filter(item -> item.getPhone().equals(principal)).findFirst().map(UserAddress::getUser))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private User findUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
