package com.ecommerce.modules.brand.repository;

import com.ecommerce.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {
    // Kiểm tra xem tên thương hiệu đã tồn tại chưa để báo lỗi
    boolean existsByName(String name);

    // Tìm thương hiệu theo Slug (dùng cho Frontend sau này)
    Optional<Brand> findBySlug(String slug);
}