package com.ecommerce.modules.role.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.role.dto.request.AssignRolesRequest;
import com.ecommerce.modules.role.dto.request.RoleRequest;
import com.ecommerce.modules.role.dto.response.PermissionResponse;
import com.ecommerce.modules.role.dto.response.RoleResponse;
import com.ecommerce.modules.role.service.AccessControlService;
import com.ecommerce.modules.user.dto.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AccessControlController {
    private final AccessControlService accessControlService;

    @GetMapping("/roles")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGE','ROLE_ASSIGN')")
    public ApiResponse<List<RoleResponse>> getRoles() {
        return ApiResponse.<List<RoleResponse>>builder().result(accessControlService.getRoles()).build();
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGE','ROLE_ASSIGN')")
    public ApiResponse<List<PermissionResponse>> getPermissions() {
        return ApiResponse.<List<PermissionResponse>>builder().result(accessControlService.getPermissions()).build();
    }

    @PostMapping("/roles")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public ApiResponse<RoleResponse> createRole(@RequestBody RoleRequest request) {
        return ApiResponse.<RoleResponse>builder().message("Tạo vai trò thành công").result(accessControlService.createRole(request)).build();
    }

    @PutMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public ApiResponse<RoleResponse> updateRole(@PathVariable Long id, @RequestBody RoleRequest request) {
        return ApiResponse.<RoleResponse>builder().message("Cập nhật vai trò thành công").result(accessControlService.updateRole(id, request)).build();
    }

    @PutMapping("/users/{id}/roles")
    @PreAuthorize("hasAuthority('ROLE_ASSIGN')")
    public ApiResponse<UserResponse> assignRoles(@PathVariable Long id, @RequestBody AssignRolesRequest request) {
        return ApiResponse.<UserResponse>builder().message("Cập nhật quyền thành công").result(accessControlService.assignRoles(id, request)).build();
    }
}
