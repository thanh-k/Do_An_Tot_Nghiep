package com.ecommerce.modules.role.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class RoleRequest {
    private String code;
    private String name;
    private String description;
    private List<Long> permissionIds;
}
