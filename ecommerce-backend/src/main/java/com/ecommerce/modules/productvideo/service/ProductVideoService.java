package com.ecommerce.modules.productvideo.service;

import com.ecommerce.modules.productvideo.dto.ProductVideoRequest;
import com.ecommerce.modules.productvideo.dto.ProductVideoResponse;
import com.ecommerce.modules.productvideo.dto.ProductVideoStatsResponse;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface ProductVideoService {
    List<ProductVideoResponse> getAllAdmin();
    ProductVideoResponse getById(Long id);
    ProductVideoResponse create(ProductVideoRequest request);
    ProductVideoResponse createWithFiles(String title, String description, Long productId, Boolean active, MultipartFile video, MultipartFile thumbnail);
    ProductVideoResponse update(Long id, ProductVideoRequest request);
    ProductVideoResponse updateWithFiles(Long id, String title, String description, Long productId, Boolean active, MultipartFile video, MultipartFile thumbnail);
    void delete(Long id);

    List<ProductVideoResponse> getByProduct(Long productId);
    List<ProductVideoResponse> search(String keyword, int limit);
    List<ProductVideoResponse> getRelated(Long productId, int limit);
    ProductVideoStatsResponse getStats();

    ProductVideoResponse trackView(Long id, Long watchSeconds);
    ProductVideoResponse trackProductClick(Long id);
    ProductVideoResponse trackAddToCart(Long id);
    ProductVideoResponse trackOrder(Long id);
}
