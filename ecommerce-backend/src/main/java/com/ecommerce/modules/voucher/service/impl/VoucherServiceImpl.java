package com.ecommerce.modules.voucher.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserVoucher;
import com.ecommerce.entity.Voucher;
import com.ecommerce.modules.membership.entity.MembershipSubscription;
import com.ecommerce.modules.membership.entity.MembershipSubscriptionStatus;
import com.ecommerce.modules.membership.repository.MembershipSubscriptionRepository;
import com.ecommerce.modules.order.repository.OrderRepository;
import com.ecommerce.modules.user.repository.UserRepository;
import com.ecommerce.modules.upload.service.LocalStorageService;
import com.ecommerce.modules.voucher.dto.request.VoucherRequest;
import com.ecommerce.modules.voucher.dto.response.VoucherResponse;
import com.ecommerce.modules.voucher.mapper.VoucherMapper;
import com.ecommerce.modules.voucher.repository.UserVoucherRepository;
import com.ecommerce.modules.voucher.repository.VoucherRepository;
import com.ecommerce.modules.voucher.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private static final String COIN_VOUCHER_CATEGORY = "COIN_REWARD";

    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final MembershipSubscriptionRepository membershipSubscriptionRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final VoucherMapper voucherMapper;
    private final LocalStorageService localStorageService;

    private String getPublicIdFromUrl(String url) {
        if (url == null || url.isEmpty())
            return null;
        int uploadIndex = url.indexOf("/upload/");
        if (uploadIndex == -1)
            return null;
        try {
            String path = url.substring(uploadIndex + "/upload/".length());
            path = path.replaceFirst("^v\\d+/", "");
            int lastDotIndex = path.lastIndexOf('.');
            if (lastDotIndex != -1) {
                path = path.substring(0, lastDotIndex);
            }
            return path;
        } catch (Exception e) {
            return null;
        }
    }

    private void validateVoucherRequest(VoucherRequest request) {
        if (request.getCode() == null || request.getCode().trim().isEmpty()
                || request.getCategory() == null || request.getCategory().trim().isEmpty()
                || request.getDiscountType() == null || request.getDiscountType().trim().isEmpty()
                || request.getDiscountValue() == null || request.getDiscountValue() <= 0
                || request.getMinOrderValue() == null || request.getMinOrderValue() < 0
                || request.getQuantity() == null || request.getQuantity() < 1
                || request.getExpiryDate() == null) {
            throw new AppException(ErrorCode.INVALID_VOUCHER_DATA);
        }

        if (COIN_VOUCHER_CATEGORY.equalsIgnoreCase(request.getCategory())
                && (request.getCoinCost() == null || request.getCoinCost() <= 0)) {
            throw new AppException(ErrorCode.INVALID_VOUCHER_DATA);
        }

        if (request.getImage() == null || request.getImage().trim().isEmpty()) {
            throw new AppException(ErrorCode.VOUCHER_IMAGE_REQUIRED);
        }
    }

    @Override
    @Transactional
    public VoucherResponse createVoucher(VoucherRequest request) {
        log.info("Bắt đầu tạo voucher với mã: {}", request.getCode());
        validateVoucherRequest(request);

        // Kiểm tra xem mã voucher đã tồn tại chưa
        voucherRepository.findByCode(request.getCode()).ifPresent(v -> {
            log.error("Lỗi tạo voucher: Mã '{}' đã tồn tại.", request.getCode());
            throw new AppException(ErrorCode.VOUCHER_CODE_EXISTED,
                    "Mã voucher '" + request.getCode() + "' đã tồn tại.");
        });

        Voucher voucher = voucherMapper.toEntity(request);

        if (isVipVoucher(voucher)) {
            voucher.setVipOnly(true);
            voucher.setMonthlyReset(true);
            voucher.setMonthlyQuantity(
                    request.getMonthlyQuantity() != null
                            ? request.getMonthlyQuantity()
                            : request.getQuantity());
        }

        Voucher saved = voucherRepository.save(voucher);
        log.info("Đã tạo thành công voucher ID: {}, Mã: {}", saved.getId(), saved.getCode());
        return voucherMapper.toResponse(saved);
    }

    @Override
    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAll()
                .stream()
                .map(voucherMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public List<VoucherResponse> getMyVouchers() {
        log.info("Bắt đầu lấy danh sách voucher của người dùng.");
        User user = getCurrentAuthenticatedUser();
        syncVipVouchersForUser(user);

        LocalDateTime now = LocalDateTime.now();
        List<VoucherResponse> results = new ArrayList<>();
        // Lấy danh sách ID voucher đã được claim vào ví dưới DB (phải CÒN HẠN và CÒN
        // LƯỢT DÙNG)
        log.info("Lấy các voucher đã sở hữu của user ID: {}", user.getId());
        Set<Long> ownedVoucherIds = userVoucherRepository.findByUserIdAndActiveTrue(user.getId()).stream()
                .filter(uv -> uv.getValidUntil() != null && uv.getValidUntil().isAfter(now)) // Lọc hết hạn
                .filter(uv -> uv.getRemainingQuantity() != null && uv.getRemainingQuantity() > 0)
                .map(uv -> uv.getVoucher().getId())
                .collect(Collectors.toSet());

        // 1. Voucher thường còn hiệu lực và CHƯA được user này claim
        log.info("Lấy các voucher thường, chưa sở hữu.");
        voucherRepository.findByActiveTrueOrderByIdDesc().stream()
                .filter(v -> !isVipVoucher(v))
                .filter(v -> !isCoinRedeemVoucher(v))
                .filter(v -> !ownedVoucherIds.contains(v.getId()))
                .filter(v -> v.getQuantity() != null && v.getQuantity() > 0)
                .filter(v -> v.getExpiryDate() != null && v.getExpiryDate().isAfter(now))
                .map(voucherMapper::toResponse)
                .map(v -> {
                    v.setVipOnly(false);
                    v.setMonthlyReset(false);
                    v.setMonthlyQuantity(null);
                    v.setEligible(true);
                    v.setClaimable(true);
                    v.setLockedReason(null);
                    v.setClaimed(false);
                    return v;
                })
                .forEach(results::add);

        // 2. Tất cả voucher đã claim thành công (còn hạn sử dụng)
        log.info("Lấy các voucher đã claim thành công.");
        userVoucherRepository.findByUserIdAndActiveTrue(user.getId()).stream()
                .filter(uv -> uv.getValidUntil() != null && uv.getValidUntil().isAfter(now))
                .filter(uv -> uv.getRemainingQuantity() != null && uv.getRemainingQuantity() > 0)
                .map(this::toUserVoucherResponse)
                .map(v -> {
                    v.setClaimed(true);
                    return v;
                })
                .forEach(results::add);

        // 3. Voucher VIP chưa sở hữu (bị khóa)
        log.info("Lấy các voucher VIP bị khóa.");
        voucherRepository.findByCategoryIgnoreCaseAndActiveTrueOrderByIdDesc("VIP").stream()
                .filter(v -> v.getExpiryDate() != null && v.getExpiryDate().isAfter(now))
                .filter(v -> !ownedVoucherIds.contains(v.getId()))
                .map(this::toLockedVipVoucherResponse)
                .map(v -> {
                    v.setClaimed(false);
                    return v;
                })
                .forEach(results::add);

        log.info("Hoàn tất lấy danh sách voucher. Tổng cộng: {} vouchers.", results.size());
        return results;
    }

    @Override
    @Transactional
    public VoucherResponse updateVoucher(Long id, VoucherRequest request) {
        log.info("Bắt đầu cập nhật voucher ID: {}", id);
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        // Khi cập nhật, kiểm tra xem mã mới có bị trùng với một voucher khác không
        voucherRepository.findByCode(request.getCode()).ifPresent(existingVoucher -> {
            if (!existingVoucher.getId().equals(id)) {
                log.error("Lỗi cập nhật voucher: Mã '{}' đã tồn tại cho voucher khác.", request.getCode());
                throw new AppException(ErrorCode.VOUCHER_CODE_EXISTED);
            }
        });

        String oldImageUrl = voucher.getImage();
        String newImageUrl = request.getImage();

        if (newImageUrl != null
                && !newImageUrl.equals(oldImageUrl)
                && oldImageUrl != null
                && !oldImageUrl.isEmpty()) {
            try {
                String publicId = getPublicIdFromUrl(oldImageUrl);
                if (publicId != null) {
                    localStorageService.deleteFile(publicId);
                }
                log.info("Đã xóa ảnh cũ của voucher ID: {}", id);
            } catch (Exception ignored) {
            }
        }

        validateVoucherRequest(request);

        voucher.setCode(request.getCode());
        voucher.setCategory(request.getCategory());
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMinOrderValue(request.getMinOrderValue());
        voucher.setQuantity(request.getQuantity());
        voucher.setExpiryDate(request.getExpiryDate());
        voucher.setVipOnly(Boolean.TRUE.equals(request.getVipOnly()) || "VIP".equalsIgnoreCase(request.getCategory()));
        voucher.setMonthlyReset(
                Boolean.TRUE.equals(request.getMonthlyReset()) || "VIP".equalsIgnoreCase(request.getCategory()));
        voucher.setMonthlyQuantity(
                request.getMonthlyQuantity() != null
                        ? request.getMonthlyQuantity()
                        : request.getQuantity());

        if (request.getActive() != null) {
            voucher.setActive(request.getActive());
        }

        voucher.setImage(request.getImage());
        voucher.setCoinCost(request.getCoinCost());

        Voucher saved = voucherRepository.save(voucher);

        if (isVipVoucher(saved)) {

            userVoucherRepository.updateDetailsByVoucherId(saved.getId(), saved.getActive(),
                    resolveVipMonthlyQuota(saved), saved.getExpiryDate());
        }

        log.info("Đã cập nhật thành công voucher ID: {}", saved.getId());
        return voucherMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteVoucher(Long id) {
        log.info("Bắt đầu xóa voucher ID: {}", id);
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        boolean isActivelyOwnedByUser = userVoucherRepository
                .existsByVoucherIdAndValidUntilAfterAndRemainingQuantityGreaterThan(
                        id, LocalDateTime.now(), 0);

        boolean isUsedInOrders = orderRepository.existsByVoucherCode(voucher.getCode());

        // Chặn xóa nếu có người sở hữu hoặc đã có đơn hàng sử dụng
        if (isActivelyOwnedByUser || isUsedInOrders) {
            log.warn("Không thể xóa voucher ID: {}. Lý do: isActivelyOwnedByUser={}, isUsedInOrders={}", id,
                    isActivelyOwnedByUser, isUsedInOrders);
            throw new AppException(ErrorCode.VOUCHER_IN_USE,
                    "Không thể xóa voucher '" + voucher.getCode()
                            + "' vì vẫn còn khách hàng sở hữu hoặc đã được sử dụng trong đơn hàng. Vui lòng chuyển trạng thái sang 'Tắt hoạt động' thay vì xóa.");
        }

        // Nếu voucher đã hết hiệu lực và không còn ai dùng, tiến hành xóa an toàn.
        // 1. Dọn dẹp các bản ghi liên kết trong user_vouchers trước để tránh lỗi khóa
        // ngoại.
        log.info("Dọn dẹp user_vouchers cho voucher ID: {}", id);
        userVoucherRepository.deleteAllByVoucherId(id);

        // 2. Xóa voucher gốc và ảnh liên quan.
        String imageUrl = voucher.getImage();
        voucherRepository.delete(voucher);

        if (imageUrl != null && !imageUrl.isEmpty()) {
            try {
                String publicId = getPublicIdFromUrl(imageUrl);
                if (publicId != null) {
                    localStorageService.deleteFile(publicId);
                    log.info("Đã xóa ảnh của voucher ID: {}", id);
                }
            } catch (Exception ignored) {
            }
        }
        log.info("Đã xóa thành công voucher ID: {}", id);
    }

    @Override
    @Transactional
    public Map<String, Object> deleteVouchers(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of("deletedCount", 0, "undeletableCodes", List.of());
        }
        log.info("Bắt đầu xóa hàng loạt {} vouchers.", ids.size());

        List<String> undeletableVoucherCodes = new ArrayList<>();
        List<String> deletedVoucherCodes = new ArrayList<>();
        List<Long> deletableIds = new ArrayList<>();
        List<String> deletableImageUrls = new ArrayList<>();

        // Bước 1: Phân loại các voucher có thể xóa và không thể xóa.
        for (Long id : ids) {
            Voucher voucher = voucherRepository.findById(id).orElse(null);
            if (voucher != null) {
                boolean isActivelyOwnedByUser = userVoucherRepository
                        .existsByVoucherIdAndValidUntilAfterAndRemainingQuantityGreaterThan(id, LocalDateTime.now(), 0);

                boolean isUsedInOrders = orderRepository.existsByVoucherCode(voucher.getCode());

                if (isActivelyOwnedByUser || isUsedInOrders) {
                    log.warn("Không thể xóa voucher ID: {}. Lý do: isActivelyOwnedByUser={}, isUsedInOrders={}", id,
                            isActivelyOwnedByUser, isUsedInOrders);
                    undeletableVoucherCodes.add(voucher.getCode());
                } else {
                    deletableIds.add(id);
                    deletedVoucherCodes.add(voucher.getCode()); // Thêm vào danh sách đã xóa thành công
                    if (voucher.getImage() != null && !voucher.getImage().isEmpty()) {
                        deletableImageUrls.add(voucher.getImage());
                    }
                }
            }
        }

        // Bước 2: Thực hiện xóa những voucher hợp lệ
        if (!deletableIds.isEmpty()) {
            log.info("Bắt đầu thực thi xóa {} vouchers hợp lệ.", deletableIds.size());
            // Xóa các bản ghi liên kết trước
            userVoucherRepository.deleteAllByVoucherIdIn(deletableIds);
            // Sau đó xóa các voucher gốc
            voucherRepository.deleteAllByIdInBatch(deletableIds);
            log.info("Đã xóa thành công {} vouchers.", deletableIds.size());

            // Xóa ảnh liên quan trên Cloudinary
            for (String imageUrl : deletableImageUrls) {
                try {
                    String publicId = getPublicIdFromUrl(imageUrl);
                    if (publicId != null) {
                        localStorageService.deleteFile(publicId);
                    }
                } catch (Exception ignored) {
                    log.warn("Không thể xóa ảnh trên cloud: {}", imageUrl);
                }
            }
        }

        // Thay đổi ở đây: Gói kết quả vào một Map có key là "result"
        // để tương thích với cách apiClient ở frontend xử lý response.
        Map<String, Object> resultData = new HashMap<>();
        resultData.put("deletedCount", deletableIds.size());
        resultData.put("deletedCodes", deletedVoucherCodes);
        resultData.put("undeletableCodes", undeletableVoucherCodes);

        Map<String, Object> finalResponse = new HashMap<>();
        finalResponse.put("result", resultData);
        return finalResponse;
    }

    @Override
    @Transactional
    public Double calculateDiscount(String code, Double orderTotal) {
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(
                        () -> new AppException(ErrorCode.VOUCHER_NOT_FOUND, "Không tìm thấy voucher với mã: " + code));

        LocalDateTime now = LocalDateTime.now();

        if (true) { // All vouchers are now assignment-based
            User user = getCurrentAuthenticatedUser();
            if (isVipVoucher(voucher)) {

            }

            UserVoucher userVoucher = userVoucherRepository.findByUserIdAndVoucherId(user.getId(), voucher.getId())
                    .orElseThrow(
                            () -> new AppException(ErrorCode.VOUCHER_INVALID, "Người dùng không sở hữu voucher này."));

            if (!Boolean.TRUE.equals(userVoucher.getActive())
                    || userVoucher.getRemainingQuantity() == null
                    || userVoucher.getRemainingQuantity() <= 0
                    || userVoucher.getValidUntil() == null
                    || userVoucher.getValidUntil().isBefore(now)) {
                log.warn("Voucher ID {} của user ID {} không hợp lệ để sử dụng.", voucher.getId(), user.getId());
                throw new AppException(ErrorCode.VOUCHER_INVALID);
            }
        }

        if (orderTotal < voucher.getMinOrderValue()) {
            log.warn("Đơn hàng không đủ điều kiện tối thiểu cho voucher {}. Yêu cầu: {}, Thực tế: {}", code,
                    voucher.getMinOrderValue(), orderTotal);
            throw new AppException(ErrorCode.VOUCHER_MIN_ORDER_NOT_MET);
        }

        if ("PERCENT".equalsIgnoreCase(voucher.getDiscountType())) {
            return orderTotal * (voucher.getDiscountValue() / 100.0);
        }

        return voucher.getDiscountValue();
    }

    @Override
    @Transactional
    public void decrementQuantity(String code) {
        log.info("Bắt đầu giảm số lượng cho voucher: {}", code);
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(
                        () -> new AppException(ErrorCode.VOUCHER_NOT_FOUND, "Không tìm thấy voucher với mã: " + code));

        if (true) { // All vouchers are now assignment-based
            User user = getCurrentAuthenticatedUser();
            if (isVipVoucher(voucher)) {
                // Voucher VIP không trừ kho tổng, chỉ trừ lượt dùng cá nhân.
                // Logic này đã đúng.
            } else {
                // Với voucher thường, kho tổng đã bị trừ khi người dùng "Lưu" (claim).
                // Ở bước thanh toán, chúng ta không cần trừ kho tổng nữa.
                // int updatedVoucherRows =
                // voucherRepository.decrementQuantityIfAvailable(voucher.getCode());
                // if (updatedVoucherRows == 0) {
                // log.warn("Race condition: Voucher {} đã hết lượt trong khi user {} đang thanh
                // toán.", code, user.getId());
                // throw new AppException(ErrorCode.VOUCHER_INVALID, "Rất tiếc, voucher đã hết
                // lượt ngay khi bạn thao tác.");
                // }
                // log.info("Đã giảm 1 lượt dùng từ kho tổng cho voucher '{}'.", code);
            }

            int updatedUserVoucherRows = userVoucherRepository.decrementQuantityIfAvailable(user.getId(),
                    voucher.getId());
            if (updatedUserVoucherRows > 0) {
                log.info("Đã giảm 1 lượt dùng cho voucher '{}' của user ID {}", code, user.getId());
            }
        }
    }

    @Override
    @Transactional
    public void incrementQuantity(String code, String userId) {
        log.info("Bắt đầu hoàn lại số lượng cho voucher: {} của user ID: {}", code, userId);
        Voucher voucher = voucherRepository.findByCode(code).orElse(null);
        if (voucher == null)
            return;

        if (true) { // All vouchers are now assignment-based
            if (userId == null || userId.isBlank()) {
                log.warn("Không thể hoàn lại voucher '{}' vì không có userId.", code);
                return;
            }

            // Bước 1: Hoàn lại lượt sử dụng vào ví của người dùng (UserVoucher)
            int updatedUserVoucher = userVoucherRepository.incrementQuantity(Long.parseLong(userId), voucher.getId());
            if (updatedUserVoucher > 0) {
                log.info("Đã hoàn lại 1 lượt dùng cho voucher '{}' vào ví của user ID {}", code, userId);
            }
        }
    }

    @Override
    @Transactional
    public VoucherResponse claimVoucher(String code) {
        log.info("User bắt đầu claim voucher với mã: {}", code);
        User user = getCurrentAuthenticatedUser();
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(
                        () -> new AppException(ErrorCode.VOUCHER_NOT_FOUND, "Không tìm thấy voucher với mã: " + code));

        log.info("Kiểm tra tính hợp lệ của voucher template ID: {}", voucher.getId());
        if (!Boolean.TRUE.equals(voucher.getActive())
                || voucher.getExpiryDate() == null
                || voucher.getExpiryDate().isBefore(LocalDateTime.now())
                || voucher.getQuantity() == null
                || voucher.getQuantity() <= 0) {
            throw new AppException(ErrorCode.VOUCHER_INVALID, "Voucher không khả dụng hoặc đã hết lượt!");
        }

        // Bước 1: Trừ số lượng của voucher gốc đi 1 một cách an toàn (atomic update)
        int updatedRows = voucherRepository.decrementQuantityIfAvailable(voucher.getCode());
        if (updatedRows == 0) {
            // Xử lý race condition: voucher đã hết ngay khi người dùng bấm lưu
            log.warn("Race condition: Voucher {} đã hết lượt trong khi user {} đang claim.", code, user.getId());
            throw new AppException(ErrorCode.VOUCHER_INVALID, "Rất tiếc, voucher đã hết lượt ngay khi bạn thao tác.");
        }

        // Kiểm tra xem khách hàng đã lưu voucher này chưa và còn hạn sử dụng/số lượng
        // không
        log.info("Kiểm tra xem user ID {} đã sở hữu voucher ID {} chưa", user.getId(), voucher.getId());
        Optional<UserVoucher> existingOpt = userVoucherRepository.findByUserIdAndVoucherId(user.getId(),
                voucher.getId());
        if (existingOpt.isPresent()) {
            UserVoucher existing = existingOpt.get();
            if (Boolean.TRUE.equals(existing.getActive())
                    && existing.getRemainingQuantity() != null
                    && existing.getRemainingQuantity() > 0
                    && (existing.getValidUntil() == null || existing.getValidUntil().isAfter(LocalDateTime.now()))) {
                log.warn("User ID {} đã sở hữu voucher {} và còn hiệu lực.", user.getId(), code);
                throw new AppException(ErrorCode.VOUCHER_CODE_EXISTED, "Bạn đã lưu mã này vào ví rồi!");
            }
        }

        UserVoucher userVoucher = existingOpt.orElseGet(() -> UserVoucher.builder()
                .user(user)
                .voucher(voucher)
                .remainingQuantity(0)
                .lastResetMonth(YearMonth.now().toString())
                .validUntil(voucher.getExpiryDate())
                .active(true)
                .build());

        userVoucher.setActive(true);
        userVoucher.setValidUntil(voucher.getExpiryDate());
        int currentQuantity = userVoucher.getRemainingQuantity() != null ? userVoucher.getRemainingQuantity() : 0;
        userVoucher.setRemainingQuantity(currentQuantity + 1);
        userVoucherRepository.save(userVoucher);
        log.info("Đã lưu/cập nhật UserVoucher ID {} cho user ID {}", userVoucher.getId(), user.getId());
        log.info("Đã giảm số lượng tổng của voucher '{}' đi 1.", code);

        return voucherMapper.toResponse(voucher);
    }

    private VoucherResponse toUserVoucherResponse(UserVoucher userVoucher) {
        Voucher voucher = userVoucher.getVoucher();
        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .category(voucher.getCategory())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .minOrderValue(voucher.getMinOrderValue())
                .quantity(userVoucher.getRemainingQuantity())
                .vipOnly(isVipVoucher(voucher))
                .monthlyReset(Boolean.TRUE.equals(voucher.getMonthlyReset()))
                .monthlyQuantity(resolveVipMonthlyQuota(voucher))
                .expiryDate(userVoucher.getValidUntil())
                .image(voucher.getImage())
                .coinCost(voucher.getCoinCost())
                .active(Boolean.TRUE.equals(userVoucher.getActive()))
                .eligible(true)
                .claimable(true)
                .lockedReason(null)
                .claimed(true) // User owns this
                .build();
    }

    private VoucherResponse toLockedVipVoucherResponse(Voucher voucher) {
        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .category(voucher.getCategory())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .minOrderValue(voucher.getMinOrderValue())
                .quantity(resolveVipMonthlyQuota(voucher))
                .vipOnly(true)
                .monthlyReset(Boolean.TRUE.equals(voucher.getMonthlyReset()))
                .monthlyQuantity(resolveVipMonthlyQuota(voucher))
                .expiryDate(voucher.getExpiryDate())
                .image(voucher.getImage())
                .coinCost(voucher.getCoinCost())
                .active(Boolean.TRUE.equals(voucher.getActive()))
                .eligible(false)
                .claimable(false)
                .lockedReason("Hãy đăng ký thành viên VIP để được nhận voucher này")
                .claimed(false) // User does not own this
                .build();
    }

    private boolean isAssignmentOnlyVoucher(Voucher voucher) {
        return true;
    }

    private boolean isCoinRedeemVoucher(Voucher voucher) {
        return voucher != null && COIN_VOUCHER_CATEGORY.equalsIgnoreCase(voucher.getCategory());
    }

    private boolean isVipVoucher(Voucher voucher) {
        return voucher != null
                && (Boolean.TRUE.equals(voucher.getVipOnly())
                        || "VIP".equalsIgnoreCase(voucher.getCategory()));
    }

    private int resolveVipMonthlyQuota(Voucher voucher) {
        if (voucher.getMonthlyQuantity() != null && voucher.getMonthlyQuantity() > 0) {
            return voucher.getMonthlyQuantity();
        }
        return voucher.getQuantity() != null && voucher.getQuantity() > 0
                ? voucher.getQuantity()
                : 1;
    }

    private void syncVipVouchersForUser(User user) {
        LocalDateTime now = LocalDateTime.now();

        Optional<MembershipSubscription> activeSubscription = membershipSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndedAtDesc(user.getId(), MembershipSubscriptionStatus.ACTIVE)
                .filter(subscription -> subscription.getEndedAt() != null && subscription.getEndedAt().isAfter(now));

        List<UserVoucher> currentVipAssignments = userVoucherRepository.findByUserId(user.getId())
                .stream()
                .filter(assignment -> isVipVoucher(assignment.getVoucher()))
                .toList();

        if (activeSubscription.isEmpty()) {
            currentVipAssignments.forEach(userVoucherRepository::delete);
            return;
        }
        log.info("Bắt đầu đồng bộ voucher VIP cho user ID: {}", user.getId());

        MembershipSubscription subscription = activeSubscription.get();
        String currentMonth = YearMonth.now().toString();
        LocalDateTime monthEnd = YearMonth.now().atEndOfMonth().atTime(23, 59, 59);
        LocalDateTime validUntil = subscription.getEndedAt().isBefore(monthEnd)
                ? subscription.getEndedAt()
                : monthEnd;

        List<Voucher> vipTemplates = voucherRepository.findByCategoryIgnoreCaseAndActiveTrueOrderByIdDesc("VIP");
        Set<Long> activeTemplateIds = new HashSet<>();

        for (Voucher template : vipTemplates) {
            activeTemplateIds.add(template.getId());

            UserVoucher assignment = userVoucherRepository.findByUserIdAndVoucherId(user.getId(), template.getId())
                    .orElseGet(() -> UserVoucher.builder()
                            .user(user)
                            .voucher(template)
                            .remainingQuantity(resolveVipMonthlyQuota(template))
                            .lastResetMonth(currentMonth)
                            .validUntil(validUntil)
                            .active(true)
                            .build());

            if (!currentMonth.equals(assignment.getLastResetMonth())) {
                assignment.setRemainingQuantity(resolveVipMonthlyQuota(template));
                log.info("Reset số lượng voucher VIP ID {} cho user ID {}", template.getId(), user.getId());
                assignment.setLastResetMonth(currentMonth);
            }

            assignment.setVoucher(template);
            assignment.setActive(true);
            assignment.setValidUntil(validUntil);
            userVoucherRepository.save(assignment);
        }

        currentVipAssignments.stream()
                .filter(assignment -> !activeTemplateIds.contains(assignment.getVoucher().getId())
                        || !Boolean.TRUE.equals(assignment.getVoucher().getActive()))
                .forEach(assignment -> {
                    log.info("Xóa UserVoucher VIP đã hết hạn hoặc không còn hoạt động. UserVoucher ID: {}",
                            assignment.getId());
                    userVoucherRepository.delete(assignment);
                });
    }

    private User getCurrentAuthenticatedUser() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmailIgnoreCase(principal)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND,
                        "Không tìm thấy người dùng với email: " + principal));
    }
}