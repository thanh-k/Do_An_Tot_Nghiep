package com.ecommerce.modules.user.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.user.dto.request.AdminUserUpdateRequest;
import com.ecommerce.modules.user.dto.request.UserAddressRequest;
import com.ecommerce.modules.user.dto.request.UserUpdateRequest;
import com.ecommerce.modules.user.dto.response.UserAddressResponse;
import com.ecommerce.modules.user.dto.response.UserResponse;
import com.ecommerce.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
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
        return ApiResponse.<UserResponse>builder().result(userService.getCurrentUser()).build();
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

    @GetMapping("/users/me/addresses")
    public ApiResponse<List<UserAddressResponse>> getMyAddresses() {
        return ApiResponse.<List<UserAddressResponse>>builder()
                .result(userService.getCurrentUserAddresses())
                .build();
    }

    @PostMapping("/users/me/addresses")
    public ApiResponse<UserAddressResponse> createAddress(@RequestBody UserAddressRequest request) {
        return ApiResponse.<UserAddressResponse>builder()
                .message("Thêm địa chỉ thành công")
                .result(userService.createCurrentUserAddress(request))
                .build();
    }

    @PutMapping("/users/me/addresses/{id}")
    public ApiResponse<UserAddressResponse> updateAddress(@PathVariable Long id, @RequestBody UserAddressRequest request) {
        return ApiResponse.<UserAddressResponse>builder()
                .message("Cập nhật địa chỉ thành công")
                .result(userService.updateCurrentUserAddress(id, request))
                .build();
    }

    @DeleteMapping("/users/me/addresses/{id}")
    public ApiResponse<String> deleteAddress(@PathVariable Long id) {
        userService.deleteCurrentUserAddress(id);
        return ApiResponse.<String>builder()
                .message("Xóa địa chỉ thành công")
                .result("OK")
                .build();
    }

    @PatchMapping("/users/me/addresses/{id}/default")
    public ApiResponse<UserAddressResponse> setDefaultAddress(@PathVariable Long id) {
        return ApiResponse.<UserAddressResponse>builder()
                .message("Đã chọn địa chỉ mặc định")
                .result(userService.setDefaultAddress(id))
                .build();
    }

    @PreAuthorize("hasAuthority('USER_VIEW')")
    @GetMapping("/admin/users")
    public ApiResponse<List<UserResponse>> getAllUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getAllUsers())
                .build();
    }

    @PreAuthorize("hasAnyAuthority('CUSTOMER_VIEW','USER_VIEW')")
    @GetMapping("/admin/customers")
    public ApiResponse<List<UserResponse>> getCustomers() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getCustomers())
                .build();
    }

    @PreAuthorize("hasAnyAuthority('STAFF_VIEW','USER_VIEW')")
    @GetMapping("/admin/staff")
    public ApiResponse<List<UserResponse>> getStaff() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getStaff())
                .build();
    }

    @PreAuthorize("hasAuthority('USER_VIEW')")
    @GetMapping("/admin/users/{id}")
    public ApiResponse<UserResponse> getUserById(@PathVariable Long id) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUserById(id))
                .build();
    }

    @PreAuthorize("hasAuthority('USER_UPDATE')")
    @PutMapping("/admin/users/{id}")
    public ApiResponse<UserResponse> adminUpdateUser(@PathVariable Long id, @RequestBody AdminUserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("Cập nhật người dùng thành công")
                .result(userService.adminUpdateUser(id, request))
                .build();
    }

    @PreAuthorize("hasAuthority('USER_LOCK')")
    @PutMapping("/admin/users/{id}/toggle-status")
    public ApiResponse<UserResponse> toggleUserStatus(@PathVariable Long id) {
        return ApiResponse.<UserResponse>builder()
                .message("Cập nhật trạng thái người dùng thành công")
                .result(userService.toggleStatus(id))
                .build();
    }

    @PreAuthorize("hasAuthority('USER_DELETE')")
    @DeleteMapping("/admin/users/{id}")
    public ApiResponse<String> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResponse.<String>builder()
                .message("Xóa người dùng thành công")
                .result("OK")
                .build();
    }
}