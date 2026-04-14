package com.ecommerce.modules.user.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.user.dto.request.AdminUserUpdateRequest;
import com.ecommerce.modules.user.dto.request.UserUpdateRequest;
import com.ecommerce.modules.user.dto.response.UserResponse;
import com.ecommerce.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/users/me")
    public ApiResponse<UserResponse> getCurrentUser() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getCurrentUser())
                .build();
    }

    @PutMapping("/users/me")
    public ApiResponse<UserResponse> updateCurrentUser(@RequestBody UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("Cập nhật hồ sơ thành công")
                .result(userService.updateCurrentUser(request))
                .build();
    }

    @PutMapping("/users/me/avatar")
    public ApiResponse<UserResponse> updateAvatar(@RequestParam("file") MultipartFile file) throws IOException {
        return ApiResponse.<UserResponse>builder()
                .message("Cập nhật ảnh đại diện thành công")
                .result(userService.updateAvatar(file))
                .build();
    }

    @GetMapping("/admin/users")
    public ApiResponse<List<UserResponse>> getAllUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getAllUsers())
                .build();
    }

    @GetMapping("/admin/users/{id}")
    public ApiResponse<UserResponse> getUserById(@PathVariable Long id) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUserById(id))
                .build();
    }

    @PutMapping("/admin/users/{id}")
    public ApiResponse<UserResponse> adminUpdateUser(@PathVariable Long id, @RequestBody AdminUserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("Cập nhật người dùng thành công")
                .result(userService.adminUpdateUser(id, request))
                .build();
    }

    @DeleteMapping("/admin/users/{id}")
    public ApiResponse<String> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResponse.<String>builder()
                .message("Xóa người dùng thành công")
                .result("OK")
                .build();
    }
}
