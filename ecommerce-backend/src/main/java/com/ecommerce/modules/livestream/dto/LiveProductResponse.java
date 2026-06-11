package com.ecommerce.modules.livestream.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveProductResponse {
    private Long id;
    private Long variantId;
    private String name;
    private String slug;
    private String thumbnail;
    private String brandName;
    private String categoryName;
    private Double price;
    private Double compareAtPrice;
    private Integer stock;
    private Boolean pinned;
}
