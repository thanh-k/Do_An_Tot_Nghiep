package com.ecommerce.modules.announcement.service;

import com.ecommerce.modules.announcement.dto.request.AnnouncementBarRequest;
import com.ecommerce.modules.announcement.dto.response.AnnouncementBarResponse;

import java.util.List;

public interface AnnouncementBarService {
    AnnouncementBarResponse getActive();
    List<AnnouncementBarResponse> getAdminList();
    AnnouncementBarResponse create(AnnouncementBarRequest request);
    AnnouncementBarResponse update(Long id, AnnouncementBarRequest request);
    AnnouncementBarResponse toggleActive(Long id);
    void delete(Long id);
}
