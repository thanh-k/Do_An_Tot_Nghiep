package com.ecommerce.modules.product.repository;

import com.ecommerce.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    // Kiểm tra SKU đã tồn tại chưa (SKU phải là duy nhất trong kho)
    boolean existsBySku(String sku);

    // Kiểm tra SKU đã tồn tại nhưng loại trừ ID hiện tại (Dùng khi cập nhật)
    boolean existsBySkuAndIdNot(String sku, Long id);
}