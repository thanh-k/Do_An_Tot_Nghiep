package com.ecommerce.modules.brand.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.brand.dto.request.BrandRequest;
import com.ecommerce.modules.brand.dto.response.BrandResponse;
import com.ecommerce.modules.brand.service.BrandService;
import com.ecommerce.modules.upload.service.CloudinaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandService brandService;
    private final CloudinaryService cloudinaryService;

    @GetMapping
    public ApiResponse<List<BrandResponse>> getAll() {
        return ApiResponse.<List<BrandResponse>>builder()
                .result(brandService.getAll())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<BrandResponse> getById(@PathVariable Long id) {
        return ApiResponse.<BrandResponse>builder()
                .result(brandService.getById(id))
                .build();
    }

    @PostMapping("/with-image")
    public ApiResponse<BrandResponse> createWithImage(
            @RequestPart("data") @Valid BrandRequest request,
            @RequestPart("file") MultipartFile file) throws IOException {
        String logoUrl = cloudinaryService.uploadFile(file, "brands");
        request.setLogo(logoUrl);
        return ApiResponse.<BrandResponse>builder()
                .result(brandService.create(request))
                .build();
    }

    // API Cập nhật thương hiệu kèm khả năng đổi ảnh mới
    @PutMapping("/with-image/{id}")
    public ApiResponse<BrandResponse> updateWithImage(
            @PathVariable Long id,
            @RequestPart("data") @Valid BrandRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {

        // Nếu người dùng có chọn file mới thì mới đẩy lên Cloudinary
        if (file != null && !file.isEmpty()) {
            String logoUrl = cloudinaryService.uploadFile(file, "brands");
            request.setLogo(logoUrl);
        }

        return ApiResponse.<BrandResponse>builder()
                .result(brandService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> delete(@PathVariable Long id) {
        brandService.delete(id);
        return ApiResponse.<String>builder()
                .result("Thương hiệu đã được xóa thành công")
                .build();
    }

}