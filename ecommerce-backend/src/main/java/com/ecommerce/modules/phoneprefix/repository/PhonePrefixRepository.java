package com.ecommerce.modules.phoneprefix.repository;

import com.ecommerce.entity.PhonePrefix;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PhonePrefixRepository extends JpaRepository<PhonePrefix, Long> {
    boolean existsByPrefix(String prefix);

    boolean existsByPrefixAndIdNot(String prefix, Long id);

    Optional<PhonePrefix> findByPrefix(String prefix);

    List<PhonePrefix> findAllByActiveTrueOrderByPrefixAsc();
}
