package com.ecommerce.modules.product.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.product.dto.request.ProductRequest;
import com.ecommerce.modules.product.dto.response.ProductResponse;
import com.ecommerce.modules.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/filter")
    public ResponseEntity<?> getProductsByFilter(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long category,
            @RequestParam(required = false) List<String> brands,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int pageSize,
            @RequestParam(defaultValue = "newest") String sort) {

        Page<ProductResponse> result = productService.getProductsWithFilter(
                search, category, brands, minPrice, maxPrice, inStock, page, pageSize, sort);

        // Trả về format đồng bộ với Frontend hiện tại
        return ResponseEntity.ok(Map.of(
                "result", Map.of(
                        "items", result.getContent(),
                        "total", result.getTotalElements(),
                        "page", page,
                        "totalPages", result.getTotalPages())));
    }



    // 1. Lấy tất cả sản phẩm
    @GetMapping
    public ApiResponse<List<ProductResponse>> getAll() {
        return ApiResponse.<List<ProductResponse>>builder()
                .result(productService.getAllProducts())
                .build();
    }

    // 2. Lấy chi tiết 1 sản phẩm
    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getById(@PathVariable Long id) {
        return ApiResponse.<ProductResponse>builder()
                .result(productService.getProductById(id))
                .build();
    }

    // 3. Tạo sản phẩm mới
    // Lưu ý: Request này đã bao gồm các URL ảnh từ Cloudinary mà FE đã upload
    @PostMapping
    public ApiResponse<ProductResponse> create(@RequestBody @Valid ProductRequest request) {
        return ApiResponse.<ProductResponse>builder()
                .result(productService.createProduct(request))
                .build();
    }

    // 4. Cập nhật sản phẩm
    @PutMapping("/{id}")
    public ApiResponse<ProductResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid ProductRequest request) {
        return ApiResponse.<ProductResponse>builder()
                .result(productService.updateProduct(id, request))
                .build();
    }

    // 5. Xóa sản phẩm
    @DeleteMapping("/{id}")
    public ApiResponse<String> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ApiResponse.<String>builder()
                .result("Sản phẩm đã được xóa thành công cùng với các biến thể và ảnh liên quan")
                .build();
    }

    @GetMapping("/slug/{slug}")
    public ApiResponse<ProductResponse> getProductBySlug(@PathVariable String slug) {
        return ApiResponse.<ProductResponse>builder()
                .result(productService.getProductBySlug(slug))
                .build();
    }

    // 6. API Đồng bộ dữ liệu cũ sang hệ thống AI Python
    @PostMapping("/sync-vision")
    public ApiResponse<String> syncVision() {
        productService.syncAllProductsToVision();
        return ApiResponse.<String>builder()
                .result("Đã gửi yêu cầu đồng bộ toàn bộ sản phẩm sang Vision Service thành công!")
                .build();
    }

    // 7. Lấy danh sách sản phẩm theo danh sách ID (Dùng cho Tìm kiếm hình ảnh)
    @PostMapping("/batch")
    public ApiResponse<List<ProductResponse>> getProductsByIds(@RequestBody List<Long> ids) {
        return ApiResponse.<List<ProductResponse>>builder()
                .result(productService.getProductsByIds(ids))
                .build();
    }
}