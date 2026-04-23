package com.ecommerce.modules.phoneprefix.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.phoneprefix.dto.request.PhonePrefixRequest;
import com.ecommerce.modules.phoneprefix.dto.response.PhonePrefixResponse;
import com.ecommerce.modules.phoneprefix.service.PhonePrefixService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PhonePrefixController {

    private final PhonePrefixService phonePrefixService;

    @GetMapping("/public/phone-prefixes")
    public ApiResponse<List<PhonePrefixResponse>> getActivePrefixes() {
        return ApiResponse.<List<PhonePrefixResponse>>builder()
                .result(phonePrefixService.getActivePrefixes())
                .build();
    }

    @GetMapping("/admin/phone-prefixes")
    public ApiResponse<List<PhonePrefixResponse>> getAllPrefixes() {
        return ApiResponse.<List<PhonePrefixResponse>>builder()
                .result(phonePrefixService.getAll())
                .build();
    }

    @PostMapping("/admin/phone-prefixes")
    public ApiResponse<PhonePrefixResponse> create(@RequestBody PhonePrefixRequest request) {
        return ApiResponse.<PhonePrefixResponse>builder()
                .message("Thêm đầu số thành công")
                .result(phonePrefixService.create(request))
                .build();
    }

    @PutMapping("/admin/phone-prefixes/{id}")
    public ApiResponse<PhonePrefixResponse> update(@PathVariable Long id, @RequestBody PhonePrefixRequest request) {
        return ApiResponse.<PhonePrefixResponse>builder()
                .message("Cập nhật đầu số thành công")
                .result(phonePrefixService.update(id, request))
                .build();
    }

    @DeleteMapping("/admin/phone-prefixes/{id}")
    public ApiResponse<String> delete(@PathVariable Long id) {
        phonePrefixService.delete(id);
        return ApiResponse.<String>builder()
                .message("Xóa đầu số thành công")
                .result("OK")
                .build();
    }
}
