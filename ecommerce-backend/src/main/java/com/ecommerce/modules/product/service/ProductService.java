package com.ecommerce.modules.product.service;

import com.ecommerce.modules.product.dto.request.ProductRequest;
import com.ecommerce.modules.product.dto.response.ProductResponse;
import java.util.List;
import org.springframework.data.domain.Page;
public interface ProductService {
    ProductResponse createProduct(ProductRequest request);

    ProductResponse updateProduct(Long id, ProductRequest request);

    ProductResponse getProductById(Long id);

    List<ProductResponse> getAllProducts();

    void deleteProduct(Long id);

    ProductResponse getProductBySlug(String slug);

    void syncAllProductsToVision();

    List<ProductResponse> getProductsByIds(List<Long> ids);

    Page<ProductResponse> getProductsWithFilter(
            String keyword,
            Long categoryId,
            List<String> brands,
            Double minPrice,
            Double maxPrice,
            Boolean inStock,
            int page,
            int size,
            String sortBy);
}