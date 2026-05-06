package com.ecommerce.modules.voucher.mapper;

import com.ecommerce.entity.Voucher;
import com.ecommerce.modules.voucher.dto.request.VoucherRequest;
import com.ecommerce.modules.voucher.dto.response.VoucherResponse;
import org.springframework.stereotype.Component;

@Component
public class VoucherMapper {
    public Voucher toEntity(VoucherRequest request) {
        return Voucher.builder()
                .code(request.getCode())
                .category(request.getCategory())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderValue(request.getMinOrderValue())
                .quantity(request.getQuantity())
                .expiryDate(request.getExpiryDate())
                .image(request.getImage())
                .active(true)
                .build();
    }

    public VoucherResponse toResponse(Voucher v) {
        return VoucherResponse.builder()
                .id(v.getId())
                .code(v.getCode())
                .category(v.getCategory())
                .discountType(v.getDiscountType())
                .discountValue(v.getDiscountValue())
                .minOrderValue(v.getMinOrderValue())
                .quantity(v.getQuantity())
                .expiryDate(v.getExpiryDate())
                .image(v.getImage())
                .active(v.getActive())
                .build();
    }
}