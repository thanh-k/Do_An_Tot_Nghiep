package com.ecommerce.modules.category.service;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.modules.category.dto.request.CategoryRequest;
import com.ecommerce.modules.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CategoryValidatorService {

    private final CategoryRepository categoryRepository;
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList("image/jpeg", "image/png", "image/webp",
            "image/jpg");
    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

    public void validate(CategoryRequest request, MultipartFile file, Long currentId) {
        // 1. Validate Tên
        if (request.getName() == null || request.getName().trim().length() < 2
                || request.getName().trim().length() > 50) {
            throw new AppException(ErrorCode.INVALID_CATEGORY_NAME); // Ní nhớ thêm mã này vào ErrorCode nhé
        }

        // 2. Check trùng tên (Quan trọng nè)
        categoryRepository.findByName(request.getName()).ifPresent(existingCate -> {
            if (currentId == null || !existingCate.getId().equals(currentId)) {
                throw new AppException(ErrorCode.CATEGORY_EXITED);
            }
        });

        // 3. Validate File ảnh
        if (file != null && !file.isEmpty()) {
            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
                throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
            }
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new AppException(ErrorCode.FILE_TOO_LARGE);
            }
        }
    }
}