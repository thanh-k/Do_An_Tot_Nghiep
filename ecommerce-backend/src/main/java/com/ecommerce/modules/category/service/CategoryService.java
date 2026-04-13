package com.ecommerce.modules.category.service;

import com.ecommerce.modules.category.dto.request.CategoryRequest;
import com.ecommerce.modules.category.dto.response.CategoryResponse;
import java.util.List;

public interface CategoryService {
    CategoryResponse create(CategoryRequest request);

    List<CategoryResponse> getAll();

    CategoryResponse getById(Long id);

    CategoryResponse update(Long id, CategoryRequest request);

    void delete(Long id);

    // Thêm dòng này vào cuối file
    CategoryResponse updateWithImage(Long id, CategoryRequest request,
            org.springframework.web.multipart.MultipartFile file) throws java.io.IOException;
}