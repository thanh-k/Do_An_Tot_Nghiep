package com.ecommerce.modules.behavior.repository;

import com.ecommerce.modules.behavior.entity.UserProductInterest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserProductInterestRepository extends JpaRepository<UserProductInterest, Long> {

    Optional<UserProductInterest> findFirstByUser_IdAndProduct_IdOrderByUpdatedAtDesc(Long userId, Long productId);

    Optional<UserProductInterest> findFirstBySessionIdAndProduct_IdOrderByUpdatedAtDesc(String sessionId, Long productId);

    @Query("""
            select i from UserProductInterest i
            join fetch i.product p
            left join fetch p.category
            left join fetch p.brand
            where (:userId is not null and i.user.id = :userId)
               or (:sessionId is not null and i.sessionId = :sessionId)
            order by i.score desc, i.lastInteractedAt desc
            """)
    List<UserProductInterest> findTopInterests(@Param("userId") Long userId,
                                               @Param("sessionId") String sessionId,
                                               Pageable pageable);

    @EntityGraph(attributePaths = {"user", "product", "product.category", "product.brand"})
    @Query("""
            select i from UserProductInterest i
            left join i.user u
            join i.product p
            left join p.category c
            left join p.brand b
            where (:keyword is null or lower(coalesce(i.sessionId, '')) like lower(concat('%', :keyword, '%')))
              and (:userKeyword is null or lower(coalesce(u.fullName, '')) like lower(concat('%', :userKeyword, '%'))
                   or lower(coalesce(u.email, '')) like lower(concat('%', :userKeyword, '%')))
              and (:productKeyword is null or lower(coalesce(p.name, '')) like lower(concat('%', :productKeyword, '%')))
            order by i.score desc, i.lastInteractedAt desc
            """)
    List<UserProductInterest> searchAdminInterests(@Param("keyword") String keyword,
                                                   @Param("userKeyword") String userKeyword,
                                                   @Param("productKeyword") String productKeyword,
                                                   Pageable pageable);
    @Query("""
            select p.id, p.name, p.thumbnail, c.name, b.name, count(i), coalesce(sum(i.score), 0)
            from UserProductInterest i
            join i.product p
            left join p.category c
            left join p.brand b
            where (:fromDate is null or i.lastInteractedAt >= :fromDate)
              and (:toDate is null or i.lastInteractedAt < :toDate)
            group by p.id, p.name, p.thumbnail, c.name, b.name
            order by coalesce(sum(i.score), 0) desc, count(i) desc
            """)
    List<Object[]> findTopInterestedProducts(@Param("fromDate") LocalDateTime fromDate,
                                             @Param("toDate") LocalDateTime toDate,
                                             Pageable pageable);

    void deleteByUserId(Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update UserProductInterest i
            set i.score = i.score * :decayRate
            where i.lastInteractedAt < :inactiveBefore
              and i.score > 0
            """)
    int decayInactiveScores(@Param("inactiveBefore") LocalDateTime inactiveBefore,
                            @Param("decayRate") double decayRate);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            delete from UserProductInterest i
            where i.score < :minimumScore
               or i.lastInteractedAt < :expiredBefore
            """)
    int deleteExpiredOrLowScoreInterests(@Param("minimumScore") double minimumScore,
                                         @Param("expiredBefore") LocalDateTime expiredBefore);
}

