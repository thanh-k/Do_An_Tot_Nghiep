package com.ecommerce.modules.product.repository;

import com.ecommerce.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    // Kiểm tra SKU đã tồn tại chưa (SKU phải là duy nhất trong kho)
    boolean existsBySku(String sku);

    // Kiểm tra SKU đã tồn tại nhưng loại trừ ID hiện tại (Dùng khi cập nhật)
    boolean existsBySkuAndIdNot(String sku, Long id);

    @Modifying
    @Query("UPDATE ProductVariant pv SET pv.stock = pv.stock - :quantity WHERE pv.id = :id AND pv.stock >= :quantity")
    int decrementStockIfAvailable(@Param("id") Long id, @Param("quantity") Integer quantity);

    @Modifying
    @Query("UPDATE ProductVariant pv SET pv.stock = pv.stock + :quantity WHERE pv.id = :id")
    int incrementStock(@Param("id") Long id, @Param("quantity") Integer quantity);
}