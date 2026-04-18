package com.ecommerce.modules.role.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.AccessPermission;
import com.ecommerce.entity.AccessRole;
import com.ecommerce.entity.User;
import com.ecommerce.modules.role.dto.request.AssignRolesRequest;
import com.ecommerce.modules.role.dto.request.RoleRequest;
import com.ecommerce.modules.role.dto.response.PermissionResponse;
import com.ecommerce.modules.role.dto.response.RoleResponse;
import com.ecommerce.modules.role.repository.AccessPermissionRepository;
import com.ecommerce.modules.role.repository.AccessRoleRepository;
import com.ecommerce.modules.role.service.AccessControlService;
import com.ecommerce.modules.user.dto.response.UserResponse;
import com.ecommerce.modules.user.repository.UserRepository;
import com.ecommerce.modules.user.service.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AccessControlServiceImpl implements AccessControlService {
    private final AccessRoleRepository accessRoleRepository;
    private final AccessPermissionRepository accessPermissionRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    public List<RoleResponse> getRoles() {
        return accessRoleRepository.findAll().stream().sorted(Comparator.comparing(AccessRole::getCode)).map(this::toRoleResponse).toList();
    }

    @Override
    public List<PermissionResponse> getPermissions() {
        return accessPermissionRepository.findAll().stream().sorted(Comparator.comparing(AccessPermission::getModule).thenComparing(AccessPermission::getCode)).map(this::toPermissionResponse).toList();
    }

    @Override
    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        String code = normalizeCode(request.getCode());
        if (accessRoleRepository.existsByCodeIgnoreCase(code)) throw new AppException(ErrorCode.ROLE_ALREADY_EXISTS);
        AccessRole role = AccessRole.builder().code(code).name(request.getName()).description(request.getDescription()).systemRole(false).build();
        role.setPermissions(resolvePermissions(request.getPermissionIds()));
        return toRoleResponse(accessRoleRepository.save(role));
    }

    @Override
    @Transactional
    public RoleResponse updateRole(Long roleId, RoleRequest request) {
        AccessRole role = accessRoleRepository.findById(roleId).orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        if (Boolean.TRUE.equals(role.getSystemRole())) throw new AppException(ErrorCode.SYSTEM_ROLE_LOCKED);
        String code = normalizeCode(request.getCode());
        accessRoleRepository.findByCodeIgnoreCase(code).ifPresent(existing -> { if (!existing.getId().equals(roleId)) throw new AppException(ErrorCode.ROLE_ALREADY_EXISTS); });
        role.setCode(code);
        role.setName(request.getName());
        role.setDescription(request.getDescription());
        role.setPermissions(resolvePermissions(request.getPermissionIds()));
        return toRoleResponse(accessRoleRepository.save(role));
    }

    @Override
    @Transactional
    public UserResponse assignRoles(Long userId, AssignRolesRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Set<AccessRole> roles = new LinkedHashSet<>(accessRoleRepository.findAllById(request.getRoleIds() == null ? List.of() : request.getRoleIds()));
        if (roles.isEmpty()) throw new AppException(ErrorCode.ROLE_REQUIRED);
        user.setAccessRoles(roles);
        return userMapper.toResponse(userRepository.save(user));
    }

    private Set<AccessPermission> resolvePermissions(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return new LinkedHashSet<>();
        return new LinkedHashSet<>(accessPermissionRepository.findAllById(ids));
    }

    private String normalizeCode(String code) {
        if (code == null || code.isBlank()) throw new AppException(ErrorCode.ROLE_CODE_REQUIRED);
        return code.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
    }

    private RoleResponse toRoleResponse(AccessRole role) {
        return RoleResponse.builder()
                .id(role.getId())
                .code(role.getCode())
                .name(role.getName())
                .description(role.getDescription())
                .systemRole(role.getSystemRole())
                .permissions(role.getPermissions().stream().sorted(Comparator.comparing(AccessPermission::getModule).thenComparing(AccessPermission::getCode)).map(this::toPermissionResponse).toList())
                .build();
    }

    private PermissionResponse toPermissionResponse(AccessPermission permission) {
        return PermissionResponse.builder().id(permission.getId()).code(permission.getCode()).name(permission.getName()).module(permission.getModule()).description(permission.getDescription()).build();
    }
}
