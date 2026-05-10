package com.ecommerce.modules.order.mapper;

import com.ecommerce.entity.Order;
import com.ecommerce.modules.order.dto.response.OrderDetailResponse;
import com.ecommerce.modules.order.dto.response.OrderResponse;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class OrderMapper {

    public OrderResponse toResponse(Order order) {
        if (order == null) {
            return null;
        }

        return OrderResponse.builder()
                .id(order.getId())
                .shippingAddress(order.getShippingAddress())
                .phoneNumber(order.getPhoneNumber())
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .voucherCode(order.getVoucherCode())
                .status(order.getStatus())
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
                                    .build();
                        })
                        .collect(Collectors.toList()))
                .build();
    }
}