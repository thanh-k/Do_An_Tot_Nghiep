package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code; // Ví dụ: SALE10, FREESHIP

    private String category; // "DISCOUNT", "SHIPPING", "CASHBACK", "VIP"
    private String discountType; // "PERCENT" hoặc "FIXED"
    private Double discountValue; // Giá trị: ví dụ 10 (cho 10%) hoặc 50000 (cho 50k)
    private Double minOrderValue; // Đơn tối thiểu phải đạt để dùng voucher
    private Integer quantity; // Số lượng còn lại
    private LocalDateTime expiryDate;
    private String image;
    private Boolean active;
}