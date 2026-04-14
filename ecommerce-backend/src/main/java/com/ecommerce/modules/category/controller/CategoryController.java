package com.ecommerce.modules.category.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.category.dto.request.CategoryRequest;
import com.ecommerce.modules.category.dto.response.CategoryResponse;
import com.ecommerce.modules.category.service.CategoryService;
import com.ecommerce.modules.category.service.CategoryValidatorService;
import com.ecommerce.modules.upload.service.CloudinaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryValidatorService categoryValidatorService;
    private final CategoryService categoryService;
    private final CloudinaryService cloudinaryService;

    

    @PostMapping
    public ApiResponse<CategoryResponse> create(@RequestBody @Valid CategoryRequest request) {
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.create(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<CategoryResponse>> getAll() {
        return ApiResponse.<List<CategoryResponse>>builder()
                .result(categoryService.getAll())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CategoryResponse> getById(@PathVariable Long id) {
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.getById(id))
                .build();
    }

    // API Cập nhật danh mục kèm khả năng đổi ảnh mới
    // Trong CategoryController.java
    @PutMapping("/with-image/{id}") // Nhớ đường dẫn này để gọi từ Frontend/Postman
    public ApiResponse<CategoryResponse> updateWithImage(
            @PathVariable Long id,
            @RequestPart("data") @Valid CategoryRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {

        categoryValidatorService.validate(request, file, id);
        // Phải gọi hàm updateWithImage của Service thì nó mới xóa ảnh cũ
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.updateWithImage(id, request, file))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ApiResponse.<String>builder()
                .result("Danh mục đã được xóa thành công")
                .build();
    }

    // API mới để upload ảnh trực tiếp
    @PostMapping("/with-image")
    public ApiResponse<CategoryResponse> createWithImage(
            @RequestPart("data") @Valid CategoryRequest request,
            @RequestPart("file") MultipartFile file) throws IOException {

        categoryValidatorService.validate(request, file, null);
        // 1. Gọi CloudinaryService để đẩy ảnh lên mây và lấy link về
        String imageUrl = cloudinaryService.uploadFile(file, "categories");

        // 2. Gán link ảnh vào request trước khi lưu vào DB
        request.setIcon(imageUrl);

        // 3. Lưu toàn bộ thông tin vào Database thông qua CategoryService
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.create(request))
                .build();
    }
}