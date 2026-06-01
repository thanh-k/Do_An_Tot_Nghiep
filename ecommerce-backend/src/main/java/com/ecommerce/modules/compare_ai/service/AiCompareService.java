package com.ecommerce.modules.compare_ai.service;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.Product;
// import com.ecommerce.repository.ProductRepository;
import com.ecommerce.modules.compare_ai.mapper.AiCompareMapper;
import com.ecommerce.modules.compare_ai.repository.AiCompareRepository;
import com.ecommerce.modules.product.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiCompareService {

    private final ProductRepository productRepository;
    private final AiCompareMapper aiCompareMapper;
    private final AiCompareRepository aiCompareRepository;

    public String analyzeComparison(List<Long> productIds) {
        if (productIds == null || productIds.size() < 2) {
            throw new AppException(ErrorCode.NOT_ENOUGH_PRODUCTS_TO_COMPARE);
        }

        List<Product> products = productRepository.findAllById(productIds);
        if (products.size() < 2) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }

        String prompt = aiCompareMapper.buildPromptFromProducts(products);

        return aiCompareRepository.callGeminiApi(prompt);
    }
}