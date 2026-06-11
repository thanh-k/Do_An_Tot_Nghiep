package com.ecommerce.modules.livestream.repository;

import com.ecommerce.modules.livestream.entity.LivestreamProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LivestreamProductRepository extends JpaRepository<LivestreamProduct, Long> {
    Optional<LivestreamProduct> findByLivestreamIdAndProductId(Long livestreamId, Long productId);
    List<LivestreamProduct> findByLivestreamId(Long livestreamId);
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM LivestreamProduct lp WHERE lp.livestream.id = :livestreamId AND lp.product.id = :productId")
    int deleteByLivestreamIdAndProductId(@Param("livestreamId") Long livestreamId, @Param("productId") Long productId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE LivestreamProduct lp SET lp.pinned = false WHERE lp.livestream.id = :livestreamId")
    int unpinAllByLivestreamId(@Param("livestreamId") Long livestreamId);
}
