package com.ecommerce.modules.order.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.ecommerce.entity.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(String userId);

    @Query("""
            select count(o)
            from Order o
            where o.userId = :userId
              and (o.status is null or upper(o.status) not in :finishedStatuses)
            """)
    long countUnfinishedOrdersByUserId(@Param("userId") String userId,
                                        @Param("finishedStatuses") Collection<String> finishedStatuses);

    @Query("SELECT o FROM Order o WHERE o.status = 'PENDING' AND o.paymentMethod != 'COD' AND o.createdAt < :cutoff")
    List<Order> findExpiredPendingOrders(@Param("cutoff") java.time.LocalDateTime cutoff);
}
