package com.ecommerce.modules.news.dto.request;

import com.ecommerce.modules.news.entity.NewsPostStatus;
import lombok.Data;

@Data
public class NewsPostStatusRequest {
    private NewsPostStatus status;
}
