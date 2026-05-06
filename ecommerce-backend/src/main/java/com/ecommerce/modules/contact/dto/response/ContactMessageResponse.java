package com.ecommerce.modules.contact.dto.response;

import com.ecommerce.modules.contact.entity.ContactMessageStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ContactMessageResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private String message;
    private ContactMessageStatus status;
    private String replyContent;
    private LocalDateTime repliedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
