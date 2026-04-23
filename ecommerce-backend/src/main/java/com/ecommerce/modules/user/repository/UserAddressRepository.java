package com.ecommerce.modules.user.repository;

import com.ecommerce.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {

    List<UserAddress> findByUser_IdOrderByIsDefaultDescCreatedAtDesc(Long userId);

    Optional<UserAddress> findByIdAndUser_Id(Long id, Long userId);

    boolean existsByPhoneAndUser_IdNot(String phone, Long userId);

    Optional<UserAddress> findFirstByUser_IdAndIsDefaultTrue(Long userId);

    boolean existsByUser_Id(Long userId);
}