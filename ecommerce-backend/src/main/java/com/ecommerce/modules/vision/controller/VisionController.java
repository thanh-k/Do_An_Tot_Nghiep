package com.ecommerce.modules.vision.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.product.dto.response.ProductResponse;
import com.ecommerce.modules.product.service.ProductService;
import com.ecommerce.service.VisionServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vision")
@RequiredArgsConstructor
@Slf4j
public class VisionController {

    private final VisionServiceClient visionServiceClient;
    private final ProductService productService;

    @PostMapping("/search")
    public ApiResponse<List<ProductResponse>> searchByImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "5") int limit) {

        // Gọi AI → nhận list product_id theo thứ tự similarity
        List<Long> productIds = visionServiceClient.searchByImage(file, limit);
        log.info("Vision search → {} products: {}", productIds.size(), productIds);

        // Dùng getProductsByIds đã có sẵn → giữ đúng thứ tự AI
        List<ProductResponse> products = productService.getProductsByIds(productIds);

        return ApiResponse.<List<ProductResponse>>builder()
                .result(products)
                .build();
    }
}