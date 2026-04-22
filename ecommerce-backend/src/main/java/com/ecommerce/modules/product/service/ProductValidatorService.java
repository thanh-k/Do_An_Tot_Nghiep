package com.ecommerce.modules.product.service;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.modules.product.dto.request.ProductRequest;
import com.ecommerce.modules.product.dto.request.VariantRequest;
import com.ecommerce.modules.product.repository.ProductRepository;
import com.ecommerce.modules.product.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProductValidatorService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    public void validate(ProductRequest request, Long currentId) {
        // 1. Kiểm tra các form bắt buộc không được bỏ trống
        if (request.getName() == null || request.getName().trim().isEmpty() ||
                request.getCategoryId() == null || request.getBrandId() == null ||
                request.getThumbnail() == null || request.getThumbnail().trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PRODUCT_DATA);
        }

        // 2. Kiểm tra tên sản phẩm bị trùng
        productRepository.findByName(request.getName()).ifPresent(existingProduct -> {
            if (currentId == null || !existingProduct.getId().equals(currentId)) {
                throw new AppException(ErrorCode.PRODUCT_EXISTED);
            }
        });

        // 3. Kiểm tra SKU của từng Variant gửi lên
        if (request.getVariants() != null) {
            for (VariantRequest variant : request.getVariants()) {
                boolean skuExists;
                if (currentId == null) {
                    // Nếu tạo mới, check xem SKU đã có trong DB chưa
                    skuExists = variantRepository.existsBySku(variant.getSku());
                } else {
                    // Nếu cập nhật, check SKU đã có ở sản phẩm KHÁC chưa
                    // (Lưu ý: Logic này cần ID của Variant, ở đây mình check đơn giản trước)
                    skuExists = variantRepository.existsBySku(variant.getSku());
                }

                if (skuExists && currentId == null) {
                    throw new AppException(ErrorCode.SKU_EXISTED);
                }
            }
        }

        // 4. Kiểm tra logic giá bán, tồn kho (Không âm, Từ 1 trở lên)
        if (request.getVariants() != null) {
            for (VariantRequest v : request.getVariants()) {
                if (v.getPrice() == null || v.getPrice() < 1 || v.getStock() == null || v.getStock() < 0) {
                    throw new AppException(ErrorCode.INVALID_VARIANT_NUMBER);
                }
                if (v.getPrice() != null && v.getCompareAtPrice() != null) {
                    if (v.getPrice() > v.getCompareAtPrice()) {
                        throw new AppException(ErrorCode.INVALID_VARIANT_PRICE);
                    }
                }
            }
        }
    }
}