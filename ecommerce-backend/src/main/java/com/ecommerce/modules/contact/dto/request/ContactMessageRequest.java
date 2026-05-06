package com.ecommerce.modules.contact.dto.request;

import lombok.Data;

@Data
public class ContactMessageRequest {
    private String fullName;
    private String phone;
    private String email;
    private String message;
}
