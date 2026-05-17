package com.ecommerce.modules.behavior.service.impl;

import com.ecommerce.entity.*;
import com.ecommerce.modules.behavior.dto.BehaviorTrackRequest;
import com.ecommerce.modules.behavior.dto.BehaviorTrackResponse;
import com.ecommerce.modules.behavior.entity.BehaviorEventType;
import com.ecommerce.modules.behavior.entity.UserBehaviorEvent;
import com.ecommerce.modules.behavior.entity.UserProductInterest;
import com.ecommerce.modules.behavior.repository.UserBehaviorEventRepository;
import com.ecommerce.modules.behavior.repository.UserProductInterestRepository;
import com.ecommerce.modules.behavior.service.BehaviorTrackingService;
import com.ecommerce.modules.brand.repository.BrandRepository;
import com.ecommerce.modules.category.repository.CategoryRepository;
import com.ecommerce.modules.product.repository.ProductRepository;
import com.ecommerce.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BehaviorTrackingServiceImpl implements BehaviorTrackingService {

    private final UserBehaviorEventRepository behaviorEventRepository;
    private final UserProductInterestRepository productInterestRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public BehaviorTrackResponse track(BehaviorTrackRequest request) {
        User currentUser = getCurrentUser().orElse(null);
        String sessionId = normalize(request.getSessionId());
        Category category = request.getCategoryId() == null ? null : categoryRepository.findById(request.getCategoryId()).orElse(null);
        Brand brand = request.getBrandId() == null ? null : brandRepository.findById(request.getBrandId()).orElse(null);

        List<Long> productIds = collectProductIds(request);
        if (productIds.isEmpty()) {
            saveEvent(request, currentUser, sessionId, null, category, brand);
        } else {
            for (Long productId : productIds) {
                productRepository.findById(productId).ifPresent(product -> {
                    saveEvent(request, currentUser, sessionId, product, category, brand);
                    updateInterest(request.getEventType(), currentUser, sessionId, product);
                });
            }
        }

        return BehaviorTrackResponse.builder()
                .tracked(true)
                .message("Đã ghi nhận hành vi người dùng")
                .build();
    }

    private void saveEvent(BehaviorTrackRequest request, User user, String sessionId, Product product, Category category, Brand brand) {
        behaviorEventRepository.save(UserBehaviorEvent.builder()
                .user(user)
                .sessionId(sessionId)
                .eventType(request.getEventType())
                .product(product)
                .category(category != null ? category : product != null ? product.getCategory() : null)
                .brand(brand != null ? brand : product != null ? product.getBrand() : null)
                .keyword(normalize(request.getKeyword()))
                .pageUrl(normalize(request.getPageUrl()))
                .metadataJson(normalize(request.getMetadataJson()))
                .build());
    }

    private void updateInterest(BehaviorEventType eventType, User user, String sessionId, Product product) {
        if (product == null || (user == null && !StringUtils.hasText(sessionId))) {
            return;
        }

        Optional<UserProductInterest> existing = user != null
                ? productInterestRepository.findFirstByUser_IdAndProduct_IdOrderByUpdatedAtDesc(user.getId(), product.getId())
                : productInterestRepository.findFirstBySessionIdAndProduct_IdOrderByUpdatedAtDesc(sessionId, product.getId());

        UserProductInterest interest = existing.orElseGet(() -> UserProductInterest.builder()
                .user(user)
                .sessionId(user == null ? sessionId : sessionId)
                .product(product)
                .score(0.0)
                .viewCount(0L)
                .cartCount(0L)
                .wishlistCount(0L)
                .checkoutCount(0L)
                .purchaseCount(0L)
                .build());

        interest.setScore(Math.max(0.0, interest.getScore() + getScore(eventType)));
        interest.setLastEventType(eventType);
        interest.setLastInteractedAt(LocalDateTime.now());

        switch (eventType) {
            case VIEW_PRODUCT -> interest.setViewCount(interest.getViewCount() + 1);
            case ADD_TO_CART, REMOVE_FROM_CART, BUY_NOW -> interest.setCartCount(interest.getCartCount() + 1);
            case ADD_TO_WISHLIST, REMOVE_FROM_WISHLIST -> interest.setWishlistCount(interest.getWishlistCount() + 1);
            case START_CHECKOUT, ABANDON_CHECKOUT -> interest.setCheckoutCount(interest.getCheckoutCount() + 1);
            case PLACE_ORDER -> interest.setPurchaseCount(interest.getPurchaseCount() + 1);
            default -> { }
        }

        productInterestRepository.save(interest);
    }

    private double getScore(BehaviorEventType eventType) {
        return switch (eventType) {
            case VIEW_PRODUCT -> 1.0;
            case SEARCH_PRODUCT, VIEW_CATEGORY, VIEW_BRAND, IMAGE_SEARCH -> 2.0;
            case COMPARE_PRODUCT -> 3.0;
            case ADD_TO_WISHLIST -> 4.0;
            case ADD_TO_CART -> 5.0;
            case BUY_NOW -> 7.0;
            case START_CHECKOUT -> 8.0;
            case ABANDON_CHECKOUT -> 9.0;
            case PLACE_ORDER -> 10.0;
            case REMOVE_FROM_CART, REMOVE_FROM_WISHLIST -> -2.0;
        };
    }

    private List<Long> collectProductIds(BehaviorTrackRequest request) {
        LinkedHashSet<Long> ids = new LinkedHashSet<>();
        if (request.getProductId() != null) {
            ids.add(request.getProductId());
        }
        if (request.getProductIds() != null) {
            request.getProductIds().stream().filter(id -> id != null && id > 0).forEach(ids::add);
        }
        return new ArrayList<>(ids);
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

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed;
    }
}
