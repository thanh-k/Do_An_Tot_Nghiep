package com.ecommerce.modules.user.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserAddressResponse {
    private Long id;
    private String recipientName;
    private String phone;
    private String addressLine;
    private Boolean isDefault;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
