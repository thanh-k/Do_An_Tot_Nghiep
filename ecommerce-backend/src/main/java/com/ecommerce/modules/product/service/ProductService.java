package com.ecommerce.modules.product.service;

import com.ecommerce.modules.product.dto.request.ProductRequest;
import com.ecommerce.modules.product.dto.response.ProductResponse;
import java.util.List;

public interface ProductService {
    ProductResponse createProduct(ProductRequest request);

    ProductResponse updateProduct(Long id, ProductRequest request);

    ProductResponse getProductById(Long id);

    List<ProductResponse> getAllProducts();

    void deleteProduct(Long id);

    ProductResponse getProductBySlug(String slug);
}