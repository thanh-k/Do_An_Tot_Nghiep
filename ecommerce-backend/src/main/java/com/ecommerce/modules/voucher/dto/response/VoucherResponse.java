package com.ecommerce.modules.voucher.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherResponse {
    private Long id;
    private String code;
    private String category;
    private String discountType;
    private Double discountValue;
    private Double minOrderValue;
    private Integer quantity;
    private LocalDateTime expiryDate;
    private Boolean active;
    private String image;

    // Giá xu để đổi voucher, chỉ dùng khi category = COIN_REWARD
    private Long coinCost;

    // VIP fields
    private Boolean vipOnly;
    private Boolean monthlyReset;
    private Integer monthlyQuantity;

    // FE display state
    private Boolean eligible;     // có đủ điều kiện để nhận / dùng
    private Boolean claimable;    // có thể nhận ngay
    private String lockedReason;  // lý do khóa cho user thường
}