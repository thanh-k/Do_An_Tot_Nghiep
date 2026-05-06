package com.ecommerce.modules.news.service.impl;

import com.ecommerce.modules.news.entity.NewsPost;
import com.ecommerce.modules.news.entity.NewsTopic;
import com.ecommerce.modules.news.dto.response.NewsPostResponse;
import com.ecommerce.modules.news.dto.response.NewsTopicResponse;
import org.springframework.stereotype.Component;

@Component
public class NewsMapper {

    public NewsTopicResponse toTopicResponse(NewsTopic topic) {
        return NewsTopicResponse.builder()
                .id(topic.getId())
                .name(topic.getName())
                .slug(topic.getSlug())
                .description(topic.getDescription())
                .active(topic.getActive())
                .displayOrder(topic.getDisplayOrder())
                .postCount(0)
                .build();
    }

    public NewsPostResponse toPostResponse(NewsPost post) {
        return NewsPostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .summary(post.getSummary())
                .content(post.getContent())
                .thumbnail(post.getThumbnail())
                .status(post.getStatus())
                .featured(post.getFeatured())
                .viewCount(post.getViewCount())
                .publishedAt(post.getPublishedAt())
                .createdAt(post.getCreatedAt())
                .topicId(post.getTopic() != null ? post.getTopic().getId() : null)
                .topicName(post.getTopic() != null ? post.getTopic().getName() : null)
                .topicSlug(post.getTopic() != null ? post.getTopic().getSlug() : null)
                .authorId(post.getAuthor() != null ? post.getAuthor().getId() : null)
                .authorName(post.getAuthor() != null ? post.getAuthor().getFullName() : null)
                .authorAvatar(post.getAuthor() != null ? post.getAuthor().getAvatar() : null)
                .build();
    }
}
