package com.ecommerce.modules.order.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private String userId;
    private String shippingAddress;
    private String phoneNumber;
    private List<CartItemRequest> items;
    private String voucherCode;
}