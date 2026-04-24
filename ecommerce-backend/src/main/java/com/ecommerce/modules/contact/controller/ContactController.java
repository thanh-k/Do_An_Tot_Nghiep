package com.ecommerce.modules.contact.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.contact.dto.request.ContactMessageRequest;
import com.ecommerce.modules.contact.dto.request.ContactMessageStatusRequest;
import com.ecommerce.modules.contact.dto.request.ContactReplyRequest;
import com.ecommerce.modules.contact.dto.response.ContactMessageResponse;
import com.ecommerce.modules.contact.service.ContactMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ContactController {

    private final ContactMessageService contactMessageService;

    @PostMapping("/contacts")
    public ApiResponse<ContactMessageResponse> createContact(@RequestBody ContactMessageRequest request) {
        return ApiResponse.<ContactMessageResponse>builder()
                .message("Gửi liên hệ thành công")
                .result(contactMessageService.create(request))
                .build();
    }

    @PreAuthorize("hasAuthority('CONTACT_VIEW')")
    @GetMapping("/admin/contacts")
    public ApiResponse<List<ContactMessageResponse>> getAdminContacts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.<List<ContactMessageResponse>>builder()
                .result(contactMessageService.getAdminContacts(keyword, status))
                .build();
    }

    @PreAuthorize("hasAuthority('CONTACT_UPDATE')")
    @PatchMapping("/admin/contacts/{id}/status")
    public ApiResponse<ContactMessageResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody ContactMessageStatusRequest request
    ) {
        return ApiResponse.<ContactMessageResponse>builder()
                .message("Cập nhật trạng thái liên hệ thành công")
                .result(contactMessageService.updateStatus(id, request))
                .build();
    }

    @PreAuthorize("hasAuthority('CONTACT_REPLY')")
    @PostMapping("/admin/contacts/{id}/reply")
    public ApiResponse<ContactMessageResponse> replyContact(
            @PathVariable Long id,
            @RequestBody ContactReplyRequest request
    ) {
        return ApiResponse.<ContactMessageResponse>builder()
                .message("Đã gửi phản hồi liên hệ")
                .result(contactMessageService.reply(id, request))
                .build();
    }
}
