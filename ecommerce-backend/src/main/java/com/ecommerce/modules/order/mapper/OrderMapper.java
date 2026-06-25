package com.ecommerce.modules.order.mapper;

import com.ecommerce.entity.Order;
import com.ecommerce.modules.order.dto.response.OrderDetailResponse;
import com.ecommerce.modules.order.dto.response.OrderResponse;
import com.ecommerce.modules.review.repository.ProductReviewRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class OrderMapper {

    private static final List<String> REVIEWABLE_ORDER_STATUSES =
            List.of("DELIVERED", "COMPLETED", "PAID");

    private final ProductReviewRepository productReviewRepository;

    public OrderMapper(ProductReviewRepository productReviewRepository) {
        this.productReviewRepository = productReviewRepository;
    }

    public OrderResponse toResponse(Order order) {
        if (order == null) {
            return null;
        }

        boolean orderReviewable = REVIEWABLE_ORDER_STATUSES.contains(
                String.valueOf(order.getStatus()).toUpperCase()
        );
        Long userId = parseUserId(order.getUserId());

        return OrderResponse.builder()
                .id(order.getId())
                .shippingAddress(order.getShippingAddress())
                .phoneNumber(order.getPhoneNumber())
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .voucherCode(order.getVoucherCode())
                .status(order.getStatus())
                .paymentStatus(resolvePaymentStatus(order))
                .paymentMethod(order.getPaymentMethod())
                .createdAt(order.getCreatedAt())
                .details(order.getOrderDetails().stream()
                        .map(detail -> {
                            String name = "Sản phẩm";
                            String image = "";
                            String attributes = "{}";
                            Long productId = null;
                            Long productVariantId = null;
                            String productSlug = null;
                            String variantSku = "N/A";

                            if (detail.getProductVariant() != null) {
                                productVariantId = detail.getProductVariant().getId();
                                variantSku = detail.getProductVariant().getSku();
                                image = detail.getProductVariant().getImage();
                                attributes = detail.getProductVariant().getAttributes();

                                if (detail.getProductVariant().getProduct() != null) {
                                    productId = detail.getProductVariant().getProduct().getId();
                                    productSlug = detail.getProductVariant().getProduct().getSlug();
                                    name = detail.getProductVariant().getProduct().getName();

                                    if (image == null || image.isEmpty()) {
                                        image = detail.getProductVariant().getProduct().getThumbnail();
                                    }
                                }
                            }

                            boolean reviewed = hasReviewedProduct(userId, productId);
                            boolean reviewable = orderReviewable && productId != null && !reviewed;

                            return OrderDetailResponse.builder()
                                    .id(detail.getId())
                                    .productId(productId)
                                    .productVariantId(productVariantId)
                                    .productSlug(productSlug)
                                    .variantSku(variantSku)
                                    .quantity(detail.getQuantity())
                                    .priceAtPurchase(detail.getPriceAtPurchase())
                                    .name(name)
                                    .image(image)
                                    .attributes(attributes)
                                    .reviewed(reviewed)
                                    .reviewable(reviewable)
                                    .build();
                        })
                        .collect(Collectors.toList()))
                .build();
    }


    private String resolvePaymentStatus(Order order) {
        if (order == null) {
            return "UNPAID";
        }

        if (order.getPaymentStatus() != null && !order.getPaymentStatus().isBlank()) {
            return order.getPaymentStatus();
        }

        String status = String.valueOf(order.getStatus()).trim().toUpperCase();
        String paymentMethod = String.valueOf(order.getPaymentMethod()).trim().toUpperCase();

        // Tương thích dữ liệu cũ: trước đây hệ thống từng dùng status = PAID để biểu diễn đã thanh toán.
        if ("PAID".equals(status)) {
            return "PAID";
        }

        // COD: khi giao/hoàn tất đơn thì xem như đã thu tiền.
        if ("COD".equals(paymentMethod) && REVIEWABLE_ORDER_STATUSES.contains(status)) {
            return "PAID";
        }

        return "UNPAID";
    }

    private boolean hasReviewedProduct(Long userId, Long productId) {
        if (userId == null || productId == null) {
            return false;
        }
        return productReviewRepository.existsByUserIdAndProductId(userId, productId);
    }

    private Long parseUserId(String rawUserId) {
        if (rawUserId == null || rawUserId.isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(rawUserId.trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }
}
