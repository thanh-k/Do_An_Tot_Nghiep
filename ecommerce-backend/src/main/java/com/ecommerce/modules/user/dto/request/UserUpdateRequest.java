package com.ecommerce.modules.user.dto.request;

import lombok.Data;

@Data
public class UserUpdateRequest {
    private String fullName;
    private String phone;
    private String email;
    private String address;
}
