package com.ecommerce.modules.behavior.entity;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_product_interests", indexes = {
        @Index(name = "idx_interest_user_score", columnList = "user_id, score"),
        @Index(name = "idx_interest_session_score", columnList = "session_id, score"),
        @Index(name = "idx_interest_product", columnList = "product_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProductInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Builder.Default
    @Column(nullable = false)
    private Double score = 0.0;

    @Builder.Default
    @Column(name = "view_count", nullable = false)
    private Long viewCount = 0L;

    @Builder.Default
    @Column(name = "cart_count", nullable = false)
    private Long cartCount = 0L;

    @Builder.Default
    @Column(name = "wishlist_count", nullable = false)
    private Long wishlistCount = 0L;

    @Builder.Default
    @Column(name = "checkout_count", nullable = false)
    private Long checkoutCount = 0L;

    @Builder.Default
    @Column(name = "purchase_count", nullable = false)
    private Long purchaseCount = 0L;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_event_type", length = 50)
    private BehaviorEventType lastEventType;

    @Column(name = "last_interacted_at")
    private LocalDateTime lastInteractedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (lastInteractedAt == null) {
            lastInteractedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
