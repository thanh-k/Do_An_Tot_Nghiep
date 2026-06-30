package com.ecommerce.modules.membership.repository;

import com.ecommerce.modules.membership.entity.MembershipPaymentStatus;
import com.ecommerce.modules.membership.entity.MembershipSubscription;
import com.ecommerce.modules.membership.entity.MembershipSubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MembershipSubscriptionRepository extends JpaRepository<MembershipSubscription, Long> {
    Optional<MembershipSubscription> findFirstByUserIdAndStatusOrderByEndedAtDesc(Long userId, MembershipSubscriptionStatus status);
    Optional<MembershipSubscription> findFirstByUserIdAndStatusAndPaymentStatusOrderByEndedAtDesc(
            Long userId,
            MembershipSubscriptionStatus status,
            MembershipPaymentStatus paymentStatus
    );
    List<MembershipSubscription> findByUserIdAndStatus(Long userId, MembershipSubscriptionStatus status);
    List<MembershipSubscription> findByUserIdAndStatusAndPaymentStatus(
            Long userId,
            MembershipSubscriptionStatus status,
            MembershipPaymentStatus paymentStatus
    );
    List<MembershipSubscription> findByUserIdAndPaymentStatusOrderByCreatedAtDesc(Long userId, MembershipPaymentStatus paymentStatus);
    List<MembershipSubscription> findByStatusAndPaymentStatusAndEndedAtBetween(
            MembershipSubscriptionStatus status,
            MembershipPaymentStatus paymentStatus,
            LocalDateTime start,
            LocalDateTime end
    );
    Optional<MembershipSubscription> findTopByUserIdOrderByCreatedAtDesc(Long userId);
    long countByPlanId(Long planId);
}
