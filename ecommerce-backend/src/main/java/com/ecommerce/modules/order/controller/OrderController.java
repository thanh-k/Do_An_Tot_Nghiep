package com.ecommerce.modules.order.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.order.dto.request.OrderRequest;
import com.ecommerce.modules.order.dto.response.OrderResponse;
import com.ecommerce.modules.order.service.OrderService;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    public ApiResponse<OrderResponse> create(@RequestBody OrderRequest request) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderService.createOrder(request))
                .build();
    }

    // API lấy danh sách đơn hàng của User
    @GetMapping("/my-orders")
    public ApiResponse<List<OrderResponse>> getMyOrders(@RequestParam String userId) {
        // Trong thực tế, sau này khi làm Auth, ta lấy userId từ token,
        // không cần truyền userId qua RequestParam đâu nhé!
        return ApiResponse.<List<OrderResponse>>builder()
                .result(orderService.getOrdersByUserId(userId))
                .build();
    }

    // API xem chi tiết 1 đơn hàng
    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getOrderById(@PathVariable Long id) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderService.getOrderById(id))
                .build();
    }

    // Lấy tất cả đơn hàng (Dành cho Admin)
    @GetMapping
    public ApiResponse<List<OrderResponse>> getAllOrders() {
        return ApiResponse.<List<OrderResponse>>builder()
                .result(orderService.getAllOrders())
                .build();
    }

    // Cập nhật trạng thái đơn hàng (Dành cho Admin)
    @PutMapping("/{id}/status")
    public ApiResponse<OrderResponse> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderService.updateOrderStatus(id, status))
                .build();
    }

    // Xóa đơn hàng (Dành cho Admin)
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ApiResponse.<Void>builder().build();
    }
}