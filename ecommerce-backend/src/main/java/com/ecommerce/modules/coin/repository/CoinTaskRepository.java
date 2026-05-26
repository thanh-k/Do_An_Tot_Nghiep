package com.ecommerce.modules.coin.repository;

import com.ecommerce.modules.coin.entity.CoinTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CoinTaskRepository extends JpaRepository<CoinTask, Long> {
    Optional<CoinTask> findByTaskCodeIgnoreCase(String taskCode);
    boolean existsByTaskCodeIgnoreCase(String taskCode);
    boolean existsByTaskCodeIgnoreCaseAndIdNot(String taskCode, Long id);
    List<CoinTask> findByIsActiveTrueOrderByCategoryAscSortOrderAscIdAsc();
    List<CoinTask> findAllByOrderByCategoryAscSortOrderAscIdAsc();
    Optional<CoinTask> findFirstByCategoryAndIsActiveTrueOrderBySortOrderAscIdAsc(com.ecommerce.modules.coin.entity.CoinTaskCategory category);
}