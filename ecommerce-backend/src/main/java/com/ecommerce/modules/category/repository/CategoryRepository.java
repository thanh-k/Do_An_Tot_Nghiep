package com.ecommerce.modules.category.repository;

import com.ecommerce.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // Khi"extends" (kế thừa) từ JpaRepository<Category, Long>, Spring Data JPA
    // sẽ tự động cung cấp các hàm như: save(), findAll(), findById(),
    // deleteById()... không cần phải viết code cho những hàm này nữa. Rất tiện
    // lợi!

    // Kiểm tra xem tên danh mục đã tồn tại chưa (để tránh trùng lặp)
    boolean existsByName(String name);

    // Tìm danh mục theo Slug (phục vụ cho việc hiển thị ở Frontend sau này)
    Optional<Category> findBySlug(String slug);

    // Tìm danh mục theo ID và trạng thái Active
    Optional<Category> findByIdAndActiveTrue(Long id);
}