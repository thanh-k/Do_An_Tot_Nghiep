package com.ecommerce.modules.voucher.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ecommerce.entity.Voucher;

import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByCode(String code);
}