package com.ecommerce.modules.behavior.entity;

import com.ecommerce.entity.Brand;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_behavior_events", indexes = {
        @Index(name = "idx_behavior_user_created", columnList = "user_id, created_at"),
        @Index(name = "idx_behavior_session_created", columnList = "session_id, created_at"),
        @Index(name = "idx_behavior_product", columnList = "product_id"),
        @Index(name = "idx_behavior_event_type", columnList = "event_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBehaviorEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private BehaviorEventType eventType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @Column(length = 255)
    private String keyword;

    @Column(name = "page_url", length = 500)
    private String pageUrl;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
