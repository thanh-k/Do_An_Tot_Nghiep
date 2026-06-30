package com.ecommerce.modules.order.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.modules.order.dto.request.CartItemRequest;
import com.ecommerce.modules.order.dto.request.OrderRequest;
import com.ecommerce.modules.order.dto.response.OrderResponse;

import com.ecommerce.modules.coin.service.CoinTaskService;
import com.ecommerce.modules.order.mapper.OrderMapper;
import com.ecommerce.modules.order.repository.OrderRepository;
import com.ecommerce.modules.order.service.OrderService;
import com.ecommerce.modules.product.repository.ProductVariantRepository;
import com.ecommerce.modules.livestream.entity.LivestreamDeal;
import com.ecommerce.modules.livestream.repository.LivestreamDealRepository;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderDetail;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.entity.Voucher;
import com.ecommerce.modules.voucher.repository.VoucherRepository;
import com.ecommerce.modules.voucher.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final OrderMapper orderMapper;
    private final OrderRepository orderRepository;
    private final ProductVariantRepository variantRepository;
    private final VoucherService voucherService;
    private final CoinTaskService coinTaskService;
    private final VoucherRepository voucherRepository;
    private final LivestreamDealRepository livestreamDealRepository;

    @Override
    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        Order order = Order.builder()
                .userId(request.getUserId()) // Lưu user_id vào database
                .shippingAddress(request.getShippingAddress())
                .phoneNumber(request.getPhoneNumber())
                .paymentMethod(normalizePaymentMethod(request.getPaymentMethod()))
                .paymentStatus("UNPAID")
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        List<OrderDetail> details = new ArrayList<>();
        double total = 0;
        Map<String, Double> reservedLiveDealPrices = reserveLivestreamDeals(request.getItems());

        for (CartItemRequest item : request.getItems()) {
            ProductVariant variant = variantRepository.findById(item.getVariantId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND, "Không tìm thấy biến thể sản phẩm với ID: " + item.getVariantId()));

            // Trừ số lượng tồn kho an toàn bằng Atomic Update
            int updated = variantRepository.decrementStockIfAvailable(variant.getId(), item.getQuantity());
            if (updated == 0) {
                throw new AppException(ErrorCode.INVALID_PRODUCT_DATA, "Sản phẩm '" + variant.getSku() + "' không đủ số lượng trong kho hoặc đã có người khác mua!");
            }

            double priceAtPurchase = resolvePriceAtPurchase(item, variant, reservedLiveDealPrices);

            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .productVariant(variant)
                    .quantity(item.getQuantity())
                    .priceAtPurchase(priceAtPurchase)
                    .build();

            details.add(detail);
            total += priceAtPurchase * item.getQuantity();
        }

        double shippingFee = total >= 500000.0 ? 0D : 30000D;
        double itemDiscount = 0D;
        double shippingDiscount = 0D;
        double rawDiscountForDB = 0D;

        // Xử lý Voucher nếu có
        if (request.getVoucherCode() != null && !request.getVoucherCode().trim().isEmpty()) {
            String code = request.getVoucherCode().trim();
            Voucher voucher = voucherRepository.findByCode(code).orElse(null);
            
            if (voucher != null) {
                double rawDiscount = voucherService.calculateDiscount(code, total);
                rawDiscountForDB = rawDiscount;
                
                if ("SHIPPING".equalsIgnoreCase(voucher.getCategory())) {
                    shippingDiscount = Math.min(shippingFee, rawDiscount);
                } else if ("CASHBACK".equalsIgnoreCase(voucher.getCategory())) {
                    // Cashback không giảm trừ vào tổng tiền hóa đơn
                    rawDiscountForDB = 0D; 
                } else {
                    itemDiscount = rawDiscount;
                }
                order.setVoucherCode(code);
            }
        }

        double finalShippingFee = shippingFee - shippingDiscount;
        
        order.setShippingFee(shippingFee);
        // Lưu discountAmount dựa trên tổng discount thực tế được trừ vào bill (hoặc rawDiscount tuỳ logic hiển thị UI)
        // Nếu UI hiển thị - giá trị giảm giá thì ta cứ lưu nguyên giá trị voucher giảm giá (nếu ko phải cashback)
        order.setDiscountAmount(rawDiscountForDB);
        order.setTotalAmount(Math.max(0, total - itemDiscount) + finalShippingFee);
        order.setOrderDetails(details);
        Order savedOrder = orderRepository.save(order);

        // Trừ tạm thời số lượng voucher tổng và lượt dùng của user sau khi đơn hàng đã được lưu thành công
        if (savedOrder.getVoucherCode() != null && !savedOrder.getVoucherCode().isBlank()) {
            voucherService.decrementQuantity(savedOrder.getVoucherCode());
        }

        // Trả về DTO (Ní tự viết hàm convertToResponse nhé)
        return orderMapper.toResponse(order);
    }

    /**
     * Đơn hàng thường: không gửi liveDealId/livestreamId => dùng giá variant như cũ.
     * Đơn hàng live: validate và giữ suất deal theo tổng số lượng của toàn bộ item cùng liveDealId.
     * Nếu tổng số lượng vượt số deal còn lại thì chặn mua giá live, không tự chuyển phần dư sang giá gốc.
     */
    private Map<String, Double> reserveLivestreamDeals(List<CartItemRequest> items) {
        Map<String, Integer> quantityByDealKey = new HashMap<>();

        for (CartItemRequest item : items) {
            if (item.getLiveDealId() == null && item.getLivestreamId() == null) {
                continue;
            }

            if (item.getLiveDealId() == null || item.getLivestreamId() == null) {
                throw new AppException(ErrorCode.INVALID_PRODUCT_DATA, "Dữ liệu deal livestream không hợp lệ");
            }

            String key = liveDealKey(item.getLivestreamId(), item.getLiveDealId());
            quantityByDealKey.merge(key, safeQuantity(item.getQuantity()), Integer::sum);
        }

        Map<String, Double> reservedPrices = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();

        for (Map.Entry<String, Integer> entry : quantityByDealKey.entrySet()) {
            Long livestreamId = parseLivestreamId(entry.getKey());
            Long liveDealId = parseLiveDealId(entry.getKey());
            int requestedQuantity = entry.getValue();

            LivestreamDeal deal = livestreamDealRepository
                    .findUsableDeal(liveDealId, livestreamId, now)
                    .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_INVALID, "Deal live đã kết thúc hoặc hết số lượng"));

            Long dealProductId = deal.getProduct() == null ? null : deal.getProduct().getId();
            if (dealProductId == null) {
                throw new AppException(ErrorCode.INVALID_PRODUCT_DATA, "Deal livestream không hợp lệ");
            }

            for (CartItemRequest item : items) {
                if (!entry.getKey().equals(liveDealKey(item.getLivestreamId(), item.getLiveDealId()))) {
                    continue;
                }

                ProductVariant variant = variantRepository.findById(item.getVariantId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
                Long variantProductId = variant.getProduct() == null ? null : variant.getProduct().getId();

                if (!dealProductId.equals(variantProductId)) {
                    throw new AppException(ErrorCode.INVALID_PRODUCT_DATA, "Deal livestream không khớp với sản phẩm thanh toán");
                }
            }

            int quantitySold = deal.getQuantitySold() == null ? 0 : deal.getQuantitySold();
            int quantityLimit = deal.getQuantityLimit() == null ? Integer.MAX_VALUE : deal.getQuantityLimit();
            int remainingQuantity = Math.max(0, quantityLimit - quantitySold);

            if (requestedQuantity > remainingQuantity) {
                if (remainingQuantity <= 0) {
                    deal.setActive(false);
                    deal.setStatus("EXPIRED");
                    livestreamDealRepository.save(deal);
                }

                throw new AppException(ErrorCode.INVALID_PRODUCT_DATA, "Deal live chỉ còn " + remainingQuantity
                        + " suất. Vui lòng giảm số lượng để toàn bộ sản phẩm được áp dụng giá live.");
            }

            deal.setQuantitySold(quantitySold + requestedQuantity);
            if (deal.getQuantityLimit() != null && deal.getQuantitySold() >= deal.getQuantityLimit()) {
                deal.setActive(false);
                deal.setStatus("EXPIRED");
            }
            livestreamDealRepository.save(deal);
            reservedPrices.put(entry.getKey(), deal.getDealPrice());
        }

        return reservedPrices;
    }

    private double resolvePriceAtPurchase(CartItemRequest item,
                                          ProductVariant variant,
                                          Map<String, Double> reservedLiveDealPrices) {
        if (item.getLiveDealId() == null && item.getLivestreamId() == null) {
            return variant.getPrice();
        }

        if (item.getLiveDealId() == null || item.getLivestreamId() == null) {
            throw new AppException(ErrorCode.INVALID_PRODUCT_DATA, "Dữ liệu deal livestream không hợp lệ");
        }

        Double liveDealPrice = reservedLiveDealPrices.get(liveDealKey(item.getLivestreamId(), item.getLiveDealId()));
        if (liveDealPrice == null) {
            throw new AppException(ErrorCode.VOUCHER_INVALID, "Deal live đã kết thúc hoặc hết số lượng");
        }

        return liveDealPrice;
    }

    private int safeQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new AppException(ErrorCode.INVALID_PRODUCT_DATA, "Số lượng sản phẩm không hợp lệ");
        }
        return quantity;
    }

    private String liveDealKey(Long livestreamId, Long liveDealId) {
        if (livestreamId == null || liveDealId == null) {
            return "";
        }
        return livestreamId + ":" + liveDealId;
    }

    private Long parseLivestreamId(String key) {
        return Long.parseLong(key.split(":")[0]);
    }

    private Long parseLiveDealId(String key) {
        return Long.parseLong(key.split(":")[1]);
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
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND, "Không tìm thấy đơn hàng với ID: " + id));
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
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND, "Không tìm thấy đơn hàng với ID: " + id));

        String oldStatus = order.getStatus();
        String normalizedStatus = normalizeOrderStatus(status);
        order.setStatus(normalizedStatus);

        // COD / nhận hàng rồi thanh toán:
        // Khi đơn đã giao hoặc hoàn tất thì xem như shop đã thu tiền từ khách.
        if (isCashOnDelivery(order.getPaymentMethod()) && isCompletedStatus(normalizedStatus)) {
            order.setPaymentStatus("PAID");
        }

        Order saved = orderRepository.save(order);

        // Khi đơn hàng chuyển sang trạng thái HOÀN TẤT
        if (!isCompletedStatus(oldStatus) && isCompletedStatus(normalizedStatus)) {
            // Cộng xu nếu có voucher cashback
            if (hasCashbackVoucher(saved)) {
                coinTaskService.rewardOrderCompleted(saved.getUserId(), saved.getId());
            }
        }
        
        // Refund stock and voucher if cancelled via API
        if (!"CANCELLED".equalsIgnoreCase(oldStatus) && "CANCELLED".equalsIgnoreCase(normalizedStatus)) {
            if (saved.getOrderDetails() != null) {
                for (OrderDetail detail : saved.getOrderDetails()) {
                    ProductVariant variant = detail.getProductVariant();
                    if (variant != null && variant.getId() != null) {
                        variantRepository.incrementStock(variant.getId(), detail.getQuantity());
                    }
                }
            }
            if (saved.getVoucherCode() != null && !saved.getVoucherCode().trim().isEmpty()) {
                voucherService.incrementQuantity(saved.getVoucherCode().trim(), saved.getUserId());
            }
        }

        return orderMapper.toResponse(saved);
    }


    private String normalizeOrderStatus(String status) {
        if (status == null || status.isBlank()) {
            return "PENDING";
        }
        return status.trim().toUpperCase();
    }

    private String normalizePaymentStatus(String paymentStatus) {
        if (paymentStatus == null || paymentStatus.isBlank()) {
            return "UNPAID";
        }

        String normalized = paymentStatus.trim().toUpperCase();
        if ("PENDING".equals(normalized)) {
            return "UNPAID";
        }
        if ("PAID".equals(normalized) || "UNPAID".equals(normalized) || "REFUNDED".equals(normalized)) {
            return normalized;
        }
        return normalized;
    }

    private String normalizePaymentMethod(String paymentMethod) {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            return "COD";
        }
        return paymentMethod.trim().toUpperCase();
    }

    private boolean isCashOnDelivery(String paymentMethod) {
        return "COD".equalsIgnoreCase(String.valueOf(paymentMethod).trim());
    }

    private boolean isCompletedStatus(String status) {
        if (status == null)
            return false;
        String normalized = status.trim().toUpperCase();
        return normalized.equals("COMPLETED")
                || normalized.equals("COMPLETE")
                || normalized.equals("DELIVERED")
                || normalized.equals("PAID")
                || normalized.equals("DONE");
    }

    /**
     * Chỉ cộng 15 xu hoàn đơn khi đơn hàng có áp voucher thuộc category CASHBACK.
     * Ví dụ voucher id 16/category CASHBACK/code 11 trong database.
     */
    private boolean hasCashbackVoucher(Order order) {
        if (order == null || order.getVoucherCode() == null || order.getVoucherCode().isBlank()) {
            return false;
        }

        return voucherRepository.findByCode(order.getVoucherCode().trim())
                .map(Voucher::getCategory)
                .map(category -> "CASHBACK".equalsIgnoreCase(category))
                .orElse(false);
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND, "Không tìm thấy đơn hàng với ID: " + id));
        orderRepository.delete(order);
    }

    @Override
    @Transactional
    public OrderResponse updatePaymentStatus(Long id, String paymentStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        String normalizedPaymentStatus = normalizePaymentStatus(paymentStatus);
        
        // Khôi phục đơn hàng nếu thanh toán trễ (đã bị hủy bởi cron job)
        if ("PAID".equalsIgnoreCase(normalizedPaymentStatus) && "CANCELLED".equalsIgnoreCase(order.getStatus())) {
            order.setStatus("PENDING");
            
            // Trừ lại kho
            if (order.getOrderDetails() != null) {
                for (OrderDetail detail : order.getOrderDetails()) {
                    ProductVariant variant = detail.getProductVariant();
                    if (variant != null && variant.getId() != null) {
                        variantRepository.decrementStockIfAvailable(variant.getId(), detail.getQuantity());
                    }
                }
            }
            
            // Trừ lại voucher
            if (order.getVoucherCode() != null && !order.getVoucherCode().trim().isEmpty()) {
                voucherService.decrementQuantity(order.getVoucherCode().trim(), order.getUserId());
            }
            log.info("Đã khôi phục đơn hàng #{} từ CANCELLED -> PENDING do khách hàng thanh toán trễ.", id);
        }

        // Thanh toán online chỉ cập nhật trạng thái thanh toán.
        // Không đổi trạng thái xử lý đơn hàng để tránh nhầm "đã thanh toán" với "đã giao/hoàn tất".
        order.setPaymentStatus(normalizedPaymentStatus);

        return orderMapper.toResponse(orderRepository.save(order));
    }

    /**
     * Cron job tự động hủy các đơn hàng thanh toán online (VNPAY) 
     * nếu quá 20 phút mà vẫn ở trạng thái PENDING.
     * Chạy mỗi 1 phút (60000 ms).
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cancelExpiredOnlineOrders() {
        // Buffer 22 phút thay vì 20 để tránh race condition với webhook SePay/VNPay
        // (Webhook có thể đến sau vài giây → cần đảm bảo paymentStatus đã được cập nhật)
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(22);
        List<Order> expiredOrders = orderRepository.findExpiredPendingOrders(cutoff);

        for (Order order : expiredOrders) {
            // Re-fetch để lấy paymentStatus mới nhất từ DB (tránh stale cache)
            Order freshOrder = orderRepository.findById(order.getId()).orElse(null);
            if (freshOrder == null) continue;

            // Không hủy nếu đã được thanh toán (webhook có thể vừa cập nhật)
            if ("PAID".equalsIgnoreCase(freshOrder.getPaymentStatus())) {
                log.info("Bỏ qua hủy đơn #{}: đã được thanh toán (webhook đến trễ).", freshOrder.getId());
                continue;
            }

            freshOrder.setStatus("CANCELLED");

            // Hoàn lại kho
            if (freshOrder.getOrderDetails() != null) {
                for (OrderDetail detail : freshOrder.getOrderDetails()) {
                    ProductVariant variant = detail.getProductVariant();
                    if (variant != null && variant.getId() != null) {
                        variantRepository.incrementStock(variant.getId(), detail.getQuantity());
                    }
                }
            }

            // Hoàn lại voucher
            if (freshOrder.getVoucherCode() != null && !freshOrder.getVoucherCode().trim().isEmpty()) {
                voucherService.incrementQuantity(freshOrder.getVoucherCode().trim(), freshOrder.getUserId());
            }

            orderRepository.save(freshOrder);
            log.info("Đã tự động hủy đơn hàng online hết hạn và hoàn kho: DH{}", freshOrder.getId());
        }
    }
}