package com.ecommerce.modules.voucher.service;

import java.util.List;
import java.util.Map;

import com.ecommerce.modules.voucher.dto.request.VoucherRequest;
import com.ecommerce.modules.voucher.dto.response.VoucherResponse;

public interface VoucherService {
    VoucherResponse createVoucher(VoucherRequest request);

    List<VoucherResponse> getAllVouchers();

    List<VoucherResponse> getMyVouchers();

    VoucherResponse updateVoucher(Long id, VoucherRequest request);

    void deleteVoucher(Long id);

    Double calculateDiscount(String code, Double orderTotal);

    void decrementQuantity(String code);
    
    void decrementQuantity(String code, String userId);

    Map<String, Object> deleteVouchers(List<Long> ids);

    void incrementQuantity(String code, String userId);

    VoucherResponse claimVoucher(String code);
}