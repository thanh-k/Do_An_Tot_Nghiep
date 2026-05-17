package com.ecommerce.modules.behavior.service.impl;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorEventResponse;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorInterestResponse;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorSummaryResponse;
import com.ecommerce.modules.behavior.dto.admin.EventCountResponse;
import com.ecommerce.modules.behavior.entity.BehaviorEventType;
import com.ecommerce.modules.behavior.entity.UserBehaviorEvent;
import com.ecommerce.modules.behavior.entity.UserProductInterest;
import com.ecommerce.modules.behavior.repository.UserBehaviorEventRepository;
import com.ecommerce.modules.behavior.repository.UserProductInterestRepository;
import com.ecommerce.modules.behavior.service.AdminBehaviorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminBehaviorServiceImpl implements AdminBehaviorService {

    private static final int DEFAULT_LIMIT = 100;
    private static final int MAX_LIMIT = 500;

    private final UserBehaviorEventRepository behaviorEventRepository;
    private final UserProductInterestRepository productInterestRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminBehaviorSummaryResponse getSummary() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (EventCountResponse item : behaviorEventRepository.countGroupByEventType()) {
            counts.put(item.getEventType().name(), item.getTotal());
        }

        return AdminBehaviorSummaryResponse.builder()
                .totalEvents(behaviorEventRepository.count())
                .totalInterests(productInterestRepository.count())
                .totalProductViews(counts.getOrDefault(BehaviorEventType.VIEW_PRODUCT.name(), 0L))
                .totalSearches(counts.getOrDefault(BehaviorEventType.SEARCH_PRODUCT.name(), 0L))
                .totalAddToCart(counts.getOrDefault(BehaviorEventType.ADD_TO_CART.name(), 0L))
                .totalWishlist(counts.getOrDefault(BehaviorEventType.ADD_TO_WISHLIST.name(), 0L))
                .totalCheckoutStarts(counts.getOrDefault(BehaviorEventType.START_CHECKOUT.name(), 0L))
                .totalAbandonedCheckouts(counts.getOrDefault(BehaviorEventType.ABANDON_CHECKOUT.name(), 0L))
                .totalPurchases(counts.getOrDefault(BehaviorEventType.PLACE_ORDER.name(), 0L))
                .eventCounts(counts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminBehaviorEventResponse> getEvents(BehaviorEventType eventType,
                                                      String keyword,
                                                      String userKeyword,
                                                      String productKeyword,
                                                      LocalDate fromDate,
                                                      LocalDate toDate,
                                                      int limit) {
        LocalDateTime from = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime to = toDate == null ? null : toDate.plusDays(1).atStartOfDay();
        Pageable pageable = PageRequest.of(0, normalizeLimit(limit));
        return behaviorEventRepository.searchAdminEvents(
                        eventType,
                        normalize(keyword),
                        normalize(userKeyword),
                        normalize(productKeyword),
                        from,
                        to,
                        pageable
                )
                .stream()
                .map(this::toEventResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminBehaviorInterestResponse> getInterests(String keyword,
                                                            String userKeyword,
                                                            String productKeyword,
                                                            int limit) {
        Pageable pageable = PageRequest.of(0, normalizeLimit(limit));
        return productInterestRepository.searchAdminInterests(
                        normalize(keyword),
                        normalize(userKeyword),
                        normalize(productKeyword),
                        pageable
                )
                .stream()
                .map(this::toInterestResponse)
                .toList();
    }

    private AdminBehaviorEventResponse toEventResponse(UserBehaviorEvent event) {
        User user = event.getUser();
        Product product = event.getProduct();
        return AdminBehaviorEventResponse.builder()
                .id(event.getId())
                .userId(user == null ? null : user.getId())
                .userFullName(user == null ? null : user.getFullName())
                .userEmail(user == null ? null : user.getEmail())
                .sessionId(event.getSessionId())
                .eventType(event.getEventType())
                .productId(product == null ? null : product.getId())
                .productName(product == null ? null : product.getName())
                .productThumbnail(product == null ? null : product.getThumbnail())
                .categoryId(event.getCategory() == null ? null : event.getCategory().getId())
                .categoryName(event.getCategory() == null ? null : event.getCategory().getName())
                .brandId(event.getBrand() == null ? null : event.getBrand().getId())
                .brandName(event.getBrand() == null ? null : event.getBrand().getName())
                .keyword(event.getKeyword())
                .pageUrl(event.getPageUrl())
                .metadataJson(event.getMetadataJson())
                .createdAt(event.getCreatedAt())
                .build();
    }

    private AdminBehaviorInterestResponse toInterestResponse(UserProductInterest interest) {
        User user = interest.getUser();
        Product product = interest.getProduct();
        return AdminBehaviorInterestResponse.builder()
                .id(interest.getId())
                .userId(user == null ? null : user.getId())
                .userFullName(user == null ? null : user.getFullName())
                .userEmail(user == null ? null : user.getEmail())
                .sessionId(interest.getSessionId())
                .productId(product == null ? null : product.getId())
                .productName(product == null ? null : product.getName())
                .productThumbnail(product == null ? null : product.getThumbnail())
                .categoryName(product == null || product.getCategory() == null ? null : product.getCategory().getName())
                .brandName(product == null || product.getBrand() == null ? null : product.getBrand().getName())
                .score(interest.getScore())
                .viewCount(interest.getViewCount())
                .cartCount(interest.getCartCount())
                .wishlistCount(interest.getWishlistCount())
                .checkoutCount(interest.getCheckoutCount())
                .purchaseCount(interest.getPurchaseCount())
                .lastEventType(interest.getLastEventType())
                .lastInteractedAt(interest.getLastInteractedAt())
                .createdAt(interest.getCreatedAt())
                .updatedAt(interest.getUpdatedAt())
                .build();
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }
}
