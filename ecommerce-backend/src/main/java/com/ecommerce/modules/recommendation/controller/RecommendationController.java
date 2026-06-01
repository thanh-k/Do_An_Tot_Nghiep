package com.ecommerce.modules.recommendation.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.product.dto.response.ProductResponse;
import com.ecommerce.modules.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private static final String BEHAVIOR_COOKIE_NAME = "insightshop_behavior_session";

    private final RecommendationService recommendationService;

    @GetMapping("/me")
    public ApiResponse<List<ProductResponse>> getMyRecommendations(
            @RequestParam(required = false) String sessionId,
            @CookieValue(name = BEHAVIOR_COOKIE_NAME, required = false) String cookieSessionId,
            @RequestParam(defaultValue = "8") int limit) {
        String resolvedSessionId = StringUtils.hasText(sessionId) ? sessionId : cookieSessionId;

        return ApiResponse.<List<ProductResponse>>builder()
                .result(recommendationService.getPersonalizedRecommendations(resolvedSessionId, limit))
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
