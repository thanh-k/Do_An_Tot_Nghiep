package com.ecommerce.modules.auth.dto.request;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String phone;
    private String email;
    private String password;
}
