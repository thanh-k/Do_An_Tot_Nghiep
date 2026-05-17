package com.ecommerce.modules.recommendation.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.product.dto.response.ProductResponse;
import com.ecommerce.modules.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/me")
    public ApiResponse<List<ProductResponse>> getMyRecommendations(
            @RequestParam(required = false) String sessionId,
            @RequestParam(defaultValue = "8") int limit) {
        return ApiResponse.<List<ProductResponse>>builder()
                .result(recommendationService.getPersonalizedRecommendations(sessionId, limit))
                .build();
    }

    @GetMapping("/similar/{productId}")
    public ApiResponse<List<ProductResponse>> getSimilarProducts(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "8") int limit) {
        return ApiResponse.<List<ProductResponse>>builder()
                .result(recommendationService.getSimilarProducts(productId, limit))
                .build();
    }
}
