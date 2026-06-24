package com.ecommerce.modules.payment.controller;

import com.ecommerce.modules.order.dto.response.OrderResponse;
import com.ecommerce.modules.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class SePayWebhookController {

    private final OrderService orderService;

    @Value("${sepay.api-key}")
    private String sePayApiKey;

    /**
     * Endpoint nhận webhook từ SePay khi có giao dịch chuyển khoản mới.
     * SePay gửi POST request với Authorization header chứa API key
     * và body chứa thông tin giao dịch (content, transferAmount, ...).
     *
     * Luồng xử lý:
     * 1. Verify API key từ header Authorization
     * 2. Parse nội dung chuyển khoản để tìm mã đơn hàng (dạng "DH123")
     * 3. So khớp số tiền chuyển khoản với totalAmount đơn hàng
     * 4. Cập nhật trạng thái đơn hàng thành PAID
     */
    @PostMapping("/sepay/webhook")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> payload) {

        // 1. Verify API Key — SePay gửi dạng "Apikey <key>"
        String expectedAuth = "Apikey " + sePayApiKey;
        if (!expectedAuth.equals(auth)) {
            log.warn("SePay webhook: sai API key, auth={}", auth);
            return ResponseEntity.status(401)
                    .body(Map.of("status", "error", "message", "Unauthorized"));
        }

        // 2. Lấy thông tin từ payload webhook
        String content = String.valueOf(payload.getOrDefault("content", ""));
        Object transferAmountObj = payload.get("transferAmount");
        double transferAmount = 0;
        if (transferAmountObj instanceof Number) {
            transferAmount = ((Number) transferAmountObj).doubleValue();
        }

        log.info("SePay webhook nhận: content={}, amount={}", content, transferAmount);

        // 3. Tìm orderId trong nội dung chuyển khoản
        //    Hỗ trợ cả "DH123" và "DH 123" (có khoảng trắng)
        Pattern pattern = Pattern.compile("DH\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(content);

        if (!matcher.find()) {
            log.info("Không tìm thấy mã đơn hàng trong nội dung: {}", content);
            return ResponseEntity.ok(Map.of("status", "ok", "message", "No order found"));
        }

        Long orderId = Long.parseLong(matcher.group(1));

        // 4. Lấy đơn hàng và so khớp số tiền
        try {
            OrderResponse order = orderService.getOrderById(orderId);
            if (order == null) {
                log.warn("Không tìm thấy đơn hàng #{}", orderId);
                return ResponseEntity.ok(Map.of("status", "ok"));
            }

            double expectedAmount = order.getTotalAmount() != null
                    ? order.getTotalAmount() : 0;

            // Chấp nhận sai số ±1000đ (phòng trường hợp làm tròn)
            if (Math.abs(transferAmount - expectedAmount) > 1000) {
                log.warn("Số tiền không khớp: nhận {}đ, cần {}đ cho đơn #{}",
                        transferAmount, expectedAmount, orderId);
                return ResponseEntity.ok(Map.of("status", "ok", "message", "Amount mismatch"));
            }

            // 5. Cập nhật trạng thái PAID (chỉ khi chưa PAID)
            if (!"PAID".equals(order.getStatus())) {
                orderService.updatePaymentStatus(orderId, "PAID");
                log.info("✅ Đơn hàng #{} đã thanh toán: {}đ", orderId, transferAmount);
            }

        } catch (Exception e) {
            log.error("Lỗi xử lý webhook cho đơn #{}: {}", orderId, e.getMessage());
        }

        // Luôn trả 200 OK cho SePay để tránh retry
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
