package com.ecommerce.modules.news.repository;

import com.ecommerce.modules.news.entity.NewsTopic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NewsTopicRepository extends JpaRepository<NewsTopic, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    boolean existsBySlugIgnoreCase(String slug);
    List<NewsTopic> findAllByOrderByDisplayOrderAscNameAsc();
    List<NewsTopic> findAllByActiveTrueOrderByDisplayOrderAscNameAsc();
    Optional<NewsTopic> findBySlugIgnoreCase(String slug);
}
