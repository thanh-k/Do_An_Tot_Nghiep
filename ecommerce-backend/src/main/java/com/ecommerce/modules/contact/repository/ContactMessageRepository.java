package com.ecommerce.modules.contact.repository;

import com.ecommerce.modules.contact.entity.ContactMessage;
import com.ecommerce.modules.contact.entity.ContactMessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {

    @Query("""
            SELECT c FROM ContactMessage c
            WHERE (:status IS NULL OR c.status = :status)
              AND (
                  :keyword IS NULL OR :keyword = '' OR
                  LOWER(c.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                  LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                  c.phone LIKE CONCAT('%', :keyword, '%')
              )
            ORDER BY c.createdAt DESC
            """)
    List<ContactMessage> search(@Param("keyword") String keyword, @Param("status") ContactMessageStatus status);
}
