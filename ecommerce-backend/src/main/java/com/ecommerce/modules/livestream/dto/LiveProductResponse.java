package com.ecommerce.modules.livestream.dto;

import com.ecommerce.modules.product.dto.response.VariantResponse;
import lombok.*;

import java.util.List;

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

    // Danh sách biến thể thật để user chọn trước khi mua trong livestream.
    // Không tạo variantId ảo ở FE để tránh checkout chỉ áp được 1 deal hoặc lỗi sai biến thể.
    private List<VariantResponse> variants;
}
