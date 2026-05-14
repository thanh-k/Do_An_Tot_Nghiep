package com.ecommerce.modules.announcement.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.announcement.dto.request.AnnouncementBarRequest;
import com.ecommerce.modules.announcement.dto.response.AnnouncementBarResponse;
import com.ecommerce.modules.announcement.service.AnnouncementBarService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AnnouncementBarController {

    private final AnnouncementBarService announcementBarService;

    @GetMapping("/announcement-bar/active")
    public ApiResponse<AnnouncementBarResponse> getActive() {
        return ApiResponse.<AnnouncementBarResponse>builder()
                .result(announcementBarService.getActive())
                .build();
    }

    @PreAuthorize("hasAuthority('ANNOUNCEMENT_VIEW')")
    @GetMapping("/admin/announcement-bars")
    public ApiResponse<List<AnnouncementBarResponse>> getAdminList() {
        return ApiResponse.<List<AnnouncementBarResponse>>builder()
                .result(announcementBarService.getAdminList())
                .build();
    }

    @PreAuthorize("hasAuthority('ANNOUNCEMENT_MANAGE')")
    @PostMapping("/admin/announcement-bars")
    public ApiResponse<AnnouncementBarResponse> create(@RequestBody AnnouncementBarRequest request) {
        return ApiResponse.<AnnouncementBarResponse>builder()
                .message("Tạo thông báo chạy thành công")
                .result(announcementBarService.create(request))
                .build();
    }

    @PreAuthorize("hasAuthority('ANNOUNCEMENT_MANAGE')")
    @PutMapping("/admin/announcement-bars/{id}")
    public ApiResponse<AnnouncementBarResponse> update(@PathVariable Long id, @RequestBody AnnouncementBarRequest request) {
        return ApiResponse.<AnnouncementBarResponse>builder()
                .message("Cập nhật thông báo chạy thành công")
                .result(announcementBarService.update(id, request))
                .build();
    }

    @PreAuthorize("hasAuthority('ANNOUNCEMENT_MANAGE')")
    @PatchMapping("/admin/announcement-bars/{id}/toggle")
    public ApiResponse<AnnouncementBarResponse> toggle(@PathVariable Long id) {
        return ApiResponse.<AnnouncementBarResponse>builder()
                .message("Đổi trạng thái thông báo thành công")
                .result(announcementBarService.toggleActive(id))
                .build();
    }

    @PreAuthorize("hasAuthority('ANNOUNCEMENT_MANAGE')")
    @DeleteMapping("/admin/announcement-bars/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        announcementBarService.delete(id);
        return ApiResponse.<Void>builder()
                .message("Xóa thông báo chạy thành công")
                .build();
    }
}
