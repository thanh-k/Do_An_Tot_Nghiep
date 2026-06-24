package com.ecommerce.modules.voucher.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserVoucher;
import com.ecommerce.entity.Voucher;
import com.ecommerce.modules.membership.entity.MembershipSubscription;
import com.ecommerce.modules.membership.entity.MembershipSubscriptionStatus;
import com.ecommerce.modules.membership.repository.MembershipSubscriptionRepository;
import com.ecommerce.modules.user.repository.UserRepository;
import com.ecommerce.modules.upload.service.LocalStorageService;
import com.ecommerce.modules.voucher.dto.request.VoucherRequest;
import com.ecommerce.modules.voucher.dto.response.VoucherResponse;
import com.ecommerce.modules.voucher.mapper.VoucherMapper;
import com.ecommerce.modules.voucher.repository.UserVoucherRepository;
import com.ecommerce.modules.voucher.repository.VoucherRepository;
import com.ecommerce.modules.voucher.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private static final String COIN_VOUCHER_CATEGORY = "COIN_REWARD";

    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final MembershipSubscriptionRepository membershipSubscriptionRepository;
    private final UserRepository userRepository;
    private final VoucherMapper voucherMapper;
    private final LocalStorageService localStorageService;

    private String getPublicIdFromUrl(String url) {
        if (url == null || url.isEmpty()) return null;
        int uploadIndex = url.indexOf("/upload/");
        if (uploadIndex == -1) return null;
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
        validateVoucherRequest(request);

        Voucher voucher = voucherMapper.toEntity(request);

        if (isVipVoucher(voucher)) {
            voucher.setVipOnly(true);
            voucher.setMonthlyReset(true);
            voucher.setMonthlyQuantity(
                    request.getMonthlyQuantity() != null
                            ? request.getMonthlyQuantity()
                            : request.getQuantity()
            );
        }

        Voucher saved = voucherRepository.save(voucher);
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
        User user = getCurrentAuthenticatedUser();
        syncVipVouchersForUser(user);

        LocalDateTime now = LocalDateTime.now();
        List<VoucherResponse> results = new ArrayList<>();

        // Voucher thường: ai cũng thấy và dùng nếu còn hiệu lực
        voucherRepository.findByActiveTrueOrderByIdDesc().stream()
                .filter(v -> !isVipVoucher(v))
                .filter(v -> !isCoinRedeemVoucher(v))
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
                    return v;
                })
                .forEach(results::add);

        // Voucher VIP user đã được cấp thật
        userVoucherRepository.findByUserIdAndActiveTrue(user.getId()).stream()
                .filter(uv -> uv.getValidUntil() != null && uv.getValidUntil().isAfter(now))
                .filter(uv -> uv.getRemainingQuantity() != null && uv.getRemainingQuantity() > 0)
                .map(this::toUserVoucherResponse)
                .forEach(results::add);

        // User thường vẫn thấy voucher VIP nhưng ở trạng thái khóa
        Set<Long> ownedVipVoucherIds = userVoucherRepository.findByUserIdAndActiveTrue(user.getId()).stream()
                .map(uv -> uv.getVoucher().getId())
                .collect(Collectors.toSet());

        voucherRepository.findByCategoryIgnoreCaseAndActiveTrueOrderByIdDesc("VIP").stream()
                .filter(v -> v.getExpiryDate() != null && v.getExpiryDate().isAfter(now))
                .filter(v -> !ownedVipVoucherIds.contains(v.getId()))
                .map(this::toLockedVipVoucherResponse)
                .forEach(results::add);

        return results;
    }

    @Override
    @Transactional
    public VoucherResponse updateVoucher(Long id, VoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

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
        voucher.setMonthlyReset(Boolean.TRUE.equals(request.getMonthlyReset()) || "VIP".equalsIgnoreCase(request.getCategory()));
        voucher.setMonthlyQuantity(
                request.getMonthlyQuantity() != null
                        ? request.getMonthlyQuantity()
                        : request.getQuantity()
        );

        if (request.getActive() != null) {
            voucher.setActive(request.getActive());
        }

        voucher.setImage(request.getImage());
        voucher.setCoinCost(request.getCoinCost());

        Voucher saved = voucherRepository.save(voucher);

        if (isVipVoucher(saved)) {
            userVoucherRepository.findAll().stream()
                    .filter(uv -> uv.getVoucher().getId().equals(saved.getId()))
                    .forEach(uv -> {
                        uv.setActive(saved.getActive());
                        uv.setRemainingQuantity(resolveVipMonthlyQuota(saved));
                        userVoucherRepository.save(uv);
                    });
        }

        return voucherMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        if (isAssignmentOnlyVoucher(voucher)) {
            userVoucherRepository.findAll().stream()
                    .filter(uv -> uv.getVoucher().getId().equals(id))
                    .forEach(userVoucherRepository::delete);
        }

        String imageUrl = voucher.getImage();
        voucherRepository.delete(voucher);

        if (imageUrl != null && !imageUrl.isEmpty()) {
            try {
                String publicId = getPublicIdFromUrl(imageUrl);
                if (publicId != null) {
                    localStorageService.deleteFile(publicId);
                }
            } catch (Exception ignored) {
            }
        }
    }

    @Override
    @Transactional
    public Double calculateDiscount(String code, Double orderTotal) {
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();

        if (isAssignmentOnlyVoucher(voucher)) {
            User user = getCurrentAuthenticatedUser();
            if (isVipVoucher(voucher)) {
                syncVipVouchersForUser(user);
            }

            UserVoucher userVoucher = userVoucherRepository.findByUserIdAndVoucherId(user.getId(), voucher.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_INVALID));

            if (!Boolean.TRUE.equals(userVoucher.getActive())
                    || userVoucher.getRemainingQuantity() == null
                    || userVoucher.getRemainingQuantity() <= 0
                    || userVoucher.getValidUntil() == null
                    || userVoucher.getValidUntil().isBefore(now)) {
                throw new AppException(ErrorCode.VOUCHER_INVALID);
            }
        } else {
            if (!Boolean.TRUE.equals(voucher.getActive())
                    || voucher.getQuantity() == null
                    || voucher.getQuantity() <= 0
                    || voucher.getExpiryDate() == null
                    || voucher.getExpiryDate().isBefore(now)) {
                throw new AppException(ErrorCode.VOUCHER_INVALID);
            }
        }

        if (orderTotal < voucher.getMinOrderValue()) {
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
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        if (isAssignmentOnlyVoucher(voucher)) {
            User user = getCurrentAuthenticatedUser();
            if (isVipVoucher(voucher)) {
                syncVipVouchersForUser(user);
            }

            UserVoucher userVoucher = userVoucherRepository.findByUserIdAndVoucherId(user.getId(), voucher.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_INVALID));

            if (userVoucher.getRemainingQuantity() != null && userVoucher.getRemainingQuantity() > 0) {
                userVoucher.setRemainingQuantity(userVoucher.getRemainingQuantity() - 1);
                userVoucherRepository.save(userVoucher);
            }
            return;
        }

        if (voucher.getQuantity() != null && voucher.getQuantity() > 0) {
            voucher.setQuantity(voucher.getQuantity() - 1);
            voucherRepository.save(voucher);
        }
    }

    @Override
    @Transactional
    public void incrementQuantity(String code, String userId) {
        Voucher voucher = voucherRepository.findByCode(code).orElse(null);
        if (voucher == null) return;

        if (isAssignmentOnlyVoucher(voucher)) {
            if (userId != null) {
                userVoucherRepository.findByUserIdAndVoucherId(Long.parseLong(userId), voucher.getId()).ifPresent(uv -> {
                    if (uv.getRemainingQuantity() != null) {
                        uv.setRemainingQuantity(uv.getRemainingQuantity() + 1);
                        userVoucherRepository.save(uv);
                    }
                });
            }
            return;
        }

        if (voucher.getQuantity() != null) {
            voucher.setQuantity(voucher.getQuantity() + 1);
            voucherRepository.save(voucher);
        }
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
                .build();
    }

    private boolean isAssignmentOnlyVoucher(Voucher voucher) {
        return isVipVoucher(voucher) || isCoinRedeemVoucher(voucher);
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
                assignment.setLastResetMonth(currentMonth);
            }

            assignment.setVoucher(template);
            assignment.setActive(true);
            assignment.setValidUntil(validUntil);
            userVoucherRepository.save(assignment);
        }

        currentVipAssignments.stream()
                .filter(assignment ->
                        !activeTemplateIds.contains(assignment.getVoucher().getId())
                                || !Boolean.TRUE.equals(assignment.getVoucher().getActive()))
                .forEach(userVoucherRepository::delete);
    }

    private User getCurrentAuthenticatedUser() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmailIgnoreCase(principal)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}