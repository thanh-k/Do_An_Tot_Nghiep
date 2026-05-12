package com.ecommerce.modules.productCompare.service.impl;

import com.ecommerce.entity.User;
import com.ecommerce.entity.ProductCompare;
import com.ecommerce.modules.productCompare.dto.response.ProductCompareResponse;
import com.ecommerce.modules.productCompare.mapper.ProductCompareMapper;
import com.ecommerce.modules.productCompare.repository.ProductCompareRepository;
import com.ecommerce.modules.productCompare.service.ProductCompareService;
import com.ecommerce.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductCompareServiceImpl implements ProductCompareService {

    private final ProductCompareRepository compareRepository;
    private final UserRepository userRepository;
    private final ProductCompareMapper compareMapper;

    @Override
    public List<ProductCompareResponse> getUserCompareList(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        List<ProductCompare> compares = compareRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId());

        return compares.stream()
                .map(compareMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addProductToCompare(String userEmail, Long productId) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        if (compareRepository.existsByUserIdAndProductId(user.getId(), productId)) {
            throw new IllegalArgumentException("Sản phẩm này đã có trong danh sách so sánh");
        }

        // Giới hạn so sánh tối đa 4 sản phẩm
        if (compareRepository.countByUserId(user.getId()) >= 4) {
            throw new IllegalArgumentException("Chỉ có thể so sánh tối đa 4 sản phẩm cùng lúc");
        }

        ProductCompare compareItem = ProductCompare.builder()
                .user(user)
                .productId(productId)
                .build();
        compareRepository.save(compareItem);
    }

    @Override
    @Transactional
    public void removeProductFromCompare(String userEmail, Long productId) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        compareRepository.deleteByUserIdAndProductId(user.getId(), productId);
    }

    @Override
    @Transactional
    public void clearUserCompareList(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        compareRepository.deleteAllByUserId(user.getId());
    }
}