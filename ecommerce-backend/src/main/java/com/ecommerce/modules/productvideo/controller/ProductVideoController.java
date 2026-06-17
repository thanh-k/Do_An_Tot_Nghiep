package com.ecommerce.modules.productvideo.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.productvideo.dto.ProductVideoRequest;
import com.ecommerce.modules.productvideo.dto.ProductVideoResponse;
import com.ecommerce.modules.productvideo.dto.ProductVideoStatsResponse;
import com.ecommerce.modules.productvideo.service.ProductVideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProductVideoController {
    private final ProductVideoService productVideoService;

    @GetMapping("/api/v1/product-videos/search")
    public ApiResponse<List<ProductVideoResponse>> search(@RequestParam String keyword,
                                                          @RequestParam(defaultValue = "6") int limit) {
        return ApiResponse.<List<ProductVideoResponse>>builder()
                .result(productVideoService.search(keyword, limit))
                .build();
    }

    @GetMapping("/api/v1/products/{productId}/videos")
    public ApiResponse<List<ProductVideoResponse>> getByProduct(@PathVariable Long productId) {
        return ApiResponse.<List<ProductVideoResponse>>builder()
                .result(productVideoService.getByProduct(productId))
                .build();
    }

    @GetMapping("/api/v1/products/{productId}/videos/related")
    public ApiResponse<List<ProductVideoResponse>> getRelated(@PathVariable Long productId,
                                                              @RequestParam(defaultValue = "4") int limit) {
        return ApiResponse.<List<ProductVideoResponse>>builder()
                .result(productVideoService.getRelated(productId, limit))
                .build();
    }

    @PostMapping("/api/v1/product-videos/{id}/view")
    public ApiResponse<ProductVideoResponse> trackView(@PathVariable Long id,
                                                       @RequestBody(required = false) Map<String, Long> body) {
        Long watchSeconds = body == null ? 0L : body.getOrDefault("watchSeconds", 0L);
        return ApiResponse.<ProductVideoResponse>builder()
                .result(productVideoService.trackView(id, watchSeconds))
                .build();
    }

    @PostMapping("/api/v1/product-videos/{id}/product-click")
    public ApiResponse<ProductVideoResponse> trackProductClick(@PathVariable Long id) {
        return ApiResponse.<ProductVideoResponse>builder()
                .result(productVideoService.trackProductClick(id))
                .build();
    }

    @PostMapping("/api/v1/product-videos/{id}/add-to-cart")
    public ApiResponse<ProductVideoResponse> trackAddToCart(@PathVariable Long id) {
        return ApiResponse.<ProductVideoResponse>builder()
                .result(productVideoService.trackAddToCart(id))
                .build();
    }

    @PostMapping("/api/v1/product-videos/{id}/order")
    public ApiResponse<ProductVideoResponse> trackOrder(@PathVariable Long id) {
        return ApiResponse.<ProductVideoResponse>builder()
                .result(productVideoService.trackOrder(id))
                .build();
    }

    @GetMapping("/api/v1/admin/product-videos")
    public ApiResponse<List<ProductVideoResponse>> getAllAdmin() {
        return ApiResponse.<List<ProductVideoResponse>>builder()
                .result(productVideoService.getAllAdmin())
                .build();
    }

    @GetMapping("/api/v1/admin/product-videos/stats")
    public ApiResponse<ProductVideoStatsResponse> getStats() {
        return ApiResponse.<ProductVideoStatsResponse>builder()
                .result(productVideoService.getStats())
                .build();
    }

    @PostMapping(value = "/api/v1/admin/product-videos", consumes = {"multipart/form-data"})
    public ApiResponse<ProductVideoResponse> create(@RequestParam String title,
                                                    @RequestParam(required = false) String description,
                                                    @RequestParam Long productId,
                                                    @RequestParam(required = false, defaultValue = "true") Boolean active,
                                                    @RequestPart(required = false) MultipartFile video,
                                                    @RequestPart(required = false) MultipartFile thumbnail) {
        return ApiResponse.<ProductVideoResponse>builder()
                .result(productVideoService.createWithFiles(title, description, productId, active, video, thumbnail))
                .build();
    }

    @PostMapping(value = "/api/v1/admin/product-videos/json")
    public ApiResponse<ProductVideoResponse> createJson(@RequestBody ProductVideoRequest request) {
        return ApiResponse.<ProductVideoResponse>builder()
                .result(productVideoService.create(request))
                .build();
    }

    @PutMapping(value = "/api/v1/admin/product-videos/{id}", consumes = {"multipart/form-data"})
    public ApiResponse<ProductVideoResponse> update(@PathVariable Long id,
                                                    @RequestParam String title,
                                                    @RequestParam(required = false) String description,
                                                    @RequestParam Long productId,
                                                    @RequestParam(required = false, defaultValue = "true") Boolean active,
                                                    @RequestPart(required = false) MultipartFile video,
                                                    @RequestPart(required = false) MultipartFile thumbnail) {
        return ApiResponse.<ProductVideoResponse>builder()
                .result(productVideoService.updateWithFiles(id, title, description, productId, active, video, thumbnail))
                .build();
    }

    @PutMapping("/api/v1/admin/product-videos/{id}/json")
    public ApiResponse<ProductVideoResponse> updateJson(@PathVariable Long id,
                                                        @RequestBody ProductVideoRequest request) {
        return ApiResponse.<ProductVideoResponse>builder()
                .result(productVideoService.update(id, request))
                .build();
    }

    @DeleteMapping("/api/v1/admin/product-videos/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        productVideoService.delete(id);
        return ApiResponse.<Void>builder().message("Xóa video mô tả sản phẩm thành công").build();
    }
}
