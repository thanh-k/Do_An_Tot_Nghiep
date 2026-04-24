package com.ecommerce.modules.news.dto.request;

import com.ecommerce.modules.news.entity.NewsPostStatus;
import lombok.Data;

@Data
public class NewsPostRequest {
    private String title;
    private String summary;
    private String content;
    private String thumbnail;
    private Long topicId;
    private NewsPostStatus status;
    private Boolean featured;
}
