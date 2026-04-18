package com.ecommerce.modules.role.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RoleResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Boolean systemRole;
    private List<PermissionResponse> permissions;
}
