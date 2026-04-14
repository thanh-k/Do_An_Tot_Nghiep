package com.ecommerce.modules.user.service;

import com.ecommerce.modules.user.dto.request.AdminUserUpdateRequest;
import com.ecommerce.modules.user.dto.request.UserUpdateRequest;
import com.ecommerce.modules.user.dto.response.UserResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface UserService {
    UserResponse getCurrentUser();

    UserResponse updateCurrentUser(UserUpdateRequest request);

    UserResponse updateAvatar(MultipartFile file) throws IOException;

    List<UserResponse> getAllUsers();

    UserResponse getUserById(Long id);

    UserResponse adminUpdateUser(Long id, AdminUserUpdateRequest request);

    void deleteUser(Long id);
}
