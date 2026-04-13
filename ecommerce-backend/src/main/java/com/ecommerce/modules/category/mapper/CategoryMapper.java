package com.ecommerce.modules.category.mapper;

import com.ecommerce.entity.Category;
import com.ecommerce.modules.category.dto.request.CategoryRequest;
import com.ecommerce.modules.category.dto.response.CategoryResponse;
import com.ecommerce.common.util.SlugUtil; // Bây giờ đã có lớp này rồi
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public Category toEntity(CategoryRequest request) {
        if (request == null)
            return null;

        return Category.builder()
                .name(request.getName())
                // Gọi hàm từ lớp SlugUtil mình vừa tạo
                .slug(SlugUtil.makeSlug(request.getName()))
                .description(request.getDescription())
                .icon(request.getIcon())
                .active(true)
                .build();
    }

    public CategoryResponse toResponse(Category category) {
        if (category == null)
            return null;

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .icon(category.getIcon())
                .active(category.getActive())
                .build();
    }
}