package com.ecommerce.modules.review.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductReview;
import com.ecommerce.entity.User;
import com.ecommerce.modules.order.repository.OrderRepository;
import com.ecommerce.modules.product.repository.ProductRepository;
import com.ecommerce.modules.review.dto.request.AdminReviewReplyRequest;
import com.ecommerce.modules.review.dto.request.AdminReviewVisibilityRequest;
import com.ecommerce.modules.review.dto.request.ProductReviewCreateRequest;
import com.ecommerce.modules.review.dto.response.AdminReviewResponse;
import com.ecommerce.modules.review.dto.response.ProductReviewItemResponse;
import com.ecommerce.modules.review.dto.response.ProductReviewSummaryResponse;
import com.ecommerce.modules.review.repository.ProductReviewRepository;
import com.ecommerce.modules.review.service.ProductReviewService;
import com.ecommerce.modules.upload.service.CloudinaryService;
import com.ecommerce.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductReviewServiceImpl implements ProductReviewService {

    private static final List<String> REVIEWABLE_ORDER_STATUSES =
            List.of("DELIVERED", "COMPLETED", "PAID");
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ProductReviewRepository productReviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional(readOnly = true)
    public ProductReviewSummaryResponse getProductReviews(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        User currentUser = getCurrentAuthenticatedUserOrNull();
        List<ProductReview> reviews =
                productReviewRepository.findByProductIdAndIsVisibleTrueOrderByCreatedAtDesc(product.getId());

        return buildSummary(product, reviews, currentUser);
    }

    @Override
    @Transactional
    public ProductReviewSummaryResponse createReview(
            Long productId,
            ProductReviewCreateRequest request,
            List<MultipartFile> files
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        User currentUser = getCurrentAuthenticatedUser();

        validateReviewRequest(request);

        if (productReviewRepository.existsByUserIdAndProductId(currentUser.getId(), productId)) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        Optional<Order> purchasedOrder = findReviewedOrder(currentUser, productId);
        if (purchasedOrder.isEmpty()) {
            throw new AppException(ErrorCode.REVIEW_NOT_ALLOWED);
        }

        List<String> uploadedImageUrls = uploadReviewImages(files);

        ProductReview review = ProductReview.builder()
                .product(product)
                .user(currentUser)
                .order(purchasedOrder.get())
                .rating(request.getRating())
                .comment(request.getComment().trim())
                .imageUrls(toJsonImages(uploadedImageUrls))
                .verifiedPurchase(true)
                .isVisible(true)
                .build();

        productReviewRepository.save(review);

        List<ProductReview> reviews =
                productReviewRepository.findByProductIdAndIsVisibleTrueOrderByCreatedAtDesc(productId);
        return buildSummary(product, reviews, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminReviewResponse> getAdminReviews(String keyword, Integer rating, Boolean visible, Boolean verified, Boolean replied) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase();
        return productReviewRepository.findAll().stream()
                .sorted(Comparator.comparing(ProductReview::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .filter(review -> matchesKeyword(review, normalizedKeyword))
                .filter(review -> rating == null || Objects.equals(review.getRating(), rating))
                .filter(review -> visible == null || Objects.equals(Boolean.TRUE.equals(review.getIsVisible()), visible))
                .filter(review -> verified == null || Objects.equals(Boolean.TRUE.equals(review.getVerifiedPurchase()), verified))
                .filter(review -> replied == null || (replied ? hasReply(review) : !hasReply(review)))
                .map(this::toAdminResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminReviewResponse getAdminReviewById(Long id) {
        return toAdminResponse(getReviewOrThrow(id));
    }

    @Override
    @Transactional
    public AdminReviewResponse updateVisibility(Long id, AdminReviewVisibilityRequest request) {
        ProductReview review = getReviewOrThrow(id);
        review.setIsVisible(request.getVisible() == null || request.getVisible());
        return toAdminResponse(productReviewRepository.save(review));
    }

    @Override
    @Transactional
    public void deleteReview(Long id) {
        ProductReview review = getReviewOrThrow(id);
        productReviewRepository.delete(review);
    }

    @Override
    @Transactional
    public AdminReviewResponse replyReview(Long id, AdminReviewReplyRequest request) {
        ProductReview review = getReviewOrThrow(id);
        String reply = validateReply(request);
        review.setShopReply(reply);
        review.setShopReplyAt(LocalDateTime.now());
        review.setShopReplyBy(resolveCurrentActorLabel());
        return toAdminResponse(productReviewRepository.save(review));
    }

    @Override
    @Transactional
    public AdminReviewResponse updateReply(Long id, AdminReviewReplyRequest request) {
        ProductReview review = getReviewOrThrow(id);
        String reply = validateReply(request);
        review.setShopReply(reply);
        review.setShopReplyAt(LocalDateTime.now());
        review.setShopReplyBy(resolveCurrentActorLabel());
        return toAdminResponse(productReviewRepository.save(review));
    }

    @Override
    @Transactional
    public AdminReviewResponse deleteReply(Long id) {
        ProductReview review = getReviewOrThrow(id);
        review.setShopReply(null);
        review.setShopReplyAt(null);
        review.setShopReplyBy(null);
        return toAdminResponse(productReviewRepository.save(review));
    }

    private boolean matchesKeyword(ProductReview review, String keyword) {
        if (keyword == null || keyword.isBlank()) return true;
        String productName = review.getProduct() != null ? safe(review.getProduct().getName()) : "";
        String userName = review.getUser() != null ? safe(review.getUser().getFullName()) : "";
        String userEmail = review.getUser() != null ? safe(review.getUser().getEmail()) : "";
        String comment = safe(review.getComment());
        return productName.contains(keyword) || userName.contains(keyword) || userEmail.contains(keyword) || comment.contains(keyword);
    }

    private String safe(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private boolean hasReply(ProductReview review) {
        return review.getShopReply() != null && !review.getShopReply().isBlank();
    }

    private String validateReply(AdminReviewReplyRequest request) {
        if (request == null || request.getReplyContent() == null || request.getReplyContent().trim().length() < 2) {
            throw new AppException(ErrorCode.REVIEW_INVALID);
        }
        return request.getReplyContent().trim();
    }

    private ProductReview getReviewOrThrow(Long id) {
        return productReviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
    }

    private AdminReviewResponse toAdminResponse(ProductReview review) {
        Product product = review.getProduct();
        User user = review.getUser();
        return AdminReviewResponse.builder()
                .id(review.getId())
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : "Sản phẩm")
                .productSlug(product != null ? product.getSlug() : null)
                .userId(user != null ? user.getId() : null)
                .userName(user != null ? user.getFullName() : "Khách hàng")
                .userEmail(user != null ? user.getEmail() : null)
                .userAvatar(user != null ? user.getAvatar() : null)
                .orderId(review.getOrder() != null ? review.getOrder().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .images(parseImageUrls(review.getImageUrls()))
                .verifiedPurchase(Boolean.TRUE.equals(review.getVerifiedPurchase()))
                .visible(Boolean.TRUE.equals(review.getIsVisible()))
                .shopReply(review.getShopReply())
                .shopReplyBy(review.getShopReplyBy())
                .shopReplyAt(review.getShopReplyAt())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    private List<String> uploadReviewImages(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return new ArrayList<>();
        }

        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            try {
                imageUrls.add(cloudinaryService.uploadFile(file, "reviews"));
            } catch (IOException e) {
                throw new RuntimeException("Không thể tải ảnh đánh giá lên hệ thống", e);
            }
        }
        return imageUrls;
    }

    private ProductReviewSummaryResponse buildSummary(
            Product product,
            List<ProductReview> reviews,
            User currentUser
    ) {
        Map<Integer, Long> ratingCounts = new LinkedHashMap<>();
        for (int star = 5; star >= 1; star--) {
            final int currentStar = star;
            ratingCounts.put(
                    star,
                    reviews.stream()
                            .filter(r -> Objects.equals(r.getRating(), currentStar))
                            .count()
            );
        }

        double averageRating = reviews.isEmpty()
                ? 0.0
                : reviews.stream().mapToInt(ProductReview::getRating).average().orElse(0.0);

        boolean hasPurchased =
                currentUser != null && findReviewedOrder(currentUser, product.getId()).isPresent();
        boolean hasReviewed =
                currentUser != null
                        && productReviewRepository.existsByUserIdAndProductId(
                        currentUser.getId(),
                        product.getId()
                );
        boolean canReview = hasPurchased && !hasReviewed;

        List<ProductReviewItemResponse> reviewResponses = reviews.stream()
                .map(review -> toItemResponse(review, currentUser))
                .collect(Collectors.toList());

        return ProductReviewSummaryResponse.builder()
                .averageRating(Math.round(averageRating * 10.0) / 10.0)
                .totalReviews((long) reviews.size())
                .ratingCounts(ratingCounts)
                .hasPurchased(hasPurchased)
                .hasReviewed(hasReviewed)
                .canReview(canReview)
                .reviews(reviewResponses)
                .build();
    }

    private ProductReviewItemResponse toItemResponse(ProductReview review, User currentUser) {
        return ProductReviewItemResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .user(review.getUser().getFullName())
                .avatar(review.getUser().getAvatar())
                .rating(review.getRating())
                .createdAt(review.getCreatedAt())
                .date(review.getCreatedAt() != null
                        ? review.getCreatedAt().format(DATE_FORMATTER)
                        : "")
                .comment(review.getComment())
                .images(parseImageUrls(review.getImageUrls()))
                .verified(Boolean.TRUE.equals(review.getVerifiedPurchase()))
                .likes(0)
                .mine(currentUser != null
                        && Objects.equals(currentUser.getId(), review.getUser().getId()))
                .shopReply(review.getShopReply())
                .shopReplyBy(review.getShopReplyBy())
                .shopReplyAt(review.getShopReplyAt())
                .build();
    }

    private Optional<Order> findReviewedOrder(User user, Long productId) {
        return orderRepository.findByUserId(String.valueOf(user.getId())).stream()
                .filter(order ->
                        REVIEWABLE_ORDER_STATUSES.contains(
                                String.valueOf(order.getStatus()).toUpperCase()
                        )
                )
                .filter(order -> order.getOrderDetails() != null
                        && order.getOrderDetails().stream().anyMatch(detail ->
                        detail.getProductVariant() != null
                                && detail.getProductVariant().getProduct() != null
                                && Objects.equals(
                                detail.getProductVariant().getProduct().getId(),
                                productId
                        )))
                .max(Comparator.comparing(
                        Order::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ));
    }

    private void validateReviewRequest(ProductReviewCreateRequest request) {
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new AppException(ErrorCode.REVIEW_INVALID);
        }
        if (request.getComment() == null || request.getComment().trim().length() < 5) {
            throw new AppException(ErrorCode.REVIEW_INVALID);
        }
    }

    private String toJsonImages(List<String> images) {
        if (images == null || images.isEmpty()) {
            return "[]";
        }

        return images.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> "\"" + s.replace("\"", "\\\"") + "\"")
                .collect(Collectors.joining(",", "[", "]"));
    }

    private List<String> parseImageUrls(String raw) {
        if (raw == null || raw.isBlank() || "[]".equals(raw.trim())) {
            return new ArrayList<>();
        }

        String trimmed = raw.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }

        if (trimmed.isBlank()) {
            return new ArrayList<>();
        }

        return Arrays.stream(trimmed.split(","))
                .map(String::trim)
                .map(s -> s.replaceAll("^\"|\"$", ""))
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }

    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        String principal = authentication.getName();
        return userRepository.findByEmailIgnoreCase(principal)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private String resolveCurrentActorLabel() {
        User currentUser = getCurrentAuthenticatedUser();
        if (currentUser.getFullName() != null && !currentUser.getFullName().isBlank()) {
            return currentUser.getFullName();
        }
        return currentUser.getEmail();
    }

    private User getCurrentAuthenticatedUserOrNull() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null
                    || !authentication.isAuthenticated()
                    || authentication instanceof AnonymousAuthenticationToken) {
                return null;
            }

            String principal = authentication.getName();
            if (principal == null
                    || principal.isBlank()
                    || "anonymousUser".equalsIgnoreCase(principal)) {
                return null;
            }

            return userRepository.findByEmailIgnoreCase(principal).orElse(null);
        } catch (Exception ex) {
            return null;
        }
    }
}
