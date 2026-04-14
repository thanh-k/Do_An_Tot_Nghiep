package com.ecommerce.modules.auth.dto.response;

import com.ecommerce.modules.user.dto.response.UserResponse;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private UserResponse user;
}
