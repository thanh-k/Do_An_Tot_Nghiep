package com.ecommerce.modules.user.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String fullName;
    private String primaryPhone;
    private String primaryAddress;
    private String email;
    private String avatar;
    private String role;
    private Boolean active;
    private String authProvider;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<UserAddressResponse> addresses;
}
