package com.ecommerce.modules.order.dto.request;

import lombok.Data;

@Data
public class CartItemRequest {
    private Long variantId;
    private Integer quantity;

    // Chỉ dùng cho sản phẩm mua từ livestream. Đơn hàng thường không gửi 2 field này nên không bị ảnh hưởng.
    private Long livestreamId;
    private Long liveDealId;
}