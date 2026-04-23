package com.ecommerce.modules.role.repository;

import com.ecommerce.entity.AccessRole;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccessRoleRepository extends JpaRepository<AccessRole, Long> {
    boolean existsByCodeIgnoreCase(String code);

    @EntityGraph(attributePaths = "permissions")
    Optional<AccessRole> findByCodeIgnoreCase(String code);

    @Override
    @EntityGraph(attributePaths = "permissions")
    List<AccessRole> findAll();
}
