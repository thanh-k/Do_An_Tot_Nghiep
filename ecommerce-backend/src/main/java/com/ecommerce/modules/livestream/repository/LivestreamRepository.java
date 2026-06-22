package com.ecommerce.modules.livestream.repository;

import com.ecommerce.modules.livestream.entity.Livestream;
import com.ecommerce.modules.livestream.entity.LivestreamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LivestreamRepository extends JpaRepository<Livestream, Long> {
    List<Livestream> findAllByOrderByCreatedAtDesc();
    List<Livestream> findByStatusOrderByStartedAtDesc(LivestreamStatus status);

    @Query("select l from Livestream l where l.id = :id")
    Optional<Livestream> findWithProductsById(@Param("id") Long id);
}
