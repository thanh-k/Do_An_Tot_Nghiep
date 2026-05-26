package com.ecommerce.modules.accountcancellation.repository;

import com.ecommerce.modules.accountcancellation.entity.AccountCancellationRequest;
import com.ecommerce.modules.accountcancellation.entity.AccountCancellationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountCancellationRequestRepository extends JpaRepository<AccountCancellationRequest, Long> {
    boolean existsByUserIdAndStatus(Long userId, AccountCancellationStatus status);

    @EntityGraph(attributePaths = {"user", "user.addresses", "processedBy"})
    List<AccountCancellationRequest> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"user", "user.addresses", "processedBy"})
    Optional<AccountCancellationRequest> findWithUserById(Long id);
}
