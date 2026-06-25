package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;
    private String shippingAddress;
    private String phoneNumber;
    private Double totalAmount;
    private Double shippingFee;
    private Double discountAmount;
    private String voucherCode;
    private String status; // Trạng thái xử lý đơn: PENDING, PROCESSING, SHIPPING, DELIVERED, COMPLETED, CANCELLED
    private String paymentStatus; // Trạng thái thanh toán: UNPAID, PAID, REFUNDED
    private String paymentMethod; // COD, VNPAY hoặc BANKING
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderDetail> orderDetails;
}