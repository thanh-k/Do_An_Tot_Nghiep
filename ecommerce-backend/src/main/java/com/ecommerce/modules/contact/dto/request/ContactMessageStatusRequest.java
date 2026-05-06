package com.ecommerce.modules.contact.dto.request;

import com.ecommerce.modules.contact.entity.ContactMessageStatus;
import lombok.Data;

@Data
public class ContactMessageStatusRequest {
    private ContactMessageStatus status;
}
