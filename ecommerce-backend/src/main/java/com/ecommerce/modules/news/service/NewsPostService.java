package com.ecommerce.modules.news.service;

import com.ecommerce.modules.news.dto.request.NewsPostRequest;
import com.ecommerce.modules.news.dto.request.NewsPostStatusRequest;
import com.ecommerce.modules.news.dto.response.NewsPostResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface NewsPostService {
    List<NewsPostResponse> getPublicPosts(String topicSlug, String keyword);
    NewsPostResponse getFeaturedPost();
    List<NewsPostResponse> getTrendingPosts();
    NewsPostResponse getPublicPostDetail(String slug);
    List<NewsPostResponse> getRelatedPosts(Long id);

    List<NewsPostResponse> getAdminPosts(String keyword, String topicSlug, String status);
    NewsPostResponse create(NewsPostRequest request, MultipartFile file) throws IOException;
    NewsPostResponse update(Long id, NewsPostRequest request, MultipartFile file) throws IOException;
    NewsPostResponse updateStatus(Long id, NewsPostStatusRequest request);
    NewsPostResponse toggleFeatured(Long id);
    void delete(Long id);
}
