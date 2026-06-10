package com.ecommerce.modules.order.service;

import java.util.List;

import com.ecommerce.modules.order.dto.request.OrderRequest;
import com.ecommerce.modules.order.dto.response.OrderResponse;

public interface OrderService {
    OrderResponse createOrder(OrderRequest request);

    List<OrderResponse> getOrdersByUserId(String userId);

    OrderResponse getOrderById(Long id);

    // --- BỔ SUNG 3 HÀM MỚI NÀY CHO ADMIN ---
    List<OrderResponse> getAllOrders();

    OrderResponse updateOrderStatus(Long id, String status);

    void deleteOrder(Long id);
    OrderResponse updatePaymentStatus(Long id, String paymentStatus);
}