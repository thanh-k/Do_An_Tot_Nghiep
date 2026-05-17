package com.ecommerce.modules.product.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantRequest {
    private Long id;
    private String sku;
    private Double price;
    private Double compareAtPrice;
    private Integer stock;
    private String attributes; // Chuỗi JSON thuộc tính {color, storage...}
    private String image; // URL ảnh của variant
    private Boolean hasOrders;

}