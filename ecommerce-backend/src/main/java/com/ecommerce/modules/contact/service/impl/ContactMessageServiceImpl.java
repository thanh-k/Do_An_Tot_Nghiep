package com.ecommerce.modules.contact.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.modules.contact.dto.request.ContactMessageRequest;
import com.ecommerce.modules.contact.dto.request.ContactMessageStatusRequest;
import com.ecommerce.modules.contact.dto.request.ContactReplyRequest;
import com.ecommerce.modules.contact.dto.response.ContactMessageResponse;
import com.ecommerce.modules.contact.entity.ContactMessage;
import com.ecommerce.modules.contact.entity.ContactMessageStatus;
import com.ecommerce.modules.contact.repository.ContactMessageRepository;
import com.ecommerce.modules.contact.service.ContactMessageService;
import com.ecommerce.modules.mail.MailService;
import com.ecommerce.modules.phoneprefix.service.PhonePrefixService;
import com.ecommerce.modules.validation.InputValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContactMessageServiceImpl implements ContactMessageService {

    private final ContactMessageRepository contactMessageRepository;
    private final MailService mailService;
    private final InputValidator inputValidator;
    private final PhonePrefixService phonePrefixService;

    @Override
    @Transactional
    public ContactMessageResponse create(ContactMessageRequest request) {
        String fullName = normalizeAndValidateFullName(request.getFullName());
        String phone = normalizeAndValidatePhone(request.getPhone());
        String email = normalizeAndValidateEmail(request.getEmail());
        String message = normalizeAndValidateMessage(request.getMessage());

        ContactMessage entity = ContactMessage.builder()
                .fullName(fullName)
                .phone(phone)
                .email(email)
                .message(message)
                .status(ContactMessageStatus.NEW)
                .build();

        return toResponse(contactMessageRepository.save(entity));
    }

    @Override
    public List<ContactMessageResponse> getAdminContacts(String keyword, String status) {
        ContactMessageStatus parsedStatus = parseStatus(status);
        String normalizedKeyword = keyword == null ? null : keyword.trim();

        return contactMessageRepository.search(normalizedKeyword, parsedStatus)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ContactMessageResponse updateStatus(Long id, ContactMessageStatusRequest request) {
        ContactMessage entity = contactMessageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CONTACT_NOT_FOUND));

        if (request.getStatus() == null) {
            throw new AppException(ErrorCode.CONTACT_STATUS_REQUIRED);
        }

        entity.setStatus(request.getStatus());
        return toResponse(contactMessageRepository.save(entity));
    }

    @Override
    @Transactional
    public ContactMessageResponse reply(Long id, ContactReplyRequest request) {
        ContactMessage entity = contactMessageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CONTACT_NOT_FOUND));

        String replyContent = request.getReplyContent() == null ? "" : request.getReplyContent().trim();
        if (replyContent.isEmpty()) {
            throw new AppException(ErrorCode.CONTACT_REPLY_REQUIRED);
        }

        entity.setReplyContent(replyContent);
        entity.setRepliedAt(LocalDateTime.now());
        entity.setStatus(ContactMessageStatus.REPLIED);

        ContactMessage saved = contactMessageRepository.save(entity);

        mailService.sendSimpleEmail(
                saved.getEmail(),
                "Phản hồi liên hệ từ NovaShop",
                "Xin chào " + saved.getFullName() + ",\n\n"
                        + replyContent
                        + "\n\nTrân trọng,\nNovaShop"
        );

        return toResponse(saved);
    }

    private ContactMessageResponse toResponse(ContactMessage entity) {
        return ContactMessageResponse.builder()
                .id(entity.getId())
                .fullName(entity.getFullName())
                .phone(entity.getPhone())
                .email(entity.getEmail())
                .message(entity.getMessage())
                .status(entity.getStatus())
                .replyContent(entity.getReplyContent())
                .repliedAt(entity.getRepliedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String normalizeAndValidateFullName(String value) {
        String normalized = inputValidator.normalizeFullName(value);
        inputValidator.validateFullName(normalized);
        return normalized;
    }

    private String normalizeAndValidatePhone(String value) {
        String normalized = inputValidator.normalizePhone(value);
        inputValidator.validatePhone(normalized);
        phonePrefixService.validateAllowedPrefix(normalized);
        return normalized;
    }

    private String normalizeAndValidateEmail(String value) {
        String normalized = inputValidator.normalizeEmail(value);
        inputValidator.validateEmail(normalized);
        return normalized;
    }

    private String normalizeAndValidateMessage(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isBlank()) {
            throw new AppException(ErrorCode.CONTACT_MESSAGE_REQUIRED);
        }
        return normalized;
    }

    private ContactMessageStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        try {
            return ContactMessageStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.CONTACT_STATUS_REQUIRED);
        }
    }
}