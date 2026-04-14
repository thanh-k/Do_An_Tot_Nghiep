package com.ecommerce.modules.user.repository;

import com.ecommerce.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    @EntityGraph(attributePaths = "addresses")
    Optional<User> findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = "addresses")
    Optional<User> findByProviderId(String providerId);

    @Override
    @EntityGraph(attributePaths = "addresses")
    List<User> findAll();

    @Override
    @EntityGraph(attributePaths = "addresses")
    Optional<User> findById(Long id);
}