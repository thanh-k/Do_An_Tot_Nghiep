package com.ecommerce.modules.user.repository;

import com.ecommerce.entity.User;
import com.ecommerce.modules.role.entity.RoleName;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    @EntityGraph(attributePaths = {"addresses", "accessRoles", "accessRoles.permissions"})
    Optional<User> findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = {"addresses", "accessRoles", "accessRoles.permissions"})
    Optional<User> findByProviderId(String providerId);

    @Override
    @EntityGraph(attributePaths = {"addresses", "accessRoles", "accessRoles.permissions"})
    List<User> findAll();

    @Override
    @EntityGraph(attributePaths = {"addresses", "accessRoles", "accessRoles.permissions"})
    Optional<User> findById(Long id);

    @EntityGraph(attributePaths = {"addresses", "accessRoles", "accessRoles.permissions"})
    List<User> findByRole(RoleName role);

    @EntityGraph(attributePaths = {"addresses", "accessRoles", "accessRoles.permissions"})
    List<User> findByRoleNot(RoleName role);
}
