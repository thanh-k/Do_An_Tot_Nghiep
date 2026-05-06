package com.ecommerce.modules.news.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.news.dto.request.NewsPostRequest;
import com.ecommerce.modules.news.dto.request.NewsPostStatusRequest;
import com.ecommerce.modules.news.dto.request.NewsTopicRequest;
import com.ecommerce.modules.news.dto.response.NewsPostResponse;
import com.ecommerce.modules.news.dto.response.NewsTopicResponse;
import com.ecommerce.modules.news.service.NewsPostService;
import com.ecommerce.modules.news.service.NewsTopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/news")
@RequiredArgsConstructor
public class NewsAdminController {

    private final NewsTopicService newsTopicService;
    private final NewsPostService newsPostService;

    @PreAuthorize("hasAuthority('NEWS_TOPIC_VIEW')")
    @GetMapping("/topics")
    public ApiResponse<List<NewsTopicResponse>> getAdminTopics() {
        return ApiResponse.<List<NewsTopicResponse>>builder().result(newsTopicService.getAdminTopics()).build();
    }

    @PreAuthorize("hasAuthority('NEWS_TOPIC_CREATE')")
    @PostMapping("/topics")
    public ApiResponse<NewsTopicResponse> createTopic(@RequestBody NewsTopicRequest request) {
        return ApiResponse.<NewsTopicResponse>builder().message("Tạo chủ đề tin tức thành công").result(newsTopicService.create(request)).build();
    }

    @PreAuthorize("hasAuthority('NEWS_TOPIC_UPDATE')")
    @PutMapping("/topics/{id}")
    public ApiResponse<NewsTopicResponse> updateTopic(@PathVariable Long id, @RequestBody NewsTopicRequest request) {
        return ApiResponse.<NewsTopicResponse>builder().message("Cập nhật chủ đề tin tức thành công").result(newsTopicService.update(id, request)).build();
    }

    @PreAuthorize("hasAuthority('NEWS_TOPIC_UPDATE')")
    @PatchMapping("/topics/{id}/toggle-status")
    public ApiResponse<NewsTopicResponse> toggleTopicStatus(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean force
    ) {
        return ApiResponse.<NewsTopicResponse>builder().message("Đã đổi trạng thái chủ đề").result(newsTopicService.toggleStatus(id, force)).build();
    }

    @PreAuthorize("hasAuthority('NEWS_TOPIC_DELETE')")
    @DeleteMapping("/topics/{id}")
    public ApiResponse<String> deleteTopic(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean force
    ) {
        newsTopicService.delete(id, force);
        return ApiResponse.<String>builder().message("Xóa chủ đề tin tức thành công").result("OK").build();
    }

    @PreAuthorize("hasAuthority('NEWS_POST_VIEW')")
    @GetMapping("/posts")
    public ApiResponse<List<NewsPostResponse>> getAdminPosts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String topicSlug,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.<List<NewsPostResponse>>builder().result(newsPostService.getAdminPosts(keyword, topicSlug, status)).build();
    }

    @PreAuthorize("hasAuthority('NEWS_POST_CREATE')")
    @PostMapping(value = "/posts", consumes = "multipart/form-data")
    public ApiResponse<NewsPostResponse> createPost(
            @RequestPart("data") NewsPostRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
        return ApiResponse.<NewsPostResponse>builder().message("Tạo bài viết thành công").result(newsPostService.create(request, file)).build();
    }

    @PreAuthorize("hasAuthority('NEWS_POST_UPDATE')")
    @PutMapping(value = "/posts/{id}", consumes = "multipart/form-data")
    public ApiResponse<NewsPostResponse> updatePost(
            @PathVariable Long id,
            @RequestPart("data") NewsPostRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
        return ApiResponse.<NewsPostResponse>builder().message("Cập nhật bài viết thành công").result(newsPostService.update(id, request, file)).build();
    }

    @PreAuthorize("hasAuthority('NEWS_POST_PUBLISH')")
    @PatchMapping("/posts/{id}/status")
    public ApiResponse<NewsPostResponse> updatePostStatus(@PathVariable Long id, @RequestBody NewsPostStatusRequest request) {
        return ApiResponse.<NewsPostResponse>builder().message("Cập nhật trạng thái bài viết thành công").result(newsPostService.updateStatus(id, request)).build();
    }

    @PreAuthorize("hasAuthority('NEWS_POST_UPDATE')")
    @PatchMapping("/posts/{id}/featured")
    public ApiResponse<NewsPostResponse> toggleFeatured(@PathVariable Long id) {
        return ApiResponse.<NewsPostResponse>builder().message("Đã cập nhật bài viết nổi bật").result(newsPostService.toggleFeatured(id)).build();
    }

    @PreAuthorize("hasAuthority('NEWS_POST_DELETE')")
    @DeleteMapping("/posts/{id}")
    public ApiResponse<String> deletePost(@PathVariable Long id) {
        newsPostService.delete(id);
        return ApiResponse.<String>builder().message("Xóa bài viết thành công").result("OK").build();
    }
}
