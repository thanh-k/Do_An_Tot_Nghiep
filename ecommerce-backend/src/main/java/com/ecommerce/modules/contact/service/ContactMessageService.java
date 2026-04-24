package com.ecommerce.modules.contact.service;

import com.ecommerce.modules.contact.dto.request.ContactMessageRequest;
import com.ecommerce.modules.contact.dto.request.ContactMessageStatusRequest;
import com.ecommerce.modules.contact.dto.request.ContactReplyRequest;
import com.ecommerce.modules.contact.dto.response.ContactMessageResponse;

import java.util.List;

public interface ContactMessageService {
    ContactMessageResponse create(ContactMessageRequest request);

    List<ContactMessageResponse> getAdminContacts(String keyword, String status);

    ContactMessageResponse updateStatus(Long id, ContactMessageStatusRequest request);

    ContactMessageResponse reply(Long id, ContactReplyRequest request);
}
