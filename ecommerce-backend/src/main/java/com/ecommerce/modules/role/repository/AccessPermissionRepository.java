package com.ecommerce.modules.role.repository;

import com.ecommerce.entity.AccessPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccessPermissionRepository extends JpaRepository<AccessPermission, Long> {
    Optional<AccessPermission> findByCode(String code);
    List<AccessPermission> findByModuleOrderByCodeAsc(String module);
}
