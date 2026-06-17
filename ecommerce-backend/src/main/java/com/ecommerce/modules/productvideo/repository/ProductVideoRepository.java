package com.ecommerce.modules.productvideo.repository;

import com.ecommerce.modules.productvideo.entity.ProductVideo;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductVideoRepository extends JpaRepository<ProductVideo, Long> {
    @EntityGraph(attributePaths = {"product", "product.brand", "product.category", "product.variants", "product.images"})
    List<ProductVideo> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"product", "product.brand", "product.category", "product.variants", "product.images"})
    Optional<ProductVideo> findById(Long id);

    @EntityGraph(attributePaths = {"product", "product.brand", "product.category", "product.variants", "product.images"})
    List<ProductVideo> findByProductIdAndActiveTrueOrderByCreatedAtDesc(Long productId);

    @EntityGraph(attributePaths = {"product", "product.brand", "product.category", "product.variants", "product.images"})
    @Query("""
            select v from ProductVideo v
            join v.product p
            left join p.brand b
            left join p.category c
            where v.active = true and (
                lower(v.title) like lower(concat('%', :keyword, '%'))
                or lower(v.description) like lower(concat('%', :keyword, '%'))
                or lower(p.name) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(b.name, '')) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(c.name, '')) like lower(concat('%', :keyword, '%'))
            )
            order by v.viewCount desc, v.createdAt desc
            """)
    List<ProductVideo> searchActiveVideos(@Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = {"product", "product.brand", "product.category", "product.variants", "product.images"})
    @Query("""
            select v from ProductVideo v
            where v.active = true and v.product.id <> :productId
              and (
                (:categoryId is not null and v.product.category.id = :categoryId)
                or (:brandId is not null and v.product.brand.id = :brandId)
              )
            order by v.viewCount desc, v.createdAt desc
            """)
    List<ProductVideo> findRelatedVideos(@Param("productId") Long productId,
                                         @Param("categoryId") Long categoryId,
                                         @Param("brandId") Long brandId,
                                         Pageable pageable);

    @EntityGraph(attributePaths = {"product", "product.brand", "product.category", "product.variants", "product.images"})
    Optional<ProductVideo> findTopByOrderByViewCountDesc();

    @EntityGraph(attributePaths = {"product", "product.brand", "product.category", "product.variants", "product.images"})
    Optional<ProductVideo> findTopByOrderByProductClickCountDesc();

    @EntityGraph(attributePaths = {"product", "product.brand", "product.category", "product.variants", "product.images"})
    Optional<ProductVideo> findTopByOrderByAddToCartCountDesc();

    @EntityGraph(attributePaths = {"product", "product.brand", "product.category", "product.variants", "product.images"})
    Optional<ProductVideo> findTopByOrderByOrderCountDesc();

    @Query("select coalesce(sum(v.viewCount), 0) from ProductVideo v")
    Long sumViewCount();
}
