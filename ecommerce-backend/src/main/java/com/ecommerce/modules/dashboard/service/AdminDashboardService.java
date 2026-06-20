package com.ecommerce.modules.dashboard.service;

import com.ecommerce.entity.*;
import com.ecommerce.modules.behavior.entity.BehaviorEventType;
import com.ecommerce.modules.behavior.entity.UserBehaviorEvent;
import com.ecommerce.modules.behavior.repository.UserBehaviorEventRepository;
import com.ecommerce.modules.category.repository.CategoryRepository;
import com.ecommerce.modules.dashboard.dto.AdminDashboardResponse;
import com.ecommerce.modules.livestream.repository.LivestreamRepository;
import com.ecommerce.modules.order.repository.OrderRepository;
import com.ecommerce.modules.product.repository.ProductRepository;
import com.ecommerce.modules.productvideo.repository.ProductVideoRepository;
import com.ecommerce.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    private static final Set<String> REVENUE_STATUSES = Set.of("PAID", "SHIPPING", "COMPLETED", "DELIVERED", "SUCCESS");
    private static final DateTimeFormatter DAY_FORMATTER = DateTimeFormatter.ofPattern("dd/MM");

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final LivestreamRepository livestreamRepository;
    private final ProductVideoRepository productVideoRepository;
    private final UserBehaviorEventRepository behaviorEventRepository;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        List<Product> products = productRepository.findAll();
        List<Category> categories = categoryRepository.findAll();
        List<User> users = userRepository.findAll();
        List<Order> orders = orderRepository.findAll();
        List<UserBehaviorEvent> behaviorEvents = safeList(behaviorEventRepository.findAll());

        double revenue = orders.stream()
                .filter(this::isRevenueOrder)
                .mapToDouble(order -> safeDouble(order.getTotalAmount()))
                .sum();

        return AdminDashboardResponse.builder()
                .totals(AdminDashboardResponse.Totals.builder()
                        .products(products.size())
                        .categories(categories.size())
                        .users(users.size())
                        .orders(orders.size())
                        .livestreams(livestreamRepository.count())
                        .productVideos(productVideoRepository.count())
                        .revenue(revenue)
                        .build())
                .revenueTrend(buildRevenueTrend(orders))
                .orderStatusBreakdown(buildOrderStatusBreakdown(orders))
                .categoryBreakdown(buildCategoryBreakdown(categories, products))
                .topSellingProducts(buildTopSellingProducts(orders))
                .topViewedProducts(buildTopViewedProducts(behaviorEvents))
                .topSearchKeywords(buildTopSearchKeywords(behaviorEvents))
                .recentLivestreams(buildRecentLivestreams())
                .topProductVideos(buildTopProductVideos())
                .lowStockProducts(buildLowStockProducts(products))
                .recentOrders(buildRecentOrders(orders, users))
                .build();
    }

    private List<AdminDashboardResponse.RevenuePoint> buildRevenueTrend(List<Order> orders) {
        LocalDate today = LocalDate.now();
        List<AdminDashboardResponse.RevenuePoint> points = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            List<Order> ordersInDay = orders.stream()
                    .filter(order -> order.getCreatedAt() != null)
                    .filter(order -> order.getCreatedAt().toLocalDate().equals(date))
                    .filter(this::isRevenueOrder)
                    .toList();
            points.add(AdminDashboardResponse.RevenuePoint.builder()
                    .date(date)
                    .label(date.format(DAY_FORMATTER))
                    .orders(ordersInDay.size())
                    .revenue(ordersInDay.stream().mapToDouble(order -> safeDouble(order.getTotalAmount())).sum())
                    .build());
        }
        return points;
    }

    private List<AdminDashboardResponse.StatusSlice> buildOrderStatusBreakdown(List<Order> orders) {
        Map<String, Long> map = orders.stream()
                .collect(Collectors.groupingBy(order -> normalizeStatus(order.getStatus()), LinkedHashMap::new, Collectors.counting()));
        return map.entrySet().stream()
                .map(entry -> AdminDashboardResponse.StatusSlice.builder()
                        .status(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .toList();
    }

    private List<AdminDashboardResponse.CategorySlice> buildCategoryBreakdown(List<Category> categories, List<Product> products) {
        Map<Long, Long> productCountByCategory = products.stream()
                .filter(product -> product.getCategory() != null && product.getCategory().getId() != null)
                .collect(Collectors.groupingBy(product -> product.getCategory().getId(), Collectors.counting()));

        return categories.stream()
                .map(category -> AdminDashboardResponse.CategorySlice.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .totalProducts(productCountByCategory.getOrDefault(category.getId(), 0L))
                        .build())
                .sorted(Comparator.comparing(AdminDashboardResponse.CategorySlice::getTotalProducts).reversed())
                .limit(6)
                .toList();
    }

    private List<AdminDashboardResponse.ProductRank> buildTopSellingProducts(List<Order> orders) {
        Map<Long, ProductSaleAccumulator> map = new HashMap<>();
        orders.stream()
                .filter(this::isRevenueOrder)
                .filter(order -> order.getOrderDetails() != null)
                .flatMap(order -> order.getOrderDetails().stream())
                .filter(detail -> detail.getProductVariant() != null && detail.getProductVariant().getProduct() != null)
                .forEach(detail -> {
                    Product product = detail.getProductVariant().getProduct();
                    ProductSaleAccumulator accumulator = map.computeIfAbsent(product.getId(), id -> new ProductSaleAccumulator(product));
                    int quantity = detail.getQuantity() == null ? 0 : detail.getQuantity();
                    accumulator.quantity += quantity;
                    accumulator.revenue += safeDouble(detail.getPriceAtPurchase()) * quantity;
                });

        return map.values().stream()
                .sorted(Comparator.comparingLong((ProductSaleAccumulator item) -> item.quantity).reversed())
                .limit(5)
                .map(item -> AdminDashboardResponse.ProductRank.builder()
                        .id(item.product.getId())
                        .name(item.product.getName())
                        .thumbnail(item.product.getThumbnail())
                        .quantity(item.quantity)
                        .revenue(item.revenue)
                        .build())
                .toList();
    }

    private List<AdminDashboardResponse.ProductRank> buildTopViewedProducts(List<UserBehaviorEvent> events) {
        Map<Long, ProductViewAccumulator> map = events.stream()
                .filter(event -> event.getProduct() != null)
                .filter(event -> event.getEventType() == BehaviorEventType.VIEW_PRODUCT)
                .collect(Collectors.groupingBy(event -> event.getProduct().getId(), Collectors.collectingAndThen(Collectors.toList(), list -> {
                    Product product = list.get(0).getProduct();
                    return new ProductViewAccumulator(product, list.size());
                })));

        return map.values().stream()
                .sorted(Comparator.comparingLong((ProductViewAccumulator item) -> item.viewCount).reversed())
                .limit(5)
                .map(item -> AdminDashboardResponse.ProductRank.builder()
                        .id(item.product.getId())
                        .name(item.product.getName())
                        .thumbnail(item.product.getThumbnail())
                        .viewCount(item.viewCount)
                        .build())
                .toList();
    }

    private List<AdminDashboardResponse.KeywordRank> buildTopSearchKeywords(List<UserBehaviorEvent> events) {
        return events.stream()
                .filter(event -> event.getEventType() == BehaviorEventType.SEARCH_PRODUCT)
                .map(UserBehaviorEvent::getKeyword)
                .filter(keyword -> keyword != null && !keyword.isBlank())
                .map(keyword -> keyword.trim().toLowerCase())
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .map(entry -> AdminDashboardResponse.KeywordRank.builder()
                        .keyword(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .toList();
    }

    private List<AdminDashboardResponse.LivestreamItem> buildRecentLivestreams() {
        return livestreamRepository.findAllByOrderByCreatedAtDesc().stream()
                .limit(5)
                .map(live -> AdminDashboardResponse.LivestreamItem.builder()
                        .id(live.getId())
                        .title(live.getTitle())
                        .status(live.getStatus() == null ? "DRAFT" : live.getStatus().name())
                        .viewerCount(live.getViewerCount() == null ? 0L : live.getViewerCount())
                        .totalViews(live.getTotalViews() == null ? 0L : live.getTotalViews())
                        .startedAt(live.getStartedAt())
                        .createdAt(live.getCreatedAt())
                        .build())
                .toList();
    }

    private List<AdminDashboardResponse.VideoItem> buildTopProductVideos() {
        return productVideoRepository.findAllByOrderByCreatedAtDesc().stream()
                .sorted(Comparator.comparingLong(video -> -safeLong(video.getViewCount())))
                .limit(5)
                .map(video -> AdminDashboardResponse.VideoItem.builder()
                        .id(video.getId())
                        .title(video.getTitle())
                        .thumbnailUrl(video.getThumbnailUrl())
                        .productName(video.getProduct() == null ? null : video.getProduct().getName())
                        .viewCount(safeLong(video.getViewCount()))
                        .addToCartCount(safeLong(video.getAddToCartCount()))
                        .orderCount(safeLong(video.getOrderCount()))
                        .build())
                .toList();
    }

    private List<AdminDashboardResponse.LowStockProduct> buildLowStockProducts(List<Product> products) {
        return products.stream()
                .map(product -> AdminDashboardResponse.LowStockProduct.builder()
                        .id(product.getId())
                        .name(product.getName())
                        .thumbnail(product.getThumbnail())
                        .stock(getProductStock(product))
                        .price(getProductPrice(product))
                        .build())
                .filter(product -> product.getStock() <= 10)
                .sorted(Comparator.comparingInt(AdminDashboardResponse.LowStockProduct::getStock))
                .limit(6)
                .toList();
    }

    private List<AdminDashboardResponse.RecentOrder> buildRecentOrders(List<Order> orders, List<User> users) {
        Map<Long, User> userMap = users.stream().collect(Collectors.toMap(User::getId, Function.identity(), (a, b) -> a));
        return orders.stream()
                .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(8)
                .map(order -> {
                    User user = parseLong(order.getUserId()).map(userMap::get).orElse(null);
                    return AdminDashboardResponse.RecentOrder.builder()
                            .id(order.getId())
                            .code("ORD-" + String.format("%06d", order.getId() == null ? 0 : order.getId()))
                            .customerName(user == null ? "Khách hàng" : user.getFullName())
                            .customerEmail(user == null ? null : user.getEmail())
                            .status(normalizeStatus(order.getStatus()))
                            .total(safeDouble(order.getTotalAmount()))
                            .createdAt(order.getCreatedAt())
                            .build();
                })
                .toList();
    }

    private boolean isRevenueOrder(Order order) {
        return order != null && REVENUE_STATUSES.contains(normalizeStatus(order.getStatus()));
    }

    private String normalizeStatus(String status) {
        return status == null || status.isBlank() ? "PENDING" : status.trim().toUpperCase();
    }

    private int getProductStock(Product product) {
        if (product.getVariants() == null) return 0;
        return product.getVariants().stream().mapToInt(variant -> variant.getStock() == null ? 0 : variant.getStock()).sum();
    }

    private double getProductPrice(Product product) {
        if (product.getVariants() == null || product.getVariants().isEmpty()) return 0;
        return product.getVariants().stream()
                .map(ProductVariant::getPrice)
                .filter(Objects::nonNull)
                .min(Double::compareTo)
                .orElse(0D);
    }

    private double safeDouble(Double value) {
        return value == null ? 0D : value;
    }

    private long safeLong(Long value) {
        return value == null ? 0L : value;
    }

    private <T> List<T> safeList(List<T> list) {
        return list == null ? List.of() : list;
    }

    private Optional<Long> parseLong(String value) {
        try {
            return value == null ? Optional.empty() : Optional.of(Long.parseLong(value));
        } catch (NumberFormatException exception) {
            return Optional.empty();
        }
    }

    private static class ProductSaleAccumulator {
        private final Product product;
        private long quantity;
        private double revenue;

        private ProductSaleAccumulator(Product product) {
            this.product = product;
        }
    }

    private static class ProductViewAccumulator {
        private final Product product;
        private final long viewCount;

        private ProductViewAccumulator(Product product, long viewCount) {
            this.product = product;
            this.viewCount = viewCount;
        }
    }
}
