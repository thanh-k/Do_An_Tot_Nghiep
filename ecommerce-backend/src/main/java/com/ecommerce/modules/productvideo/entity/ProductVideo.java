package com.ecommerce.modules.productvideo.entity;

import com.ecommerce.entity.Product;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_videos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVideo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String videoUrl;

    @Column(columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Builder.Default
    private Boolean active = true;

    @Builder.Default
    private Long viewCount = 0L;

    @Builder.Default
    private Long productClickCount = 0L;

    @Builder.Default
    private Long addToCartCount = 0L;

    @Builder.Default
    private Long orderCount = 0L;

    @Builder.Default
    private Long totalWatchSeconds = 0L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (active == null) active = true;
        if (viewCount == null) viewCount = 0L;
        if (productClickCount == null) productClickCount = 0L;
        if (addToCartCount == null) addToCartCount = 0L;
        if (orderCount == null) orderCount = 0L;
        if (totalWatchSeconds == null) totalWatchSeconds = 0L;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
