package com.ecommerce.modules.voucher.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ecommerce.entity.Voucher;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByCode(String code);

    List<Voucher> findByActiveTrueOrderByIdDesc();
    List<Voucher> findByCategoryIgnoreCaseAndActiveTrueOrderByIdDesc(String category);

    @Modifying
    @Query("UPDATE Voucher v SET v.quantity = v.quantity - 1 WHERE v.code = :code AND v.quantity > 0")
    int decrementQuantityIfAvailable(@Param("code") String code);

    @Modifying
    @Query("UPDATE Voucher v SET v.quantity = v.quantity + 1 WHERE v.code = :code")
    int incrementQuantity(@Param("code") String code);
}