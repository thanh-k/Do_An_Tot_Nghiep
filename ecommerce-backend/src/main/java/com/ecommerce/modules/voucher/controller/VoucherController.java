package com.ecommerce.modules.voucher.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.voucher.dto.request.VoucherRequest;
import com.ecommerce.modules.voucher.dto.response.VoucherResponse;
import com.ecommerce.modules.voucher.service.VoucherService;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
public class VoucherController {
    private final VoucherService voucherService;

    @PostMapping
    public ApiResponse<VoucherResponse> create(@RequestBody VoucherRequest request) {
        return ApiResponse.<VoucherResponse>builder().result(voucherService.createVoucher(request)).build();
    }

    @GetMapping
    public ApiResponse<List<VoucherResponse>> getAll() {
        return ApiResponse.<List<VoucherResponse>>builder().result(voucherService.getAllVouchers()).build();
    }

    @PutMapping("/{id}")
    public ApiResponse<VoucherResponse> update(@PathVariable Long id, @RequestBody VoucherRequest request) {
        return ApiResponse.<VoucherResponse>builder().result(voucherService.updateVoucher(id, request)).build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/check")
    public ApiResponse<Double> checkVoucher(@RequestParam String code, @RequestParam Double orderTotal) {
        return ApiResponse.<Double>builder()
                .result(voucherService.calculateDiscount(code, orderTotal))
                .build();
    }
}