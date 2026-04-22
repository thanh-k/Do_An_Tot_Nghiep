package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String shortDescription;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    private String thumbnail;

    @Column(columnDefinition = "TEXT")
    private String specifications; // Lưu chuỗi JSON các thông số kỹ thuật

    @Builder.Default
    private Boolean isFeatured = false;

    @Builder.Default
    private Boolean isNew = true;

    @Builder.Default
    private Boolean isSale = false;

    @Builder.Default
    private Boolean active = true;

    // QUAN HỆ
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    // Đổi List thành Set
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<ProductVariant> variants = new HashSet<>(); // Đổi ArrayList thành HashSet

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<ProductImage> images = new HashSet<>(); // Đổi ArrayList thành HashSet

    // TIME TRACKING (Giống Brand & Category của ní)
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}