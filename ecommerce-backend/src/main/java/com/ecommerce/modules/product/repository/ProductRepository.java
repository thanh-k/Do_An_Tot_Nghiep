package com.ecommerce.modules.product.repository;

import com.ecommerce.entity.Product;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @EntityGraph(attributePaths = {"category", "brand", "variants", "images"})
    @Query("""
            select distinct p from Product p
            left join p.category c
            left join p.brand b
            where p.active = true
              and p.id <> :productId
              and (
                    (:categoryId is not null and c.id = :categoryId)
                 or (:brandId is not null and b.id = :brandId)
              )
            order by p.isFeatured desc, p.isNew desc, p.id desc
            """)
    List<Product> findSimilarActiveProducts(@Param("productId") Long productId,
                                            @Param("categoryId") Long categoryId,
                                            @Param("brandId") Long brandId,
                                            Pageable pageable);

    @EntityGraph(attributePaths = {"category", "brand", "variants", "images"})
    @Query("""
            select distinct p from Product p
            where p.active = true
            order by p.isFeatured desc, p.isNew desc, p.id desc
            """)
    List<Product> findTopActiveProducts(Pageable pageable);

}