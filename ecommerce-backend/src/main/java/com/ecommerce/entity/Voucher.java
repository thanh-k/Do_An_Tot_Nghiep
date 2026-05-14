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

    private String category; // "DISCOUNT", "SHIPPING", "CASHBACK", "VIP", "COIN_REWARD"
    private String discountType; // "PERCENT" hoặc "FIXED"
    private Double discountValue; // Giá trị: ví dụ 10 (cho 10%) hoặc 50000 (cho 50k)
    private Double minOrderValue; // Đơn tối thiểu phải đạt để dùng voucher
    private Integer quantity; // Số lượng còn lại hoặc quota/tháng cho VIP

    @Column(name = "vip_only", nullable = false)
    @Builder.Default
    private Boolean vipOnly = false;

    @Column(name = "monthly_reset", nullable = false)
    @Builder.Default
    private Boolean monthlyReset = false;

    @Column(name = "monthly_quantity")
    private Integer monthlyQuantity;

    private LocalDateTime expiryDate;
    private String image;

    /**
     * Số xu cần dùng để đổi voucher.
     * Chỉ áp dụng cho voucher có category = COIN_REWARD.
     */
    @Column(name = "coin_cost")
    private Long coinCost;

    private Boolean active;
}