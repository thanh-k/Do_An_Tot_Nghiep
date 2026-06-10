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
    private String status; // "PENDING", "PAID", "DELIVERED"
    private String paymentMethod; // "COD" hoặc "VNPAY"
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderDetail> orderDetails;
}