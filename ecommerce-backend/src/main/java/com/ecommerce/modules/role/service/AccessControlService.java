package com.ecommerce.modules.role.service;

import com.ecommerce.modules.role.dto.request.AssignRolesRequest;
import com.ecommerce.modules.role.dto.request.RoleRequest;
import com.ecommerce.modules.role.dto.response.PermissionResponse;
import com.ecommerce.modules.role.dto.response.RoleResponse;
import com.ecommerce.modules.user.dto.response.UserResponse;

import java.util.List;

public interface AccessControlService {
    List<RoleResponse> getRoles();
    List<PermissionResponse> getPermissions();
    RoleResponse createRole(RoleRequest request);
    RoleResponse updateRole(Long roleId, RoleRequest request);
    UserResponse assignRoles(Long userId, AssignRolesRequest request);
}
