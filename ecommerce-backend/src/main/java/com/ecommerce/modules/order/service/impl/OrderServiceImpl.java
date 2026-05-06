package com.ecommerce.modules.order.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.modules.order.dto.request.CartItemRequest;
import com.ecommerce.modules.order.dto.request.OrderRequest;
import com.ecommerce.modules.order.dto.response.OrderResponse;

import com.ecommerce.modules.order.mapper.OrderMapper;
import com.ecommerce.modules.order.repository.OrderRepository;
import com.ecommerce.modules.order.service.OrderService;
import com.ecommerce.modules.product.repository.ProductVariantRepository;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderDetail;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.modules.voucher.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final OrderMapper orderMapper;
    private final OrderRepository orderRepository;
    private final ProductVariantRepository variantRepository;
    private final VoucherService voucherService;

    @Override
    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        Order order = Order.builder()
                .userId(request.getUserId()) // Lưu user_id vào database
                .shippingAddress(request.getShippingAddress())
                .phoneNumber(request.getPhoneNumber())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        List<OrderDetail> details = new ArrayList<>();
        double total = 0;

        for (CartItemRequest item : request.getItems()) {
            ProductVariant variant = variantRepository.findById(item.getVariantId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

            // Kiểm tra xem kho còn đủ hàng không
            if (variant.getStock() < item.getQuantity()) {
                throw new RuntimeException("Sản phẩm '" + variant.getSku() + "' không đủ số lượng trong kho!");
                // (Sau này bạn có thể tạo thêm ErrorCode.OUT_OF_STOCK để throw AppException
                // chuẩn hơn)
            }

            // Trừ số lượng tồn kho
            variant.setStock(variant.getStock() - item.getQuantity());

            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .productVariant(variant)
                    .quantity(item.getQuantity())
                    .priceAtPurchase(variant.getPrice())
                    .build();

            details.add(detail);
            total += variant.getPrice() * item.getQuantity();
        }

        double shippingFee = total >= 500000 ? 0D : 30000D;
        double discountAmount = 0D;

        // Xử lý Voucher nếu có
        if (request.getVoucherCode() != null && !request.getVoucherCode().trim().isEmpty()) {
            discountAmount = voucherService.calculateDiscount(request.getVoucherCode(), total);
            order.setVoucherCode(request.getVoucherCode());
            voucherService.decrementQuantity(request.getVoucherCode());
        }

        order.setShippingFee(shippingFee);
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(Math.max(0, total - discountAmount) + shippingFee);

        order.setOrderDetails(details);
        orderRepository.save(order);

        // Trả về DTO (Ní tự viết hàm convertToResponse nhé)
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByUserId(String userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(orderMapper::toResponse) // Dùng luôn mapper đã viết!
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng")); // Tạm dùng RuntimeException, nên
                                                                                                                               // tạo ErrorCode.ORDER_NOT_FOUND
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(orderMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        order.setStatus(status);
        return orderMapper.toResponse(orderRepository.save(order));
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        orderRepository.delete(order);
    }
}