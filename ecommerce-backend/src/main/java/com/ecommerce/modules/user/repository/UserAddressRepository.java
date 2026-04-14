package com.ecommerce.modules.user.repository;

import com.ecommerce.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    List<UserAddress> findByUserIdOrderByIsDefaultDescCreatedAtDesc(Long userId);
    Optional<UserAddress> findByIdAndUserId(Long id, Long userId);
    boolean existsByPhoneAndUserIdNot(String phone, Long userId);
    Optional<UserAddress> findFirstByUserIdAndIsDefaultTrue(Long userId);
}
