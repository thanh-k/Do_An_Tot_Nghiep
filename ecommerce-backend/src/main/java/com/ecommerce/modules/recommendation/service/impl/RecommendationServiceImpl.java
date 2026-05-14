package com.ecommerce.modules.recommendation.service.impl;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.modules.behavior.entity.UserProductInterest;
import com.ecommerce.modules.behavior.repository.UserProductInterestRepository;
import com.ecommerce.modules.product.dto.response.ProductResponse;
import com.ecommerce.modules.product.repository.ProductRepository;
import com.ecommerce.modules.product.service.ProductService;
import com.ecommerce.modules.recommendation.service.RecommendationService;
import com.ecommerce.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final UserProductInterestRepository interestRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getPersonalizedRecommendations(String sessionId, int limit) {
        int safeLimit = normalizeLimit(limit);
        Long userId = getCurrentUser().map(User::getId).orElse(null);
        String normalizedSession = StringUtils.hasText(sessionId) ? sessionId.trim() : null;

        List<Long> resultIds = new ArrayList<>();
        List<UserProductInterest> interests = interestRepository.findTopInterests(userId, normalizedSession, PageRequest.of(0, safeLimit * 2));

        for (UserProductInterest interest : interests) {
            Product product = interest.getProduct();
            if (isActive(product)) {
                addUnique(resultIds, product.getId(), safeLimit);
            }
            if (resultIds.size() >= safeLimit) break;
        }

        for (UserProductInterest interest : interests) {
            Product product = interest.getProduct();
            if (product == null || resultIds.size() >= safeLimit) continue;
            List<Product> similar = productRepository.findSimilarActiveProducts(
                    product.getId(),
                    product.getCategory() != null ? product.getCategory().getId() : null,
                    product.getBrand() != null ? product.getBrand().getId() : null,
                    PageRequest.of(0, safeLimit)
            );
            for (Product item : similar) {
                addUnique(resultIds, item.getId(), safeLimit);
                if (resultIds.size() >= safeLimit) break;
            }
        }

        if (resultIds.size() < safeLimit) {
            for (Product product : productRepository.findTopActiveProducts(PageRequest.of(0, safeLimit))) {
                addUnique(resultIds, product.getId(), safeLimit);
                if (resultIds.size() >= safeLimit) break;
            }
        }

        return toResponses(resultIds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getSimilarProducts(Long productId, int limit) {
        int safeLimit = normalizeLimit(limit);
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return List.of();
        }

        Product product = productOpt.get();
        Long categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        Long brandId = product.getBrand() != null ? product.getBrand().getId() : null;

        List<Long> ids = productRepository.findSimilarActiveProducts(productId, categoryId, brandId, PageRequest.of(0, safeLimit))
                .stream()
                .map(Product::getId)
                .collect(Collectors.toCollection(ArrayList::new));

        if (ids.size() < safeLimit) {
            for (Product fallback : productRepository.findTopActiveProducts(PageRequest.of(0, safeLimit))) {
                if (!Objects.equals(fallback.getId(), productId)) {
                    addUnique(ids, fallback.getId(), safeLimit);
                }
                if (ids.size() >= safeLimit) break;
            }
        }

        return toResponses(ids);
    }

    private List<ProductResponse> toResponses(List<Long> ids) {
        return ids.stream()
                .map(id -> {
                    try {
                        return productService.getProductById(id);
                    } catch (Exception ignored) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .toList();
    }

    private boolean isActive(Product product) {
        return product != null && Boolean.TRUE.equals(product.getActive());
    }

    private void addUnique(List<Long> ids, Long id, int limit) {
        if (id != null && !ids.contains(id) && ids.size() < limit) {
            ids.add(id);
        }
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) return 8;
        return Math.min(limit, 20);
    }

    private Optional<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.empty();
        }
        String principal = authentication.getName();
        if (!StringUtils.hasText(principal)) {
            return Optional.empty();
        }
        return userRepository.findByEmailIgnoreCase(principal);
    }
}
