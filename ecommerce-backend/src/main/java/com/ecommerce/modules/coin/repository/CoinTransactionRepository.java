package com.ecommerce.modules.coin.repository;

import com.ecommerce.modules.coin.entity.CoinTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface CoinTransactionRepository extends JpaRepository<CoinTransaction, Long> {

    @Query("select coalesce(sum(case when t.changeAmount > 0 then t.changeAmount else 0 end), 0) " +
           "from CoinTransaction t where t.user.id = :userId and t.createdAt >= :start and t.createdAt < :end")
    Long sumPositiveAmountByUserIdBetween(Long userId, LocalDateTime start, LocalDateTime end);

    boolean existsByUserIdAndTaskTaskCodeIgnoreCaseAndSourceRef(Long userId, String taskCode, String sourceRef);
    void deleteByUserId(Long userId);
}
