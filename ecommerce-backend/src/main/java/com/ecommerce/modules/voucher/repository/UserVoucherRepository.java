package com.ecommerce.modules.voucher.repository;

import com.ecommerce.entity.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserVoucherRepository extends JpaRepository<UserVoucher, Long> {
    Optional<UserVoucher> findByUserIdAndVoucherId(Long userId, Long voucherId);
    List<UserVoucher> findByUserIdAndActiveTrue(Long userId);
    List<UserVoucher> findByUserId(Long userId);
    void deleteByUserIdAndVoucherId(Long userId, Long voucherId);
    void deleteByUserId(Long userId);
}
