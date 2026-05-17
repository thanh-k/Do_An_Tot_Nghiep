package com.ecommerce.modules.coin.entity;

import com.ecommerce.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_coin_wallets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCoinWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @Column(nullable = false)
    private Long balance = 0L;

    @Builder.Default
    @Column(name = "total_earned", nullable = false)
    private Long totalEarned = 0L;

    @Builder.Default
    @Column(name = "total_spent", nullable = false)
    private Long totalSpent = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}