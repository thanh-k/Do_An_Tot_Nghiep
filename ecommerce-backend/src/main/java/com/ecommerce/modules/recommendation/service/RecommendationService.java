package com.ecommerce.modules.recommendation.service;

import com.ecommerce.modules.product.dto.response.ProductResponse;

import java.util.List;

public interface RecommendationService {
    List<ProductResponse> getPersonalizedRecommendations(String sessionId, int limit);

    List<ProductResponse> getSimilarProducts(Long productId, int limit);
}
