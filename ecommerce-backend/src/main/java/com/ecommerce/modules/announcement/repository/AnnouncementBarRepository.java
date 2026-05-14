package com.ecommerce.modules.announcement.repository;

import com.ecommerce.modules.announcement.entity.AnnouncementBar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnnouncementBarRepository extends JpaRepository<AnnouncementBar, Long> {
    List<AnnouncementBar> findAllByOrderBySortOrderAscIdDesc();
    Optional<AnnouncementBar> findFirstByActiveTrueOrderBySortOrderAscIdDesc();
}
