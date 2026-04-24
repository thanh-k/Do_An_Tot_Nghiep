package com.ecommerce.modules.product.dto.response;

import com.ecommerce.modules.brand.dto.response.BrandResponse;
import com.ecommerce.modules.category.dto.response.CategoryResponse;
import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String slug;
    private String shortDescription;
    private String description;
    private String thumbnail;
    private String specifications; // Chuỗi JSON thông số kỹ thuật
    private Boolean isFeatured;
    private Boolean isNew;
    private Boolean isSale;

    // Trả về Object để FE hiển thị tên Category/Brand luôn, không chỉ mỗi ID
    private CategoryResponse category;
    private BrandResponse brand;

    private List<String> images; // Danh sách URL ảnh từ bảng ProductImage
    private List<VariantResponse> variants; // Danh sách các biến thể
}