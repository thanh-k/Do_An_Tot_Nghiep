package com.ecommerce.modules.news.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.news.dto.response.NewsPostResponse;
import com.ecommerce.modules.news.dto.response.NewsTopicResponse;
import com.ecommerce.modules.news.service.NewsPostService;
import com.ecommerce.modules.news.service.NewsTopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/news")
@RequiredArgsConstructor
public class NewsPublicController {

    private final NewsTopicService newsTopicService;
    private final NewsPostService newsPostService;

    @GetMapping("/topics")
    public ApiResponse<List<NewsTopicResponse>> getTopics() {
        return ApiResponse.<List<NewsTopicResponse>>builder().result(newsTopicService.getPublicTopics()).build();
    }

    @GetMapping("/posts")
    public ApiResponse<List<NewsPostResponse>> getPosts(
            @RequestParam(required = false) String topicSlug,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.<List<NewsPostResponse>>builder().result(newsPostService.getPublicPosts(topicSlug, keyword)).build();
    }

    @GetMapping("/posts/featured")
    public ApiResponse<NewsPostResponse> getFeaturedPost() {
        return ApiResponse.<NewsPostResponse>builder().result(newsPostService.getFeaturedPost()).build();
    }

    @GetMapping("/posts/trending")
    public ApiResponse<List<NewsPostResponse>> getTrendingPosts() {
        return ApiResponse.<List<NewsPostResponse>>builder().result(newsPostService.getTrendingPosts()).build();
    }

    @GetMapping("/posts/{slug}")
    public ApiResponse<NewsPostResponse> getPostDetail(@PathVariable String slug) {
        return ApiResponse.<NewsPostResponse>builder().result(newsPostService.getPublicPostDetail(slug)).build();
    }

    @GetMapping("/posts/id/{id}/related")
    public ApiResponse<List<NewsPostResponse>> getRelatedPosts(@PathVariable Long id) {
        return ApiResponse.<List<NewsPostResponse>>builder().result(newsPostService.getRelatedPosts(id)).build();
    }
}
