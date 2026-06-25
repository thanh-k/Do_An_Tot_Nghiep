package com.ecommerce.modules.order.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailResponse {
    private Long id;
    private Long productId;
    private Long productVariantId;
    private String productSlug;
    private String variantSku;
    private Integer quantity;
    private Double priceAtPurchase;
    private String name;
    private String image;
    private String attributes;
    private Boolean reviewed;
    private Boolean reviewable;
}