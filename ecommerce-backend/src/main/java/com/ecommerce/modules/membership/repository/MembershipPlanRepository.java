package com.ecommerce.modules.membership.repository;

import com.ecommerce.modules.membership.entity.MembershipPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long> {
    List<MembershipPlan> findByActiveTrueOrderByPriceAsc();
    List<MembershipPlan> findAllByOrderByCreatedAtDesc();
    Optional<MembershipPlan> findByCodeIgnoreCase(String code);
}
