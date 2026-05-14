package com.ecommerce.modules.announcement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "announcement_bars")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementBar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "background_color", length = 30)
    private String backgroundColor;

    @Column(name = "text_color", length = 30)
    private String textColor;

    @Column(name = "speed_seconds")
    private Integer speedSeconds;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        applyDefaults();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
        applyDefaults();
    }

    private void applyDefaults() {
        if (active == null) active = true;
        if (backgroundColor == null || backgroundColor.isBlank()) backgroundColor = "#0f172a";
        if (textColor == null || textColor.isBlank()) textColor = "#ffffff";
        if (speedSeconds == null || speedSeconds <= 0) speedSeconds = 18;
        if (sortOrder == null) sortOrder = 1;
    }
}
