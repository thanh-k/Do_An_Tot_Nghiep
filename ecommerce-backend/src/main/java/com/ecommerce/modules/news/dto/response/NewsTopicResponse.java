package com.ecommerce.modules.news.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsTopicResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private Boolean active;
    private Integer displayOrder;
    private Integer postCount;
}
