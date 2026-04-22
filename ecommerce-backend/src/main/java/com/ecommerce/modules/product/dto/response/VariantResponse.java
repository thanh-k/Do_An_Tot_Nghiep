package com.ecommerce.modules.product.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantResponse {
    private Long id;
    private String sku;
    private Double price;
    private Double compareAtPrice;
    private Integer stock;
    private String attributes; // Chuỗi JSON {color, ram...}
    private String image;
}