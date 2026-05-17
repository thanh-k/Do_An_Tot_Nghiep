package com.ecommerce.modules.productCompare.repository;

import com.ecommerce.entity.ProductCompare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductCompareRepository extends JpaRepository<ProductCompare, Long> {
    List<ProductCompare> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    void deleteByUserIdAndProductId(Long userId, Long productId);

    void deleteAllByUserId(Long userId);

    long countByUserId(Long userId);
}