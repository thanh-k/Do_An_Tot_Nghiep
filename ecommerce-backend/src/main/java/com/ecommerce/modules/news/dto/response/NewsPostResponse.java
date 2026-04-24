package com.ecommerce.modules.news.dto.response;

import com.ecommerce.modules.news.entity.NewsPostStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsPostResponse {
    private Long id;
    private String title;
    private String slug;
    private String summary;
    private String content;
    private String thumbnail;
    private NewsPostStatus status;
    private Boolean featured;
    private Long viewCount;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private Long topicId;
    private String topicName;
    private String topicSlug;
    private Long authorId;
    private String authorName;
    private String authorAvatar;
}
