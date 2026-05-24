package com.ecommerce.modules.behavior.repository;

import com.ecommerce.modules.behavior.dto.admin.EventCountResponse;
import com.ecommerce.modules.behavior.entity.BehaviorEventType;
import com.ecommerce.modules.behavior.entity.UserBehaviorEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface UserBehaviorEventRepository extends JpaRepository<UserBehaviorEvent, Long> {

    long countByEventType(BehaviorEventType eventType);

    @Query("""
            select e.eventType as eventType, count(e) as total
            from UserBehaviorEvent e
            group by e.eventType
            """)
    List<EventCountResponse> countGroupByEventType();

    @EntityGraph(attributePaths = {"user", "product", "product.category", "product.brand", "category", "brand"})
    @Query("""
            select e from UserBehaviorEvent e
            left join e.user u
            left join e.product p
            left join e.category c
            left join e.brand b
            where (:eventType is null or e.eventType = :eventType)
              and (:keyword is null or lower(e.keyword) like lower(concat('%', :keyword, '%'))
                   or lower(e.pageUrl) like lower(concat('%', :keyword, '%'))
                   or lower(coalesce(e.sessionId, '')) like lower(concat('%', :keyword, '%')))
              and (:userKeyword is null or lower(coalesce(u.fullName, '')) like lower(concat('%', :userKeyword, '%'))
                   or lower(coalesce(u.email, '')) like lower(concat('%', :userKeyword, '%')))
              and (:productKeyword is null or lower(coalesce(p.name, '')) like lower(concat('%', :productKeyword, '%')))
              and (:fromDate is null or e.createdAt >= :fromDate)
              and (:toDate is null or e.createdAt < :toDate)
            order by e.createdAt desc
            """)
    List<UserBehaviorEvent> searchAdminEvents(@Param("eventType") BehaviorEventType eventType,
                                              @Param("keyword") String keyword,
                                              @Param("userKeyword") String userKeyword,
                                              @Param("productKeyword") String productKeyword,
                                              @Param("fromDate") LocalDateTime fromDate,
                                              @Param("toDate") LocalDateTime toDate,
                                              Pageable pageable);
    void deleteByUserId(Long userId);
}
