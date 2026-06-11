package com.ecommerce.modules.livestream.repository;

import com.ecommerce.modules.livestream.entity.LivestreamDeal;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LivestreamDealRepository extends JpaRepository<LivestreamDeal, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"product"})
    @Query("""
            select d from LivestreamDeal d
            where d.id = :dealId
              and d.livestream.id = :livestreamId
              and d.active = true
              and d.startsAt <= :now
              and d.endsAt > :now
              and (d.quantityLimit is null or d.quantitySold < d.quantityLimit)
            """)
    Optional<LivestreamDeal> findUsableDeal(@Param("dealId") Long dealId,
                                            @Param("livestreamId") Long livestreamId,
                                            @Param("now") LocalDateTime now);

    @EntityGraph(attributePaths = {"product"})
    @Query("""
            select d from LivestreamDeal d
            where d.livestream.id = :livestreamId
            order by d.createdAt desc
            """)
    List<LivestreamDeal> findByLivestreamIdOrderByCreatedAtDesc(@Param("livestreamId") Long livestreamId);

    @EntityGraph(attributePaths = {"product"})
    @Query("""
            select d from LivestreamDeal d
            where d.livestream.id = :livestreamId
              and d.product.id = :productId
              and d.active = true
            """)
    List<LivestreamDeal> findRunningProductDeals(@Param("livestreamId") Long livestreamId,
                                                 @Param("productId") Long productId);

    @EntityGraph(attributePaths = {"product"})
    @Query("""
            select d from LivestreamDeal d
            where d.livestream.id = :livestreamId
              and d.active = true
              and d.startsAt <= :now
              and d.endsAt > :now
              and (d.quantityLimit is null or d.quantitySold < d.quantityLimit)
            order by d.createdAt desc
            """)
    List<LivestreamDeal> findActiveDeals(@Param("livestreamId") Long livestreamId,
                                         @Param("now") LocalDateTime now);

    @Modifying
    @Query("""
            update LivestreamDeal d
            set d.active = false, d.status = 'EXPIRED'
            where d.livestream.id = :livestreamId
              and d.product.id = :productId
              and d.active = true
            """)
    void deactivateActiveDealsByLivestreamIdAndProductId(@Param("livestreamId") Long livestreamId,
                                                         @Param("productId") Long productId);

}
