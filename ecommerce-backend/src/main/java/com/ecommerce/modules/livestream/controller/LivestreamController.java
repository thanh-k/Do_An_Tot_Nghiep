package com.ecommerce.modules.livestream.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.livestream.dto.LivestreamDealRequest;
import com.ecommerce.modules.livestream.dto.LivestreamRequest;
import com.ecommerce.modules.livestream.dto.LivestreamResponse;
import com.ecommerce.modules.livestream.dto.LiveChatMessageResponse;
import com.ecommerce.modules.livestream.entity.LivestreamStatus;
import com.ecommerce.modules.livestream.service.LivestreamService;
import com.ecommerce.modules.upload.service.LocalStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class LivestreamController {
    private final LivestreamService livestreamService;
    private final LocalStorageService localStorageService;

    @GetMapping("/api/v1/livestreams")
    public ApiResponse<List<LivestreamResponse>> getLiveStreams() {
        return ApiResponse.<List<LivestreamResponse>>builder().result(livestreamService.getLive()).build();
    }

    @GetMapping("/api/v1/livestreams/{id}")
    public ApiResponse<LivestreamResponse> getLivestream(@PathVariable Long id) {
        return ApiResponse.<LivestreamResponse>builder().result(livestreamService.getById(id)).build();
    }

    @PostMapping("/api/v1/livestreams/{id}/view")
    public ApiResponse<LivestreamResponse> increaseViewer(@PathVariable Long id) {
        return ApiResponse.<LivestreamResponse>builder().result(livestreamService.increaseViewer(id)).build();
    }

    @PreAuthorize("hasAuthority('LIVESTREAM_VIEW') or hasAuthority('LIVESTREAM_MANAGE')")
    @GetMapping("/api/v1/admin/livestreams")
    public ApiResponse<List<LivestreamResponse>> getAllAdmin() {
        return ApiResponse.<List<LivestreamResponse>>builder().result(livestreamService.getAll()).build();
    }

    @PreAuthorize("hasAuthority('LIVESTREAM_MANAGE')")
    @PostMapping("/api/v1/admin/livestreams/upload-thumbnail")
    public ApiResponse<String> uploadThumbnail(@RequestParam("file") MultipartFile file) throws IOException {
        return ApiResponse.<String>builder()
                .result(localStorageService.uploadImage(file, "livestreams"))
                .build();
    }

    @PreAuthorize("hasAuthority('LIVESTREAM_MANAGE')")
    @PostMapping("/api/v1/admin/livestreams")
    public ApiResponse<LivestreamResponse> create(@RequestBody LivestreamRequest request) {
        return ApiResponse.<LivestreamResponse>builder().result(livestreamService.create(request)).build();
    }

    @PreAuthorize("hasAuthority('LIVESTREAM_MANAGE')")
    @PutMapping("/api/v1/admin/livestreams/{id}")
    public ApiResponse<LivestreamResponse> update(@PathVariable Long id, @RequestBody LivestreamRequest request) {
        return ApiResponse.<LivestreamResponse>builder().result(livestreamService.update(id, request)).build();
    }

    @PreAuthorize("hasAuthority('LIVESTREAM_MANAGE')")
    @DeleteMapping("/api/v1/admin/livestreams/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        livestreamService.delete(id);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/api/v1/livestreams/{id}/chat-messages")
    public ApiResponse<List<LiveChatMessageResponse>> getChatMessages(@PathVariable Long id) {
        return ApiResponse.<List<LiveChatMessageResponse>>builder().result(livestreamService.getChatMessages(id)).build();
    }

    @PreAuthorize("hasAuthority('LIVESTREAM_MANAGE')")
    @PutMapping("/api/v1/admin/livestreams/{id}/status")
    public ApiResponse<LivestreamResponse> status(@PathVariable Long id, @RequestParam LivestreamStatus status) {
        return ApiResponse.<LivestreamResponse>builder().result(livestreamService.updateStatus(id, status)).build();
    }

    @PreAuthorize("hasAuthority('LIVESTREAM_MANAGE')")
    @PostMapping("/api/v1/admin/livestreams/{id}/products/{productId}")
    public ApiResponse<LivestreamResponse> addProduct(@PathVariable Long id, @PathVariable Long productId) {
        return ApiResponse.<LivestreamResponse>builder().result(livestreamService.addProduct(id, productId)).build();
    }

    @PreAuthorize("hasAuthority('LIVESTREAM_MANAGE')")
    @DeleteMapping("/api/v1/admin/livestreams/{id}/products/{productId}")
    public ApiResponse<LivestreamResponse> removeProduct(@PathVariable Long id, @PathVariable Long productId) {
        return ApiResponse.<LivestreamResponse>builder().result(livestreamService.removeProduct(id, productId)).build();
    }

    @PreAuthorize("hasAuthority('LIVESTREAM_MANAGE')")
    @PostMapping("/api/v1/admin/livestreams/{id}/pin/{productId}")
    public ApiResponse<LivestreamResponse> pinProduct(@PathVariable Long id, @PathVariable Long productId) {
        return ApiResponse.<LivestreamResponse>builder().result(livestreamService.pinProduct(id, productId)).build();
    }

    @PreAuthorize("hasAuthority('LIVESTREAM_MANAGE')")
    @PostMapping("/api/v1/admin/livestreams/{id}/unpin")
    public ApiResponse<LivestreamResponse> unpinProduct(@PathVariable Long id) {
        return ApiResponse.<LivestreamResponse>builder().result(livestreamService.unpinProduct(id)).build();
    }

    @PreAuthorize("hasAuthority('LIVESTREAM_MANAGE')")
    @PostMapping("/api/v1/admin/livestreams/{id}/deals")
    public ApiResponse<LivestreamResponse> createDeal(@PathVariable Long id, @RequestBody LivestreamDealRequest request) {
        return ApiResponse.<LivestreamResponse>builder().result(livestreamService.createDeal(id, request)).build();
    }
}
