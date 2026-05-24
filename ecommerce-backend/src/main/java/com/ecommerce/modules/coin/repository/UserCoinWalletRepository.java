package com.ecommerce.modules.coin.repository;

import com.ecommerce.modules.coin.entity.UserCoinWallet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserCoinWalletRepository extends JpaRepository<UserCoinWallet, Long> {
    Optional<UserCoinWallet> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}