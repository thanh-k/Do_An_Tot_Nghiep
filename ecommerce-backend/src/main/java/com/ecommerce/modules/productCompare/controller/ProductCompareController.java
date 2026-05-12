package com.ecommerce.modules.productCompare.controller;

import com.ecommerce.modules.productCompare.dto.request.AddCompareRequest;
import com.ecommerce.modules.productCompare.dto.response.ProductCompareResponse;
import com.ecommerce.modules.productCompare.service.ProductCompareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/user/compare")
@RequiredArgsConstructor
public class ProductCompareController {

    private final ProductCompareService compareService;

    @GetMapping
    @PreAuthorize("hasAuthority('COMPARE_PRODUCT_USE')")
    public ResponseEntity<?> getCompareList(Authentication authentication) {
        List<ProductCompareResponse> list = compareService.getUserCompareList(authentication.getName());
        return ResponseEntity.ok(Map.of("result", list));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('COMPARE_PRODUCT_USE')")
    public ResponseEntity<?> addToCompare(@Valid @RequestBody AddCompareRequest request,
            Authentication authentication) {
        compareService.addProductToCompare(authentication.getName(), request.getProductId());
        return ResponseEntity.ok(Map.of("message", "Đã thêm vào danh sách so sánh"));
    }

    @DeleteMapping("/{productId}")
    @PreAuthorize("hasAuthority('COMPARE_PRODUCT_USE')")
    public ResponseEntity<?> removeFromCompare(@PathVariable Long productId, Authentication authentication) {
        compareService.removeProductFromCompare(authentication.getName(), productId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa khỏi danh sách so sánh"));
    }

    @DeleteMapping
    @PreAuthorize("hasAuthority('COMPARE_PRODUCT_USE')")
    public ResponseEntity<?> clearCompareList(Authentication authentication) {
        compareService.clearUserCompareList(authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Đã xóa toàn bộ danh sách so sánh"));
    }
}