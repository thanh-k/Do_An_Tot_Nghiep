package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sku; // Mã kho định danh duy nhất

    private Double price;

    private Double compareAtPrice; // Giá gốc để gạch đi hiện giảm giá

    @Builder.Default
    private Integer stock = 0;

    @Column(columnDefinition = "TEXT")
    private String attributes; // Lưu JSON: { "color": "Black", "storage": "128GB" }

    private String image; // Ảnh riêng cho từng biến thể

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;
}