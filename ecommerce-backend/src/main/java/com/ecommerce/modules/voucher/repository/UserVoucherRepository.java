package com.ecommerce.modules.voucher.repository;

import com.ecommerce.entity.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;
import java.util.Optional;



public interface UserVoucherRepository extends JpaRepository<UserVoucher, Long> {
    Optional<UserVoucher> findByUserIdAndVoucherId(Long userId, Long voucherId);

    List<UserVoucher> findByUserIdAndActiveTrue(Long userId);

    List<UserVoucher> findByUserId(Long userId);

    void deleteByUserIdAndVoucherId(Long userId, Long voucherId);

    void deleteByUserId(Long userId);

    // Lấy tất cả user vouchers của 1 voucher cụ thể để dọn dẹp khi xóa
    List<UserVoucher> findByVoucherId(Long voucherId);

    // Kiểm tra xem có user voucher nào của mã này vẫn còn hiệu lực và chưa dùng hết
    // hay không
    boolean existsByVoucherIdAndValidUntilAfterAndRemainingQuantityGreaterThan(Long voucherId,
            java.time.LocalDateTime now, Integer remainingQuantity);

    void deleteAllByVoucherId(Long voucherId);

    @Modifying
    @Query("UPDATE UserVoucher uv SET uv.remainingQuantity = uv.remainingQuantity - 1 WHERE uv.user.id = :userId AND uv.voucher.id = :voucherId AND uv.remainingQuantity > 0")
    int decrementQuantityIfAvailable(@Param("userId") Long userId, @Param("voucherId") Long voucherId);

    @Modifying
    @Query("UPDATE UserVoucher uv SET uv.remainingQuantity = uv.remainingQuantity + 1 WHERE uv.user.id = :userId AND uv.voucher.id = :voucherId")
    int incrementQuantity(@Param("userId") Long userId, @Param("voucherId") Long voucherId);

    @Modifying
    @Query("UPDATE UserVoucher uv SET uv.active = :active, uv.remainingQuantity = :quantity WHERE uv.voucher.id = :voucherId")
    void updateByVoucherId(@Param("voucherId") Long voucherId, @Param("active") Boolean active,
            @Param("quantity") Integer quantity);

    @Modifying
    @Query("DELETE FROM UserVoucher uv WHERE uv.voucher.id = :voucherId")
    void deleteByVoucherId(@Param("voucherId") Long voucherId);
}
