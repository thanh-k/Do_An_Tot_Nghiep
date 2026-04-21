package com.ecommerce.modules.news.service;

import com.ecommerce.modules.news.dto.request.NewsTopicRequest;
import com.ecommerce.modules.news.dto.response.NewsTopicResponse;

import java.util.List;

public interface NewsTopicService {
    List<NewsTopicResponse> getPublicTopics();
    List<NewsTopicResponse> getAdminTopics();
    NewsTopicResponse create(NewsTopicRequest request);
    NewsTopicResponse update(Long id, NewsTopicRequest request);
    NewsTopicResponse toggleStatus(Long id, boolean force);
    void delete(Long id, boolean force);
}
