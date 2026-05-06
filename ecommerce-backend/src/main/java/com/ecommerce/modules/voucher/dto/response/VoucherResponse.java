package com.ecommerce.modules.voucher.dto.response;

import lombok.*;
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
}