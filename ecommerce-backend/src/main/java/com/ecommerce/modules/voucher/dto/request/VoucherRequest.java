package com.ecommerce.modules.voucher.dto.request;


import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder

public class VoucherRequest {
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