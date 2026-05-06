package com.ecommerce.modules.news.dto.request;

import lombok.Data;

@Data
public class NewsTopicRequest {
    private String name;
    private String description;
    private Boolean active;
    private Integer displayOrder;
}
