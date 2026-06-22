package com.ecommerce.modules.product.repository;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    // Hàm phụ trợ giúp chuyển "Điện thoại" thành "dien thoai"
    private static String stripAccents(String s) {
        if (s == null)
            return null;
        String normalized = Normalizer.normalize(s, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "").toLowerCase();
    }

    public static Specification<Product> filterProducts(
            String keyword,
            Long categoryId,
            List<String> brands,
            Double minPrice,
            Double maxPrice,
            Boolean inStock) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Tìm kiếm theo từ khoá (Khớp với tên sản phẩm hoặc slug)
            if (keyword != null && !keyword.trim().isEmpty()) {
                String exactPattern = "%" + keyword.toLowerCase() + "%"; // Mẫu nguyên bản (để tìm chính xác)

                String cleanKeyword = stripAccents(keyword.trim());
                String smartPattern = "%" + cleanKeyword.replace(" ", "%") + "%"; // VD: "dien thoai" -> "%dien%thoai%"

                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), exactPattern),
                        cb.like(cb.lower(root.get("slug")), smartPattern),
                        cb.like(cb.lower(root.join("category", JoinType.LEFT).get("name")), exactPattern),
                        cb.like(cb.lower(root.join("brand", JoinType.LEFT).get("name")), exactPattern),
                        // Bổ sung tìm kiếm vào cột slug của bảng Category và Brand để bắt trường hợp gõ
                        // tiếng Việt không dấu (VD: "dien thoai")
                        cb.like(cb.lower(root.join("category", JoinType.LEFT).get("slug")), smartPattern),
                        cb.like(cb.lower(root.join("brand", JoinType.LEFT).get("slug")), smartPattern)));

                query.distinct(true); // Đảm bảo không trả về sản phẩm trùng lặp khi JOIN
            }

            // 2. Lọc theo Category
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            // 3. Lọc theo Brands (Thương hiệu)
            if (brands != null && !brands.isEmpty()) {
                predicates.add(root.join("brand", JoinType.LEFT).get("name").in(brands));
            }

            // 4. Lọc theo Giá và Tồn kho (Cần JOIN sang bảng ProductVariant)
            if (minPrice != null || maxPrice != null || Boolean.TRUE.equals(inStock)) {
                Join<Product, ProductVariant> variantJoin = root.join("variants", JoinType.LEFT);

                if (minPrice != null) {
                    predicates.add(cb.greaterThanOrEqualTo(variantJoin.get("price"), minPrice));
                }
                if (maxPrice != null) {
                    predicates.add(cb.lessThanOrEqualTo(variantJoin.get("price"), maxPrice));
                }
                if (Boolean.TRUE.equals(inStock)) {
                    predicates.add(cb.greaterThan(variantJoin.get("stock"), 0));
                }

                // Tránh việc trả về các bản ghi Product trùng lặp do JOIN với nhiều Variant
                query.distinct(true);
            }

            // Trả về câu lệnh AND tất cả điều kiện
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
