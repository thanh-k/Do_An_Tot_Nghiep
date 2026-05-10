package com.ecommerce.modules.review.repository;

import com.ecommerce.entity.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findByProductIdOrderByCreatedAtDesc(Long productId);
    List<ProductReview> findByProductIdAndIsVisibleTrueOrderByCreatedAtDesc(Long productId);
    Optional<ProductReview> findByUserIdAndProductId(Long userId, Long productId);
    boolean existsByUserIdAndProductId(Long userId, Long productId);
    long countByProductId(Long productId);
    long countByProductIdAndIsVisibleTrue(Long productId);
}
