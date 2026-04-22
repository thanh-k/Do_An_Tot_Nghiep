package com.ecommerce.modules.product.repository;

import com.ecommerce.entity.Product;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // Tìm kiếm sản phẩm theo tên để check trùng
    Optional<Product> findByName(String name);

    // Tìm kiếm sản phẩm theo slug (Dùng cho trang chi tiết ở Frontend sau này)
    Optional<Product> findBySlug(String slug);

    @EntityGraph(attributePaths = {"category", "brand", "variants", "images"})
    List<Product> findAll();
}