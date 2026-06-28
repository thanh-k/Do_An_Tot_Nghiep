package com.ecommerce.modules.livestream.service.impl;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.modules.livestream.dto.*;
import com.ecommerce.modules.livestream.document.LivestreamChatMessage;
import com.ecommerce.modules.livestream.repository.mongo.LivestreamChatMessageRepository;
import com.ecommerce.modules.livestream.entity.*;
import com.ecommerce.modules.livestream.repository.*;
import com.ecommerce.modules.livestream.service.LivestreamService;
import com.ecommerce.modules.product.dto.response.VariantResponse;
import com.ecommerce.modules.product.repository.ProductRepository;
import com.ecommerce.modules.upload.service.LocalStorageService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Collections;

@Service
@Transactional
public class LivestreamServiceImpl implements LivestreamService {
    private static final ZoneId LIVESTREAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final long START_SCHEDULE_GRACE_SECONDS = 60L;

    private final LivestreamRepository livestreamRepository;
    private final LivestreamProductRepository livestreamProductRepository;
    private final LivestreamDealRepository livestreamDealRepository;
    private final ProductRepository productRepository;
    private final LivestreamChatMessageRepository chatMessageRepository;
    private final LocalStorageService localStorageService;

    public LivestreamServiceImpl(LivestreamRepository livestreamRepository,
                                 LivestreamProductRepository livestreamProductRepository,
                                 LivestreamDealRepository livestreamDealRepository,
                                 ProductRepository productRepository,
                                 LivestreamChatMessageRepository chatMessageRepository,
                                 LocalStorageService localStorageService) {
        this.livestreamRepository = livestreamRepository;
        this.livestreamProductRepository = livestreamProductRepository;
        this.livestreamDealRepository = livestreamDealRepository;
        this.productRepository = productRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.localStorageService = localStorageService;
    }

    @Override
    public List<LivestreamResponse> getAll() {
        return livestreamRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Override
    public List<LivestreamResponse> getLive() {
        return livestreamRepository.findByStatusOrderByStartedAtDesc(LivestreamStatus.LIVE).stream().map(this::toResponse).toList();
    }

    @Override
    public LivestreamResponse getById(Long id) {
        return toResponse(findLivestream(id));
    }

    @Override
    public LivestreamResponse create(LivestreamRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Dữ liệu tạo livestream không hợp lệ");
        }

        validateScheduledAtNotInPast(request.getScheduledAt());

        Livestream livestream = Livestream.builder()
                .title(nonBlank(request.getTitle(), "Phiên livestream mới"))
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .scheduledAt(request.getScheduledAt())
                .status(request.getScheduledAt() == null ? LivestreamStatus.DRAFT : LivestreamStatus.SCHEDULED)
                .build();

        return toResponse(livestreamRepository.save(livestream));
    }

    @Override
    public LivestreamResponse update(Long id, LivestreamRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Dữ liệu cập nhật livestream không hợp lệ");
        }

        Livestream livestream = findLivestream(id);
        validateScheduledAtNotInPast(request.getScheduledAt());

        livestream.setTitle(nonBlank(request.getTitle(), livestream.getTitle()));
        livestream.setDescription(request.getDescription());

        if (request.getThumbnailUrl() != null && !Objects.equals(livestream.getThumbnailUrl(), request.getThumbnailUrl())) {
            localStorageService.deleteFile(livestream.getThumbnailUrl());
            livestream.setThumbnailUrl(request.getThumbnailUrl());
        }

        livestream.setScheduledAt(request.getScheduledAt());

        if (livestream.getStatus() == LivestreamStatus.DRAFT && request.getScheduledAt() != null) {
            livestream.setStatus(LivestreamStatus.SCHEDULED);
        }

        return toResponse(livestreamRepository.save(livestream));
    }

    @Override
    public void delete(Long id) {
        Livestream livestream = findLivestream(id);
        localStorageService.deleteFile(livestream.getThumbnailUrl());
        livestreamRepository.delete(livestream);
    }

    @Override
    public List<LiveChatMessageResponse> getChatMessages(Long livestreamId) {
        try {
            expireExpiredPinnedComments(livestreamId, nowForLivestream());
            return chatMessageRepository.findTop80ByLivestreamIdOrderByCreatedAtDesc(livestreamId).stream()
                    .sorted(Comparator.comparing(LivestreamChatMessage::getCreatedAt))
                    .map(this::toChatMessageResponse)
                    .toList();
        } catch (Exception exception) {
            return Collections.emptyList();
        }
    }

    @Override
    public LiveChatMessageResponse pinChatMessage(Long livestreamId, String messageId) {
        findLivestream(livestreamId);
        if (messageId == null || messageId.isBlank()) {
            throw new IllegalArgumentException("Không tìm thấy bình luận cần ghim");
        }

        LocalDateTime now = nowForLivestream();
        expireExpiredPinnedComments(livestreamId, now);

        LivestreamChatMessage message = chatMessageRepository.findByIdAndLivestreamId(messageId, livestreamId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận cần ghim"));

        boolean alreadyPinned = Boolean.TRUE.equals(message.getPinned())
                && message.getPinExpiresAt() != null
                && message.getPinExpiresAt().isAfter(now);

        long activePinnedCount = chatMessageRepository.findByLivestreamIdAndPinnedTrueOrderByPinnedAtDesc(livestreamId).stream()
                .filter(item -> item.getPinExpiresAt() != null && item.getPinExpiresAt().isAfter(now))
                .filter(item -> !Objects.equals(item.getId(), message.getId()))
                .count();

        if (!alreadyPinned && activePinnedCount >= 3) {
            throw new IllegalArgumentException("Chỉ được ghim tối đa 3 bình luận cùng lúc");
        }

        message.setPinned(true);
        message.setPinnedAt(now);
        message.setPinExpiresAt(now.plusMinutes(1));
        return toChatMessageResponse(chatMessageRepository.save(message));
    }

    @Override
    public LiveChatMessageResponse unpinChatMessage(Long livestreamId, String messageId) {
        findLivestream(livestreamId);
        if (messageId == null || messageId.isBlank()) {
            throw new IllegalArgumentException("Không tìm thấy bình luận cần gỡ ghim");
        }
        LivestreamChatMessage message = chatMessageRepository.findByIdAndLivestreamId(messageId, livestreamId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận cần gỡ ghim"));
        message.setPinned(false);
        message.setPinExpiresAt(nowForLivestream());
        return toChatMessageResponse(chatMessageRepository.save(message));
    }

    @Override
    public LivestreamResponse updateStatus(Long id, LivestreamStatus status) {
        Livestream livestream = findLivestream(id);
        livestream.setStatus(status);
        if (status == LivestreamStatus.LIVE) {
            validateCanStartLivestream(livestream);
            if (livestream.getStartedAt() == null) {
                livestream.setStartedAt(nowForLivestream());
            }
            // Mỗi lần bắt đầu live thì người xem hiện tại bắt đầu lại từ 0.
            // totalViews vẫn giữ để làm thống kê tổng lượt xem.
            // Chat cũ của chính phiên live này được xóa để phiên mới không lẫn bình luận cũ.
            livestream.setViewerCount(0L);
            livestream.setEndedAt(null);
            chatMessageRepository.deleteByLivestreamId(id);
        }
        if (status == LivestreamStatus.ENDED) {
            LocalDateTime endedAt = nowForLivestream();
            livestream.setEndedAt(endedAt);
            livestream.setViewerCount(0L);

            // Khi host tắt live thì toàn bộ deal còn đang chạy phải kết thúc ngay,
            // không chờ hết countdown để tránh user vẫn thấy/áp dụng giá giảm sau khi live đã đóng.
            expireAllActiveDeals(livestream.getId(), "ENDED_BY_LIVE");
        }
        
        return toResponse(livestreamRepository.save(livestream));
    }

    @Override
    public LivestreamResponse addProduct(Long livestreamId, Long productId) {
        Livestream livestream = findLivestream(livestreamId);
        Product product = findProduct(productId);
        livestreamProductRepository.findByLivestreamIdAndProductId(livestreamId, productId)
                .orElseGet(() -> livestreamProductRepository.save(LivestreamProduct.builder()
                        .livestream(livestream)
                        .product(product)
                        .pinned(false)
                        .build()));
        return getById(livestreamId);
    }

    @Override
    public LivestreamResponse removeProduct(Long livestreamId, Long productId) {
        findLivestream(livestreamId);
        findProduct(productId);

        livestreamDealRepository.deactivateActiveDealsByLivestreamIdAndProductId(livestreamId, productId);
        livestreamProductRepository.deleteByLivestreamIdAndProductId(livestreamId, productId);

        // Xóa xong flush để response mới không còn trả lại sản phẩm đã xóa.
        livestreamProductRepository.flush();

        return getById(livestreamId);
    }

    @Override
    public LivestreamResponse pinProduct(Long livestreamId, Long productId) {
        findLivestream(livestreamId);
        findProduct(productId);
        List<LivestreamProduct> products = livestreamProductRepository.findByLivestreamId(livestreamId);
        boolean exists = products.stream().anyMatch(item -> Objects.equals(item.getProduct().getId(), productId));
        if (!exists) {
            addProduct(livestreamId, productId);
            products = livestreamProductRepository.findByLivestreamId(livestreamId);
        }
        for (LivestreamProduct item : products) {
            item.setPinned(Objects.equals(item.getProduct().getId(), productId));
        }
        livestreamProductRepository.saveAll(products);
        return getById(livestreamId);
    }

    @Override
    public LivestreamResponse unpinProduct(Long livestreamId) {
        findLivestream(livestreamId);
        // Cập nhật trực tiếp để tránh lỗi 500 khi Hibernate phải load/save lại toàn bộ entity livestream_products.
        // Chỉ bỏ ghim sản phẩm trong phiên live hiện tại, không ảnh hưởng sản phẩm/đơn hàng thường.
        livestreamProductRepository.unpinAllByLivestreamId(livestreamId);
        return getById(livestreamId);
    }

    @Override
    public LivestreamResponse createDeal(Long livestreamId, LivestreamDealRequest request) {
        if (request == null || request.getProductId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn sản phẩm tạo deal");
        }
        Livestream livestream = findLivestream(livestreamId);
        if (livestream.getStatus() != LivestreamStatus.LIVE) {
            throw new IllegalArgumentException("Cần bắt đầu livestream trước khi tạo deal");
        }
        Product product = findProduct(request.getProductId());

        boolean productInLive = livestreamProductRepository.findByLivestreamIdAndProductId(livestreamId, request.getProductId()).isPresent();
        if (!productInLive) {
            livestreamProductRepository.save(LivestreamProduct.builder()
                    .livestream(livestream)
                    .product(product)
                    .pinned(false)
                    .build());
        }

        double originalPrice = productPrice(product);
        if (originalPrice <= 0D) {
            throw new IllegalArgumentException("Sản phẩm chưa có giá hợp lệ để tạo deal");
        }

        double percent = safePercent(request.getDiscountPercent());
        double discountAmount = request.getDiscountAmount() == null ? 0D : Math.max(0D, request.getDiscountAmount());
        double dealPrice;
        if (request.getDealPrice() != null && request.getDealPrice() > 0) {
            // FE gửi dealPrice là giá bán cuối sau khi giảm. Ưu tiên giá cuối để admin chủ động chốt giá.
            dealPrice = request.getDealPrice();
        } else if (percent > 0D) {
            dealPrice = originalPrice * (100D - percent) / 100D;
        } else if (discountAmount > 0D) {
            dealPrice = originalPrice - discountAmount;
        } else {
            throw new IllegalArgumentException("Vui lòng nhập giá sau khi giảm, phần trăm giảm hoặc số tiền muốn giảm");
        }

        if (percent >= 100D) {
            throw new IllegalArgumentException("Phần trăm giảm phải nhỏ hơn 100");
        }
        if (discountAmount >= originalPrice) {
            throw new IllegalArgumentException("Số tiền muốn giảm phải nhỏ hơn giá sản phẩm");
        }
        if (dealPrice <= 0D || dealPrice >= originalPrice) {
            throw new IllegalArgumentException("Giá sau khi giảm phải nhỏ hơn giá hiện tại của sản phẩm");
        }

        LocalDateTime now = nowForLivestream();
        expireFinishedDeals(livestreamId, now);

        // Trong một phiên live chỉ cho phép 1 deal đang chạy.
        // Điều này giúp admin dễ kiểm soát countdown/số lượng còn lại và tránh FE lấy nhầm deal khi nhiều deal trùng thời gian.
        findCurrentActiveDeal(livestreamId, now).ifPresent(activeDeal -> {
            String productName = activeDeal.getProduct() != null
                    ? activeDeal.getProduct().getName()
                    : "không xác định";
            throw new IllegalArgumentException("Đang có deal #" + activeDeal.getId()
                    + " của sản phẩm \"" + productName
                    + "\" còn chạy. Vui lòng chờ deal hiện tại kết thúc rồi tạo deal mới.");
        });

        int duration = request.getDurationMinutes() == null ? 3 : Math.max(1, Math.min(5, request.getDurationMinutes()));
        int availableStock = totalProductStock(product);
        if (availableStock <= 0) {
            throw new IllegalArgumentException("Sản phẩm đã hết hàng, không thể tạo deal livestream");
        }
        int quantity = request.getQuantityLimit() == null ? Math.min(10, availableStock) : Math.max(1, request.getQuantityLimit());
        if (quantity > availableStock) {
            throw new IllegalArgumentException("Số lượng deal không được vượt quá tổng tồn kho của tất cả biến thể sản phẩm hiện tại: " + availableStock);
        }
        LivestreamDeal deal = LivestreamDeal.builder()
                .livestream(livestream)
                .product(product)
                .originalPrice(originalPrice)
                .dealPrice(dealPrice)
                .discountPercent(Math.round((originalPrice - dealPrice) * 10000D / originalPrice) / 100D)
                .quantityLimit(quantity)
                .quantitySold(0)
                .startsAt(now)
                .endsAt(now.plusMinutes(duration))
                .active(true)
                .status("ACTIVE")
                .build();
        livestreamDealRepository.save(deal);
        return getById(livestreamId);
    }

    @Override
    public LivestreamResponse increaseViewer(Long livestreamId) {
        Livestream livestream = findLivestream(livestreamId);
        livestream.setTotalViews((livestream.getTotalViews() == null ? 0 : livestream.getTotalViews()) + 1);
        return toResponse(livestreamRepository.save(livestream));
    }

    private LiveChatMessageResponse toChatMessageResponse(LivestreamChatMessage message) {
        return LiveChatMessageResponse.builder()
                .id(message.getId())
                .livestreamId(message.getLivestreamId())
                .senderName(message.getSenderName())
                .senderRole(message.getSenderRole())
                .message(message.getMessage())
                .pinned(Boolean.TRUE.equals(message.getPinned()))
                .pinnedAt(message.getPinnedAt())
                .pinExpiresAt(message.getPinExpiresAt())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private void expireExpiredPinnedComments(Long livestreamId, LocalDateTime now) {
        List<LivestreamChatMessage> expiredPinnedMessages = chatMessageRepository
                .findByLivestreamIdAndPinnedTrueAndPinExpiresAtBefore(livestreamId, now);
        if (expiredPinnedMessages.isEmpty()) {
            return;
        }
        expiredPinnedMessages.forEach(message -> message.setPinned(false));
        chatMessageRepository.saveAll(expiredPinnedMessages);
    }

    private Livestream findLivestream(Long id) {
        return livestreamRepository.findWithProductsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy livestream"));
    }

    private Product findProduct(Long id) {
        return productRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm"));
    }

    private LivestreamResponse toResponse(Livestream livestream) {
        LocalDateTime now = nowForLivestream();
        expireFinishedDeals(livestream.getId(), now);
        List<LiveProductResponse> products = livestream.getProducts() == null
                ? Collections.emptyList()
                : livestream.getProducts().stream()
                .map(this::toProductResponse)
                .sorted(Comparator.comparing(LiveProductResponse::getPinned).reversed())
                .toList();
        List<LiveDealResponse> deals = livestreamDealRepository
                .findActiveDeals(livestream.getId(), now)
                .stream()
                .map(this::toDealResponse)
                .toList();
        return LivestreamResponse.builder()
                .id(livestream.getId())
                .title(livestream.getTitle())
                .description(livestream.getDescription())
                .thumbnailUrl(livestream.getThumbnailUrl())
                .status(livestream.getStatus())
                .scheduledAt(livestream.getScheduledAt())
                .startedAt(livestream.getStartedAt())
                .endedAt(livestream.getEndedAt())
                .viewerCount(livestream.getViewerCount())
                .totalViews(livestream.getTotalViews())
                .products(products)
                .activeDeals(deals)
                .build();
    }

    private LiveProductResponse toProductResponse(LivestreamProduct item) {
        Product product = item.getProduct();
        List<VariantResponse> variants = product.getVariants() == null
                ? Collections.emptyList()
                : product.getVariants().stream()
                .map(this::toVariantResponse)
                .sorted(Comparator.comparing(VariantResponse::getId))
                .toList();

        ProductVariant variant = firstAvailableVariant(product);
        if (variant == null) {
            variant = firstVariant(product);
        }

        int totalStock = totalProductStock(product);

        return LiveProductResponse.builder()
                .id(product.getId())
                .variantId(variant == null ? null : variant.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .thumbnail(product.getThumbnail())
                .brandName(product.getBrand() == null ? null : product.getBrand().getName())
                .categoryName(product.getCategory() == null ? null : product.getCategory().getName())
                .price(variant == null ? 0D : variant.getPrice())
                .compareAtPrice(variant == null ? 0D : variant.getCompareAtPrice())
                .stock(totalStock)
                .pinned(Boolean.TRUE.equals(item.getPinned()))
                .variants(variants)
                .build();
    }

    private VariantResponse toVariantResponse(ProductVariant variant) {
        return VariantResponse.builder()
                .id(variant.getId())
                .sku(variant.getSku())
                .price(variant.getPrice())
                .compareAtPrice(variant.getCompareAtPrice())
                .stock(variant.getStock())
                .attributes(variant.getAttributes())
                .image(variant.getImage())
                .hasOrders(false)
                .build();
    }

    private LiveDealResponse toDealResponse(LivestreamDeal deal) {
        return LiveDealResponse.builder()
                .id(deal.getId())
                .productId(deal.getProduct().getId())
                .productName(deal.getProduct().getName())
                .originalPrice(deal.getOriginalPrice())
                .dealPrice(deal.getDealPrice())
                .discountPercent(deal.getDiscountPercent())
                .quantityLimit(deal.getQuantityLimit())
                .quantitySold(deal.getQuantitySold())
                .startsAt(deal.getStartsAt())
                .endsAt(deal.getEndsAt())
                .active(Boolean.TRUE.equals(deal.getActive()))
                .build();
    }


    private java.util.Optional<LivestreamDeal> findCurrentActiveDeal(Long livestreamId, LocalDateTime now) {
        return livestreamDealRepository.findByLivestreamIdOrderByCreatedAtDesc(livestreamId).stream()
                .filter(deal -> Boolean.TRUE.equals(deal.getActive()))
                .filter(deal -> !deal.getStartsAt().isAfter(now))
                .filter(deal -> deal.getEndsAt().isAfter(now))
                .filter(deal -> {
                    int quantitySold = deal.getQuantitySold() == null ? 0 : deal.getQuantitySold();
                    int quantityLimit = deal.getQuantityLimit() == null ? Integer.MAX_VALUE : deal.getQuantityLimit();
                    return quantitySold < quantityLimit;
                })
                .findFirst();
    }


    private void expireAllActiveDeals(Long livestreamId, String status) {
        List<LivestreamDeal> activeDeals = livestreamDealRepository.findByLivestreamIdOrderByCreatedAtDesc(livestreamId).stream()
                .filter(deal -> Boolean.TRUE.equals(deal.getActive()))
                .toList();

        if (activeDeals.isEmpty()) {
            return;
        }

        activeDeals.forEach(deal -> {
            deal.setActive(false);
            deal.setStatus(status == null || status.isBlank() ? "EXPIRED" : status);
            // Cắt thời gian kết thúc về hiện tại để các màn hình realtime/countdown biết deal đã dừng ngay.
            deal.setEndsAt(nowForLivestream());
        });
        livestreamDealRepository.saveAll(activeDeals);
    }

    private void expireFinishedDeals(Long livestreamId, LocalDateTime now) {
        List<LivestreamDeal> expiredDeals = livestreamDealRepository.findByLivestreamIdOrderByCreatedAtDesc(livestreamId).stream()
                .filter(deal -> Boolean.TRUE.equals(deal.getActive()))
                .filter(deal -> {
                    int quantitySold = deal.getQuantitySold() == null ? 0 : deal.getQuantitySold();
                    int quantityLimit = deal.getQuantityLimit() == null ? Integer.MAX_VALUE : deal.getQuantityLimit();
                    return !deal.getEndsAt().isAfter(now) || quantitySold >= quantityLimit;
                })
                .toList();

        if (expiredDeals.isEmpty()) {
            return;
        }

        expiredDeals.forEach(deal -> {
            deal.setActive(false);
            deal.setStatus("EXPIRED");
        });
        livestreamDealRepository.saveAll(expiredDeals);
    }

    private ProductVariant firstVariant(Product product) {
        return product.getVariants() == null ? null : product.getVariants().stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(ProductVariant::getId, Comparator.nullsLast(Long::compareTo)))
                .findFirst()
                .orElse(null);
    }

    private ProductVariant firstAvailableVariant(Product product) {
        return product.getVariants() == null ? null : product.getVariants().stream()
                .filter(Objects::nonNull)
                .filter(variant -> variant.getStock() != null && variant.getStock() > 0)
                .sorted(Comparator.comparing(ProductVariant::getId, Comparator.nullsLast(Long::compareTo)))
                .findFirst()
                .orElse(null);
    }

    private int totalProductStock(Product product) {
        if (product == null || product.getVariants() == null) {
            return 0;
        }
        return product.getVariants().stream()
                .filter(Objects::nonNull)
                .map(ProductVariant::getStock)
                .filter(Objects::nonNull)
                .filter(stock -> stock > 0)
                .mapToInt(Integer::intValue)
                .sum();
    }

    /**
     * Giá đại diện để admin tạo deal theo sản phẩm.
     * Product.variants là Set nên không lấy variant ngẫu nhiên nữa; ưu tiên giá thấp nhất của biến thể còn hàng.
     * Deal vẫn gắn theo productId, vì vậy khi user chọn bất kỳ biến thể nào của cùng sản phẩm,
     * OrderServiceImpl sẽ kiểm tra variant.product.id == deal.product.id và áp deal cho toàn bộ biến thể của sản phẩm đó.
     */
    private double productPrice(Product product) {
        if (product == null || product.getVariants() == null) {
            return 0D;
        }
        return product.getVariants().stream()
                .filter(Objects::nonNull)
                .filter(variant -> variant.getPrice() != null && variant.getPrice() > 0D)
                .filter(variant -> variant.getStock() != null && variant.getStock() > 0)
                .map(ProductVariant::getPrice)
                .min(Double::compareTo)
                .orElseGet(() -> product.getVariants().stream()
                        .filter(Objects::nonNull)
                        .filter(variant -> variant.getPrice() != null && variant.getPrice() > 0D)
                        .map(ProductVariant::getPrice)
                        .min(Double::compareTo)
                        .orElse(0D));
    }



    private LocalDateTime nowForLivestream() {
        return LocalDateTime.now(LIVESTREAM_ZONE);
    }

    private void validateCanStartLivestream(Livestream livestream) {
        if (livestream == null) {
            throw new IllegalArgumentException("Không tìm thấy livestream");
        }

        LocalDateTime scheduledAt = livestream.getScheduledAt();
        LocalDateTime now = nowForLivestream();

        // Cho phép bắt đầu trong khoảng sai số nhỏ để tránh lệch vài giây giữa trình duyệt, BE và DB.
        // Thời gian được so sánh theo múi giờ Việt Nam để deploy Docker/VPS không bị lệch UTC.
        if (scheduledAt != null && now.plusSeconds(START_SCHEDULE_GRACE_SECONDS).isBefore(scheduledAt)) {
            throw new IllegalArgumentException("Chưa đến lịch phát dự kiến. Livestream sẽ bắt đầu lúc "
                    + scheduledAt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        }
    }

    private void validateScheduledAtNotInPast(LocalDateTime scheduledAt) {
        if (scheduledAt != null && scheduledAt.isBefore(nowForLivestream().minusMinutes(1))) {
            throw new IllegalArgumentException("Lịch phát dự kiến không được nhỏ hơn thời gian hiện tại");
        }
    }

    private double safePercent(Double value) {
        return value == null ? 0D : Math.max(0D, Math.min(100D, value));
    }

    private String nonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
