package com.ecommerce.modules.dashboard.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardResponse {
    private Totals totals;
    private List<RevenuePoint> revenueTrend;
    private List<StatusSlice> orderStatusBreakdown;
    private List<CategorySlice> categoryBreakdown;
    private List<ProductRank> topSellingProducts;
    private List<ProductRank> topViewedProducts;
    private List<KeywordRank> topSearchKeywords;
    private List<LivestreamItem> recentLivestreams;
    private List<VideoItem> topProductVideos;
    private List<LowStockProduct> lowStockProducts;
    private List<RecentOrder> recentOrders;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Totals {
        private long products;
        private long categories;
        private long users;
        private long orders;
        private long livestreams;
        private long productVideos;
        private double revenue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenuePoint {
        private LocalDate date;
        private String label;
        private double revenue;
        private long orders;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StatusSlice {
        private String status;
        private long count;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategorySlice {
        private Long id;
        private String name;
        private long totalProducts;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductRank {
        private Long id;
        private String name;
        private String thumbnail;
        private long quantity;
        private long viewCount;
        private double revenue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KeywordRank {
        private String keyword;
        private long count;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LivestreamItem {
        private Long id;
        private String title;
        private String status;
        private long viewerCount;
        private long totalViews;
        private LocalDateTime startedAt;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VideoItem {
        private Long id;
        private String title;
        private String thumbnailUrl;
        private String productName;
        private long viewCount;
        private long addToCartCount;
        private long orderCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LowStockProduct {
        private Long id;
        private String name;
        private String thumbnail;
        private int stock;
        private double price;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentOrder {
        private Long id;
        private String code;
        private String customerName;
        private String customerEmail;
        private String status;
        private double total;
        private LocalDateTime createdAt;
    }
}
