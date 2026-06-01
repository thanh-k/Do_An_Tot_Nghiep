package com.ecommerce.modules.news.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.news.dto.response.NewsPostResponse;
import com.ecommerce.modules.news.service.NewsPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/external-news")
@RequiredArgsConstructor
public class ExternalNewsAdminController {

    private final NewsPostService newsPostService;

    @PreAuthorize("hasAuthority('NEWS_POST_CREATE')")
    @PostMapping("/sync")
    public ApiResponse<List<NewsPostResponse>> syncExternalPosts() {
        return ApiResponse.<List<NewsPostResponse>>builder()
                .message("Đã đồng bộ tin công nghệ từ nguồn RSS Việt Nam")
                .result(newsPostService.syncExternalTechnologyNews())
                .build();
    }
}
