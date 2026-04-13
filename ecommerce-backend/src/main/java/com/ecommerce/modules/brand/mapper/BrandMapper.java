package com.ecommerce.modules.brand.mapper;

import com.ecommerce.entity.Brand;
import com.ecommerce.modules.brand.dto.request.BrandRequest;
import com.ecommerce.modules.brand.dto.response.BrandResponse;
import org.springframework.stereotype.Component;

@Component
public class BrandMapper {

    public Brand toEntity(BrandRequest request) {
        return Brand.builder()
                .name(request.getName())
                .description(request.getDescription())
                .logo(request.getLogo())
                .build();
    }

    public BrandResponse toResponse(Brand brand) {
        return BrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .slug(brand.getSlug())
                .description(brand.getDescription())
                .logo(brand.getLogo())
                .active(brand.getActive())
                .createdAt(brand.getCreatedAt())
                .build();
    }
}