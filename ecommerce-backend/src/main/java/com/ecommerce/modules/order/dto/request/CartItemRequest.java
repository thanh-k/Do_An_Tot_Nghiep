package com.ecommerce.modules.order.dto.request;

import lombok.Data;

@Data
public class CartItemRequest {
    private Long variantId;
    private Integer quantity;
}