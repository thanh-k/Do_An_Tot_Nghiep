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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
                .paymentMethod(request.getPaymentMethod())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        List<OrderDetail> details = new ArrayList<>();
        double total = 0;
        Map<String, Double> reservedLiveDealPrices = reserveLivestreamDeals(request.getItems());

        for (CartItemRequest item : request.getItems()) {
            ProductVariant variant = variantRepository.findById(item.getVariantId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

            // Kiểm tra xem kho còn đủ hàng không
            if (variant.getStock() < item.getQuantity()) {
                throw new RuntimeException("Sản phẩm '" + variant.getSku() + "' không đủ số lượng trong kho!");
                // (Sau này bạn có thể tạo thêm ErrorCode.OUT_OF_STOCK để throw AppException
                // chuẩn hơn)
            }

            double priceAtPurchase = resolvePriceAtPurchase(item, variant, reservedLiveDealPrices);

            // Trừ số lượng tồn kho
            variant.setStock(variant.getStock() - item.getQuantity());

            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .productVariant(variant)
                    .quantity(item.getQuantity())
                    .priceAtPurchase(priceAtPurchase)
                    .build();

            details.add(detail);
            total += priceAtPurchase * item.getQuantity();
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
                throw new RuntimeException("Dữ liệu deal livestream không hợp lệ");
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
                    .orElseThrow(() -> new RuntimeException("Deal live đã kết thúc hoặc hết số lượng"));

            Long dealProductId = deal.getProduct() == null ? null : deal.getProduct().getId();
            if (dealProductId == null) {
                throw new RuntimeException("Deal livestream không hợp lệ");
            }

            for (CartItemRequest item : items) {
                if (!entry.getKey().equals(liveDealKey(item.getLivestreamId(), item.getLiveDealId()))) {
                    continue;
                }

                ProductVariant variant = variantRepository.findById(item.getVariantId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
                Long variantProductId = variant.getProduct() == null ? null : variant.getProduct().getId();

                if (!dealProductId.equals(variantProductId)) {
                    throw new RuntimeException("Deal livestream không khớp với sản phẩm thanh toán");
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

                throw new RuntimeException("Deal live chỉ còn " + remainingQuantity
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
            throw new RuntimeException("Dữ liệu deal livestream không hợp lệ");
        }

        Double liveDealPrice = reservedLiveDealPrices.get(liveDealKey(item.getLivestreamId(), item.getLiveDealId()));
        if (liveDealPrice == null) {
            throw new RuntimeException("Deal live đã kết thúc hoặc hết số lượng");
        }

        return liveDealPrice;
    }

    private int safeQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new RuntimeException("Số lượng sản phẩm không hợp lệ");
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
        String oldStatus = order.getStatus();
        order.setStatus(status);
        Order saved = orderRepository.save(order);

        if (!isCompletedStatus(oldStatus) && isCompletedStatus(status) && hasCashbackVoucher(saved)) {
            coinTaskService.rewardOrderCompleted(saved.getUserId(), saved.getId());
        }

        return orderMapper.toResponse(saved);
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
     * Ví dụ voucher id 16/category CASHBACK/code 11 trong database của bạn.
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        orderRepository.delete(order);
    }

    @Override
    @Transactional
    public OrderResponse updatePaymentStatus(Long id, String paymentStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        order.setStatus(paymentStatus);
        return orderMapper.toResponse(orderRepository.save(order));
    }
}