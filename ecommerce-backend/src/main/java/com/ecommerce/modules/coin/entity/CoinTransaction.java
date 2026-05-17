package com.ecommerce.modules.coin.entity;

import com.ecommerce.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "coin_transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoinTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private CoinTask task;

    @Column(name = "change_amount", nullable = false)
    private Long changeAmount;

    @Column(name = "balance_after", nullable = false)
    private Long balanceAfter;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType;

    @Column(length = 255)
    private String note;

    @Column(name = "source_ref", length = 120)
    private String sourceRef;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}