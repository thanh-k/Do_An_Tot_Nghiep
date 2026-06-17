package com.ecommerce.modules.productvideo.service.impl;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductImage;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.modules.product.repository.ProductRepository;
import com.ecommerce.modules.productvideo.dto.ProductVideoRequest;
import com.ecommerce.modules.productvideo.dto.ProductVideoResponse;
import com.ecommerce.modules.productvideo.dto.ProductVideoStatsResponse;
import com.ecommerce.modules.productvideo.entity.ProductVideo;
import com.ecommerce.modules.productvideo.repository.ProductVideoRepository;
import com.ecommerce.modules.productvideo.service.ProductVideoService;
import com.ecommerce.modules.upload.service.LocalStorageService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductVideoServiceImpl implements ProductVideoService {
    private final ProductVideoRepository productVideoRepository;
    private final ProductRepository productRepository;
    private final LocalStorageService localStorageService;

    @Override
    public List<ProductVideoResponse> getAllAdmin() {
        return productVideoRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Override
    public ProductVideoResponse getById(Long id) {
        return toResponse(findVideo(id));
    }

    @Override
    @Transactional
    public ProductVideoResponse create(ProductVideoRequest request) {
        Product product = findProduct(request.getProductId());
        ProductVideo video = ProductVideo.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .videoUrl(request.getVideoUrl())
                .thumbnailUrl(request.getThumbnailUrl())
                .active(request.getActive() == null || request.getActive())
                .product(product)
                .build();
        return toResponse(productVideoRepository.save(video));
    }

    @Override
    @Transactional
    public ProductVideoResponse createWithFiles(String title, String description, Long productId, Boolean active, MultipartFile video, MultipartFile thumbnail) {
        try {
            String videoUrl = video != null && !video.isEmpty()
                    ? localStorageService.uploadVideo(video, "product-videos")
                    : null;
            String thumbnailUrl = thumbnail != null && !thumbnail.isEmpty()
                    ? localStorageService.uploadImage(thumbnail, "product-video-thumbnails")
                    : null;
            return create(ProductVideoRequest.builder()
                    .title(title)
                    .description(description)
                    .productId(productId)
                    .active(active == null || active)
                    .videoUrl(videoUrl)
                    .thumbnailUrl(thumbnailUrl)
                    .build());
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tải video mô tả sản phẩm", e);
        }
    }

    @Override
    @Transactional
    public ProductVideoResponse update(Long id, ProductVideoRequest request) {
        ProductVideo video = findVideo(id);
        Product product = request.getProductId() == null ? video.getProduct() : findProduct(request.getProductId());
        video.setTitle(request.getTitle());
        video.setDescription(request.getDescription());
        if (request.getVideoUrl() != null && !request.getVideoUrl().isBlank()) video.setVideoUrl(request.getVideoUrl());
        if (request.getThumbnailUrl() != null && !request.getThumbnailUrl().isBlank()) video.setThumbnailUrl(request.getThumbnailUrl());
        video.setActive(request.getActive() == null || request.getActive());
        video.setProduct(product);
        return toResponse(productVideoRepository.save(video));
    }

    @Override
    @Transactional
    public ProductVideoResponse updateWithFiles(Long id, String title, String description, Long productId, Boolean active, MultipartFile videoFile, MultipartFile thumbnailFile) {
        try {
            ProductVideo current = findVideo(id);
            String videoUrl = current.getVideoUrl();
            String thumbnailUrl = current.getThumbnailUrl();
            if (videoFile != null && !videoFile.isEmpty()) {
                localStorageService.deleteFile(videoUrl);
                videoUrl = localStorageService.uploadVideo(videoFile, "product-videos");
            }
            if (thumbnailFile != null && !thumbnailFile.isEmpty()) {
                localStorageService.deleteFile(thumbnailUrl);
                thumbnailUrl = localStorageService.uploadImage(thumbnailFile, "product-video-thumbnails");
            }
            return update(id, ProductVideoRequest.builder()
                    .title(title)
                    .description(description)
                    .productId(productId)
                    .active(active == null || active)
                    .videoUrl(videoUrl)
                    .thumbnailUrl(thumbnailUrl)
                    .build());
        } catch (Exception e) {
            throw new IllegalStateException("Không thể cập nhật video mô tả sản phẩm", e);
        }
    }

    @Override
    @Transactional
    public void delete(Long id) {
        ProductVideo video = findVideo(id);
        localStorageService.deleteFile(video.getVideoUrl());
        localStorageService.deleteFile(video.getThumbnailUrl());
        productVideoRepository.delete(video);
    }

    @Override
    public List<ProductVideoResponse> getByProduct(Long productId) {
        return productVideoRepository.findByProductIdAndActiveTrueOrderByCreatedAtDesc(productId).stream().map(this::toResponse).toList();
    }

    @Override
    public List<ProductVideoResponse> search(String keyword, int limit) {
        if (keyword == null || keyword.isBlank()) return List.of();
        return productVideoRepository.searchActiveVideos(keyword.trim(), PageRequest.of(0, Math.max(1, limit))).stream().map(this::toResponse).toList();
    }

    @Override
    public List<ProductVideoResponse> getRelated(Long productId, int limit) {
        Product product = findProduct(productId);
        Long categoryId = product.getCategory() == null ? null : product.getCategory().getId();
        Long brandId = product.getBrand() == null ? null : product.getBrand().getId();
        return productVideoRepository.findRelatedVideos(productId, categoryId, brandId, PageRequest.of(0, Math.max(1, limit)))
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductVideoStatsResponse getStats() {
        return ProductVideoStatsResponse.builder()
                .totalVideos(productVideoRepository.count())
                .totalViews(productVideoRepository.sumViewCount())
                .mostViewedVideo(productVideoRepository.findTopByOrderByViewCountDesc().map(this::toResponse).orElse(null))
                .mostClickedVideo(productVideoRepository.findTopByOrderByProductClickCountDesc().map(this::toResponse).orElse(null))
                .mostAddedToCartVideo(productVideoRepository.findTopByOrderByAddToCartCountDesc().map(this::toResponse).orElse(null))
                .mostOrderedVideo(productVideoRepository.findTopByOrderByOrderCountDesc().map(this::toResponse).orElse(null))
                .build();
    }

    @Override
    @Transactional
    public ProductVideoResponse trackView(Long id, Long watchSeconds) {
        ProductVideo video = findVideo(id);
        video.setViewCount(video.getViewCount() + 1);
        if (watchSeconds != null && watchSeconds > 0) {
            video.setTotalWatchSeconds(video.getTotalWatchSeconds() + watchSeconds);
        }
        return toResponse(productVideoRepository.save(video));
    }

    @Override
    @Transactional
    public ProductVideoResponse trackProductClick(Long id) {
        ProductVideo video = findVideo(id);
        video.setProductClickCount(video.getProductClickCount() + 1);
        return toResponse(productVideoRepository.save(video));
    }

    @Override
    @Transactional
    public ProductVideoResponse trackAddToCart(Long id) {
        ProductVideo video = findVideo(id);
        video.setAddToCartCount(video.getAddToCartCount() + 1);
        return toResponse(productVideoRepository.save(video));
    }

    @Override
    @Transactional
    public ProductVideoResponse trackOrder(Long id) {
        ProductVideo video = findVideo(id);
        video.setOrderCount(video.getOrderCount() + 1);
        return toResponse(productVideoRepository.save(video));
    }

    private ProductVideo findVideo(Long id) {
        return productVideoRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Không tìm thấy video mô tả sản phẩm"));
    }

    private Product findProduct(Long id) {
        if (id == null) throw new IllegalArgumentException("Vui lòng chọn sản phẩm liên kết");
        return productRepository.findByIdWithRelations(id).orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm"));
    }

    private ProductVideoResponse toResponse(ProductVideo video) {
        Product product = video.getProduct();
        Double price = getDisplayPrice(product);
        String thumbnail = product.getThumbnail();
        if ((thumbnail == null || thumbnail.isBlank()) && product.getImages() != null) {
            thumbnail = product.getImages().stream()
                    .sorted(Comparator.comparing(ProductImage::getDisplayOrder, Comparator.nullsLast(Integer::compareTo)))
                    .map(ProductImage::getImageUrl)
                    .filter(url -> url != null && !url.isBlank())
                    .findFirst()
                    .orElse(null);
        }

        return ProductVideoResponse.builder()
                .id(video.getId())
                .title(video.getTitle())
                .description(video.getDescription())
                .videoUrl(video.getVideoUrl())
                .thumbnailUrl(video.getThumbnailUrl())
                .active(video.getActive())
                .productId(product.getId())
                .productName(product.getName())
                .productSlug(product.getSlug())
                .productThumbnail(thumbnail)
                .productPrice(price)
                .brandName(product.getBrand() == null ? null : product.getBrand().getName())
                .categoryName(product.getCategory() == null ? null : product.getCategory().getName())
                .viewCount(video.getViewCount())
                .productClickCount(video.getProductClickCount())
                .addToCartCount(video.getAddToCartCount())
                .orderCount(video.getOrderCount())
                .totalWatchSeconds(video.getTotalWatchSeconds())
                .createdAt(video.getCreatedAt())
                .updatedAt(video.getUpdatedAt())
                .build();
    }

    private Double getDisplayPrice(Product product) {
        if (product.getVariants() == null || product.getVariants().isEmpty()) return null;
        return product.getVariants().stream()
                .map(ProductVariant::getPrice)
                .filter(price -> price != null)
                .min(Double::compareTo)
                .orElse(null);
    }
}
