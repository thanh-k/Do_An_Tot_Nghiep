package com.ecommerce.modules.productCompare.mapper;

import com.ecommerce.entity.ProductCompare;
import com.ecommerce.modules.productCompare.dto.response.ProductCompareResponse;
import org.springframework.stereotype.Component;

@Component
public class ProductCompareMapper {

    public ProductCompareResponse toResponse(ProductCompare entity) {
        if (entity == null) {
            return null;
        }
        return ProductCompareResponse.builder()
                .id(entity.getId())
                .productId(entity.getProductId())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}