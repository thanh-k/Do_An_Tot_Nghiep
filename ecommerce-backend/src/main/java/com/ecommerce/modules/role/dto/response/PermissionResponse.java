package com.ecommerce.modules.role.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PermissionResponse {
    private Long id;
    private String code;
    private String name;
    private String module;
    private String description;
}
