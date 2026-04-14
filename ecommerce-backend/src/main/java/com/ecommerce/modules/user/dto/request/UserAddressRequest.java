package com.ecommerce.modules.user.dto.request;

import lombok.Data;

@Data
public class UserAddressRequest {
    private String recipientName;
    private String phone;
    private String addressLine;
    private Boolean isDefault;
}
