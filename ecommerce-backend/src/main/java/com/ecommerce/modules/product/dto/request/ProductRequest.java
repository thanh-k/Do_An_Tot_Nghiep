package com.ecommerce.modules.product.dto.request;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    private String name;
    private String slug;
    private Long categoryId;
    private Long brandId;
    private String shortDescription;
    private String description;
    private String specifications; // Chuỗi JSON thông số kỹ thuật
    private String thumbnail;
    private Boolean isFeatured;
    private Boolean isNew;
    private Boolean isSale;

    private List<String> images; // Danh sách URL bộ sưu tập ảnh
    private List<VariantRequest> variants; // Danh sách các biến thể
}