package com.ecommerce.modules.productCompare.service;

import com.ecommerce.modules.productCompare.dto.response.ProductCompareResponse;

import java.util.List;

public interface ProductCompareService {
    List<ProductCompareResponse> getUserCompareList(String userEmail);

    void addProductToCompare(String userEmail, Long productId);

    void removeProductFromCompare(String userEmail, Long productId);

    void clearUserCompareList(String userEmail);
}