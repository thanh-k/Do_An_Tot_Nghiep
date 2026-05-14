package com.ecommerce.modules.announcement.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.modules.announcement.dto.request.AnnouncementBarRequest;
import com.ecommerce.modules.announcement.dto.response.AnnouncementBarResponse;
import com.ecommerce.modules.announcement.entity.AnnouncementBar;
import com.ecommerce.modules.announcement.repository.AnnouncementBarRepository;
import com.ecommerce.modules.announcement.service.AnnouncementBarService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AnnouncementBarServiceImpl implements AnnouncementBarService {

    private final AnnouncementBarRepository announcementBarRepository;

    @Override
    @Transactional(readOnly = true)
    public AnnouncementBarResponse getActive() {
        return announcementBarRepository.findFirstByActiveTrueOrderBySortOrderAscIdDesc()
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnnouncementBarResponse> getAdminList() {
        return announcementBarRepository.findAllByOrderBySortOrderAscIdDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public AnnouncementBarResponse create(AnnouncementBarRequest request) {
        validate(request);
        AnnouncementBar announcement = AnnouncementBar.builder()
                .message(request.getMessage().trim())
                .active(Boolean.TRUE.equals(request.getActive()))
                .backgroundColor(normalizeColor(request.getBackgroundColor(), "#0f172a"))
                .textColor(normalizeColor(request.getTextColor(), "#ffffff"))
                .speedSeconds(normalizeSpeed(request.getSpeedSeconds()))
                .sortOrder(normalizeSortOrder(request.getSortOrder()))
                .build();
        return toResponse(announcementBarRepository.save(announcement));
    }

    @Override
    public AnnouncementBarResponse update(Long id, AnnouncementBarRequest request) {
        validate(request);
        AnnouncementBar announcement = announcementBarRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
        announcement.setMessage(request.getMessage().trim());
        announcement.setActive(Boolean.TRUE.equals(request.getActive()));
        announcement.setBackgroundColor(normalizeColor(request.getBackgroundColor(), "#0f172a"));
        announcement.setTextColor(normalizeColor(request.getTextColor(), "#ffffff"));
        announcement.setSpeedSeconds(normalizeSpeed(request.getSpeedSeconds()));
        announcement.setSortOrder(normalizeSortOrder(request.getSortOrder()));
        return toResponse(announcementBarRepository.save(announcement));
    }

    @Override
    public AnnouncementBarResponse toggleActive(Long id) {
        AnnouncementBar announcement = announcementBarRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
        announcement.setActive(!Boolean.TRUE.equals(announcement.getActive()));
        return toResponse(announcementBarRepository.save(announcement));
    }

    @Override
    public void delete(Long id) {
        if (!announcementBarRepository.existsById(id)) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        announcementBarRepository.deleteById(id);
    }

    private void validate(AnnouncementBarRequest request) {
        if (request == null || request.getMessage() == null || request.getMessage().trim().isBlank()) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        if (request.getMessage().trim().length() > 500) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private String normalizeColor(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return value.trim();
    }

    private Integer normalizeSpeed(Integer speedSeconds) {
        if (speedSeconds == null || speedSeconds <= 0) return 18;
        if (speedSeconds < 8) return 8;
        if (speedSeconds > 60) return 60;
        return speedSeconds;
    }

    private Integer normalizeSortOrder(Integer sortOrder) {
        if (sortOrder == null || sortOrder < 1) return 1;
        return sortOrder;
    }

    private AnnouncementBarResponse toResponse(AnnouncementBar announcement) {
        return AnnouncementBarResponse.builder()
                .id(announcement.getId())
                .message(announcement.getMessage())
                .active(announcement.getActive())
                .backgroundColor(announcement.getBackgroundColor())
                .textColor(announcement.getTextColor())
                .speedSeconds(announcement.getSpeedSeconds())
                .sortOrder(announcement.getSortOrder())
                .createdAt(announcement.getCreatedAt())
                .updatedAt(announcement.getUpdatedAt())
                .build();
    }
}
