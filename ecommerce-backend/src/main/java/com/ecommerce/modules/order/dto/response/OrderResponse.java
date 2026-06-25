package com.ecommerce.modules.order.dto.response;

import lombok.*;
import java.util.List;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String shippingAddress;
    private String phoneNumber;
    private Double totalAmount;
    private Double shippingFee;
    private Double discountAmount;
    private String voucherCode;
    private String status;
    private String paymentStatus;
    private String paymentMethod;
    private LocalDateTime createdAt;
    private List<OrderDetailResponse> details;
}