package com.ecommerce.modules.ai.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AiProductSuggestionResponse {
    private Long id;
    private String name;
    private String slug;
    private String thumbnail;
    private Double price;
    private Double compareAtPrice;
    private String summary;
}