package com.ecommerce.modules.livestream.service.impl;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.modules.livestream.dto.*;
import com.ecommerce.modules.livestream.document.LivestreamChatMessage;
import com.ecommerce.modules.livestream.repository.mongo.LivestreamChatMessageRepository;
import com.ecommerce.modules.livestream.entity.*;
import com.ecommerce.modules.livestream.repository.*;
import com.ecommerce.modules.livestream.service.LivestreamService;
import com.ecommerce.modules.product.repository.ProductRepository;
import com.ecommerce.modules.upload.service.LocalStorageService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Collections;

@Service
@Transactional
public class LivestreamServiceImpl implements LivestreamService {
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
        Livestream livestream = findLivestream(id);
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
            return chatMessageRepository.findTop80ByLivestreamIdOrderByCreatedAtDesc(livestreamId).stream()
                    .sorted(Comparator.comparing(LivestreamChatMessage::getCreatedAt))
                    .map(message -> LiveChatMessageResponse.builder()
                            .id(message.getId())
                            .livestreamId(message.getLivestreamId())
                            .senderName(message.getSenderName())
                            .senderRole(message.getSenderRole())
                            .message(message.getMessage())
                            .createdAt(message.getCreatedAt())
                            .build())
                    .toList();
        } catch (Exception exception) {
            return Collections.emptyList();
        }
    }

    @Override
    public LivestreamResponse updateStatus(Long id, LivestreamStatus status) {
        Livestream livestream = findLivestream(id);
        livestream.setStatus(status);
        if (status == LivestreamStatus.LIVE) {
            if (livestream.getStartedAt() == null) {
                livestream.setStartedAt(LocalDateTime.now());
            }
            // Mỗi lần bắt đầu live thì người xem hiện tại bắt đầu lại từ 0.
            // totalViews vẫn giữ để làm thống kê tổng lượt xem.
            // Chat cũ của chính phiên live này được xóa để phiên mới không lẫn bình luận cũ.
            livestream.setViewerCount(0L);
            livestream.setEndedAt(null);
            chatMessageRepository.deleteByLivestreamId(id);
        }
        if (status == LivestreamStatus.ENDED) {
            livestream.setEndedAt(LocalDateTime.now());
            livestream.setViewerCount(0L);
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

        // Một sản phẩm chỉ có một deal đang chạy trong cùng live để FE không bị lấy nhầm deal cũ.
        List<LivestreamDeal> runningDeals = livestreamDealRepository.findRunningProductDeals(livestreamId, request.getProductId());
        runningDeals.forEach(item -> { item.setActive(false); item.setStatus("EXPIRED"); });
        livestreamDealRepository.saveAll(runningDeals);

        int duration = request.getDurationMinutes() == null ? 3 : Math.max(1, Math.min(5, request.getDurationMinutes()));
        int quantity = request.getQuantityLimit() == null ? 10 : Math.max(1, request.getQuantityLimit());
        LivestreamDeal deal = LivestreamDeal.builder()
                .livestream(livestream)
                .product(product)
                .originalPrice(originalPrice)
                .dealPrice(dealPrice)
                .discountPercent(Math.round((originalPrice - dealPrice) * 10000D / originalPrice) / 100D)
                .quantityLimit(quantity)
                .quantitySold(0)
                .startsAt(LocalDateTime.now())
                .endsAt(LocalDateTime.now().plusMinutes(duration))
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

    private Livestream findLivestream(Long id) {
        return livestreamRepository.findWithProductsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy livestream"));
    }

    private Product findProduct(Long id) {
        return productRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm"));
    }

    private LivestreamResponse toResponse(Livestream livestream) {
        LocalDateTime now = LocalDateTime.now();
        List<LiveProductResponse> products = livestream.getProducts().stream()
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
        ProductVariant variant = firstVariant(product);
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
                .stock(variant == null ? 0 : variant.getStock())
                .pinned(Boolean.TRUE.equals(item.getPinned()))
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

    private ProductVariant firstVariant(Product product) {
        return product.getVariants() == null ? null : product.getVariants().stream().findFirst().orElse(null);
    }

    private double productPrice(Product product) {
        ProductVariant variant = firstVariant(product);
        return variant == null || variant.getPrice() == null ? 0D : variant.getPrice();
    }

    private double safePercent(Double value) {
        return value == null ? 0D : Math.max(0D, Math.min(100D, value));
    }

    private String nonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
