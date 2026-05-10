package com.ecommerce.modules.voucher.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ecommerce.entity.Voucher;
import com.ecommerce.modules.voucher.dto.response.VoucherResponse;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByCode(String code);

    List<Voucher> findByActiveTrueOrderByIdDesc();
    List<Voucher> findByCategoryIgnoreCaseAndActiveTrueOrderByIdDesc(String category);
}