package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String slug; // Dùng để làm link đẹp ở Frontend, ví dụ: "dien-thoai-vong"

    @Column(columnDefinition = "TEXT")
    private String description;

    private String icon; // Lưu URL ảnh icon từ Cloudinary

    private Boolean active = true; // Để ẩn/hiện danh mục trên trang chủ

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Tự động gán thời gian khi tạo mới
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    // Tự động cập nhật thời gian khi sửa
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}