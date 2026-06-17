package com.ecommerce.modules.productvideo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVideoRequest {
    private String title;
    private String description;
    private String videoUrl;
    private String thumbnailUrl;
    private Long productId;
    private Boolean active;
}
