package com.ecommerce.modules.ai.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AiActionResponse {
    private String type;
    private Long productId;
    private String productSlug;
    private Integer quantity;
    private String color;
    private String note;
}
