package com.ecommerce.modules.brand.service;

import com.ecommerce.modules.brand.dto.request.BrandRequest;
import com.ecommerce.modules.brand.dto.response.BrandResponse;

import java.io.IOException;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface BrandService {
    BrandResponse create(BrandRequest request);

    List<BrandResponse> getAll();

    BrandResponse getById(Long id);

    BrandResponse update(Long id, BrandRequest request);

    void delete(Long id);

    // Thêm phương thức này vào interface cũ
    BrandResponse updateWithImage(Long id, BrandRequest request, MultipartFile file) throws IOException;
}