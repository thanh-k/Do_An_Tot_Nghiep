package com.ecommerce.modules.livestream.entity;

import com.ecommerce.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "livestreams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Livestream {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private LivestreamStatus status = LivestreamStatus.DRAFT;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "viewer_count")
    @Builder.Default
    private Long viewerCount = 0L;

    @Column(name = "total_views")
    @Builder.Default
    private Long totalViews = 0L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "livestream", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LivestreamProduct> products = new ArrayList<>();

    @OneToMany(mappedBy = "livestream", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LivestreamDeal> deals = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
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
