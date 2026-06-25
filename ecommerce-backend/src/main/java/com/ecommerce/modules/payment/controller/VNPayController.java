package com.ecommerce.modules.payment.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.order.dto.response.OrderResponse;
import com.ecommerce.modules.order.service.OrderService;
import com.ecommerce.modules.payment.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments/vnpay")
@RequiredArgsConstructor
@Slf4j
public class VNPayController {

    private final VNPayService vnPayService;
    private final OrderService orderService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * Tạo URL thanh toán VNPay cho một đơn hàng đã tồn tại.
     * Frontend gọi API này sau khi tạo đơn (PENDING),
     * rồi redirect user sang URL trả về để thanh toán trên trang VNPay.
     *
     * @param orderId ID đơn hàng cần thanh toán
     * @return URL redirect sang cổng VNPay
     */
    @PostMapping("/create/{orderId}")
    public ApiResponse<Map<String, String>> createPayment(
            @PathVariable Long orderId,
            HttpServletRequest request) {

        OrderResponse order = orderService.getOrderById(orderId);
        if (order == null) {
            throw new RuntimeException("Không tìm thấy đơn hàng #" + orderId);
        }

        double amount = order.getTotalAmount() != null ? order.getTotalAmount() : 0;
        String orderInfo = "Thanh toan don hang DH" + orderId;

        String paymentUrl = vnPayService.createPaymentUrl(orderId, amount, orderInfo, request);

        Map<String, String> result = new HashMap<>();
        result.put("paymentUrl", paymentUrl);

        return ApiResponse.<Map<String, String>>builder()
                .result(result)
                .build();
    }

    /**
     * VNPay redirect user về URL này sau khi thanh toán xong.
     * Backend verify chữ ký → cập nhật trạng thái đơn → redirect về frontend.
     *
     * URL cấu hình: VNPAY_RETURN_URL=https://hitcinsight.id.vn/api/v1/payments/vnpay/return
     */
    @GetMapping("/return")
    public ResponseEntity<Void> handleReturn(HttpServletRequest request) {
        Map<String, String> vnpParams = extractVnpParams(request);

        String vnpResponseCode = vnpParams.get("vnp_ResponseCode");
        String vnpTxnRef = vnpParams.get("vnp_TxnRef");

        log.info("VNPay return: txnRef={}, responseCode={}", vnpTxnRef, vnpResponseCode);

        boolean isValid = vnPayService.verifyPayment(vnpParams);
        boolean isSuccess = isValid && "00".equals(vnpResponseCode);

        // Cập nhật trạng thái đơn hàng
        if (isSuccess && vnpTxnRef != null) {
            try {
                Long orderId = Long.parseLong(vnpTxnRef);
                OrderResponse order = orderService.getOrderById(orderId);
                if (order != null && !"PAID".equalsIgnoreCase(String.valueOf(order.getPaymentStatus()))) {
                    orderService.updatePaymentStatus(orderId, "PAID");
                    log.info("✅ VNPay: Đơn #{} thanh toán thành công", orderId);
                }
            } catch (NumberFormatException e) {
                log.error("VNPay return: txnRef không phải số: {}", vnpTxnRef);
            }
        }

        // Redirect về frontend với kết quả
        String redirectUrl = frontendUrl + "/payment/vnpay-return"
                + "?vnp_ResponseCode=" + (vnpResponseCode != null ? vnpResponseCode : "99")
                + "&vnp_TxnRef=" + (vnpTxnRef != null ? vnpTxnRef : "")
                + "&success=" + isSuccess;

        return ResponseEntity.status(302)
                .header("Location", redirectUrl)
                .build();
    }

    /**
     * VNPay IPN (Instant Payment Notification) — server-to-server callback.
     * VNPay gọi endpoint này song song với return URL.
     * Đây là cơ chế backup nếu user đóng browser trước khi return.
     */
    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> handleIPN(HttpServletRequest request) {
        Map<String, String> vnpParams = extractVnpParams(request);

        String vnpResponseCode = vnpParams.get("vnp_ResponseCode");
        String vnpTxnRef = vnpParams.get("vnp_TxnRef");

        log.info("VNPay IPN: txnRef={}, responseCode={}", vnpTxnRef, vnpResponseCode);

        boolean isValid = vnPayService.verifyPayment(vnpParams);

        if (!isValid) {
            log.warn("VNPay IPN: chữ ký không hợp lệ");
            return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Checksum"));
        }

        if (!"00".equals(vnpResponseCode)) {
            log.info("VNPay IPN: giao dịch thất bại, code={}", vnpResponseCode);
            return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
        }

        // Cập nhật trạng thái đơn hàng
        if (vnpTxnRef != null) {
            try {
                Long orderId = Long.parseLong(vnpTxnRef);
                OrderResponse order = orderService.getOrderById(orderId);

                if (order == null) {
                    return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order not found"));
                }

                if ("PAID".equalsIgnoreCase(String.valueOf(order.getPaymentStatus()))) {
                    // Đã xử lý rồi (có thể return URL đã xử lý trước)
                    return ResponseEntity.ok(Map.of("RspCode", "02", "Message", "Already confirmed"));
                }

                orderService.updatePaymentStatus(orderId, "PAID");
                log.info("✅ VNPay IPN: Đơn #{} thanh toán thành công", orderId);

            } catch (NumberFormatException e) {
                log.error("VNPay IPN: txnRef không phải số: {}", vnpTxnRef);
                return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Invalid TxnRef"));
            }
        }

        return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
    }

    /**
     * Trích xuất tất cả tham số vnp_* từ request.
     */
    private Map<String, String> extractVnpParams(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        Map<String, String[]> requestParams = request.getParameterMap();

        for (Map.Entry<String, String[]> entry : requestParams.entrySet()) {
            String[] values = entry.getValue();
            if (values != null && values.length > 0) {
                params.put(entry.getKey(), values[0]);
            }
        }
        return params;
    }
}
