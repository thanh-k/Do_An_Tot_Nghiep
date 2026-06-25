package com.ecommerce.modules.membership.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.User;
import com.ecommerce.modules.membership.dto.request.MembershipPlanUpsertRequest;
import com.ecommerce.modules.membership.dto.request.MembershipPurchaseRequest;
import com.ecommerce.modules.membership.dto.response.MembershipCurrentResponse;
import com.ecommerce.modules.membership.dto.response.MembershipPlanResponse;
import com.ecommerce.modules.membership.dto.response.MembershipPurchaseResponse;
import com.ecommerce.modules.membership.entity.*;
import com.ecommerce.modules.membership.repository.MembershipPlanRepository;
import com.ecommerce.modules.membership.repository.MembershipSubscriptionRepository;
import com.ecommerce.modules.membership.service.MembershipService;
import com.ecommerce.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MembershipServiceImpl implements MembershipService {

    private final MembershipPlanRepository membershipPlanRepository;
    private final MembershipSubscriptionRepository membershipSubscriptionRepository;
    private final UserRepository userRepository;

    @Override
    public List<MembershipPlanResponse> getActivePlans() {
        return membershipPlanRepository.findByActiveTrueOrderByPriceAsc().stream().map(this::toPlanResponse).toList();
    }

    @Override
    public List<MembershipPlanResponse> getAllPlans() {
        return membershipPlanRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toPlanResponse).toList();
    }

    @Override
    @Transactional
    public MembershipCurrentResponse getCurrentMembership() {
        User user = getCurrentAuthenticatedUser();
        expireOldSubscriptions(user.getId());

        return membershipSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndedAtDesc(user.getId(), MembershipSubscriptionStatus.ACTIVE)
                .map(this::toCurrentResponse)
                .orElseGet(this::buildRegularMembership);
    }

    @Override
    @Transactional
    public MembershipPurchaseResponse purchaseMembership(MembershipPurchaseRequest request) {
        if (request == null || request.getPlanId() == null) {
            throw new AppException(ErrorCode.MEMBERSHIP_PURCHASE_INVALID);
        }

        User user = getCurrentAuthenticatedUser();
        MembershipPlan plan = membershipPlanRepository.findById(request.getPlanId())
                .filter(MembershipPlan::getActive)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBERSHIP_PLAN_NOT_FOUND));

        if (plan.getPrice() <= 0) {
            throw new AppException(ErrorCode.MEMBERSHIP_PLAN_INVALID);
        }

        expireOldSubscriptions(user.getId());

        // Không kích hoạt VIP ngay tại thời điểm bấm mua gói.
        // Tạo một đăng ký PENDING và chờ SePay webhook xác nhận thanh toán thành công.
        LocalDateTime now = LocalDateTime.now();
        MembershipSubscription subscription = MembershipSubscription.builder()
                .user(user)
                .plan(plan)
                .status(MembershipSubscriptionStatus.PENDING)
                .paymentMethod(MembershipPaymentMethod.SEPAY)
                .paymentStatus(MembershipPaymentStatus.PENDING)
                .startedAt(now)
                .endedAt(now.plusMonths(plan.getDurationMonths()))
                .note(request.getNote())
                .build();

        MembershipSubscription saved = membershipSubscriptionRepository.save(subscription);

        return MembershipPurchaseResponse.builder()
                .message("Vui lòng quét mã QR và chuyển khoản đúng nội dung để kích hoạt gói thành viên.")
                .subscription(toCurrentResponse(saved))
                .subscriptionId(saved.getId())
                .amount(plan.getPrice())
                .paymentMethod(MembershipPaymentMethod.SEPAY.name())
                .paymentStatus(MembershipPaymentStatus.PENDING.name())
                .paymentCode(buildSePayCode(saved.getId()))
                .expiredAt(now.plusMinutes(15))
                .build();
    }

    @Override
    @Transactional
    public boolean confirmSePayPayment(Long subscriptionId, double transferAmount) {
        if (subscriptionId == null) {
            return false;
        }

        MembershipSubscription subscription = membershipSubscriptionRepository.findById(subscriptionId)
                .orElse(null);

        if (subscription == null || subscription.getPlan() == null) {
            return false;
        }

        if (subscription.getStatus() == MembershipSubscriptionStatus.ACTIVE
                && subscription.getPaymentStatus() == MembershipPaymentStatus.PAID) {
            return true;
        }

        // Chỉ kích hoạt các đăng ký còn đang chờ thanh toán.
        // Nếu user đã hủy hoặc đăng ký đã hết hạn thì webhook đến muộn cũng không được kích hoạt VIP.
        if (subscription.getStatus() != MembershipSubscriptionStatus.PENDING
                || subscription.getPaymentStatus() != MembershipPaymentStatus.PENDING) {
            return false;
        }

        long expectedAmount = subscription.getPlan().getPrice() == null ? 0L : subscription.getPlan().getPrice();
        if (expectedAmount <= 0L || Math.abs(transferAmount - expectedAmount) > 1000D) {
            return false;
        }

        User user = subscription.getUser();
        if (user == null) {
            return false;
        }

        expireOldSubscriptions(user.getId());
        membershipSubscriptionRepository.findByUserIdAndStatus(user.getId(), MembershipSubscriptionStatus.ACTIVE)
                .forEach(activeSubscription -> {
                    if (!activeSubscription.getId().equals(subscription.getId())) {
                        activeSubscription.setStatus(MembershipSubscriptionStatus.EXPIRED);
                        activeSubscription.setEndedAt(LocalDateTime.now());
                    }
                });

        LocalDateTime now = LocalDateTime.now();
        subscription.setStatus(MembershipSubscriptionStatus.ACTIVE);
        subscription.setPaymentMethod(MembershipPaymentMethod.SEPAY);
        subscription.setPaymentStatus(MembershipPaymentStatus.PAID);
        subscription.setStartedAt(now);
        subscription.setEndedAt(now.plusMonths(subscription.getPlan().getDurationMonths()));

        membershipSubscriptionRepository.save(subscription);
        return true;
    }

    @Override
    @Transactional
    public void cancelPendingPayment(Long subscriptionId) {
        if (subscriptionId == null) {
            throw new AppException(ErrorCode.MEMBERSHIP_PURCHASE_INVALID);
        }

        User user = getCurrentAuthenticatedUser();
        MembershipSubscription subscription = membershipSubscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBERSHIP_PURCHASE_INVALID));

        if (subscription.getUser() == null || !subscription.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.MEMBERSHIP_PURCHASE_INVALID);
        }

        if (subscription.getStatus() == MembershipSubscriptionStatus.ACTIVE
                || subscription.getPaymentStatus() == MembershipPaymentStatus.PAID) {
            throw new AppException(ErrorCode.MEMBERSHIP_PURCHASE_INVALID);
        }

        subscription.setStatus(MembershipSubscriptionStatus.CANCELLED);
        subscription.setPaymentStatus(MembershipPaymentStatus.PENDING);
        subscription.setNote(appendNote(subscription.getNote(), "Người dùng hủy thanh toán SePay"));
        membershipSubscriptionRepository.save(subscription);
    }

    @Override
    @Transactional
    public MembershipPlanResponse createPlan(MembershipPlanUpsertRequest request) {
        validatePlanRequest(request, null);
        membershipPlanRepository.findByCodeIgnoreCase(request.getCode().trim())
                .ifPresent(plan -> { throw new AppException(ErrorCode.MEMBERSHIP_PLAN_ALREADY_EXISTS); });

        MembershipPlan plan = MembershipPlan.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .description(request.getDescription().trim())
                .durationMonths(request.getDurationMonths())
                .price(request.getPrice())
                .originalPrice(request.getOriginalPrice())
                .highlight(Boolean.TRUE.equals(request.getHighlight()))
                .badge(request.getBadge())
                .active(request.getActive() == null || request.getActive())
                .build();

        return toPlanResponse(membershipPlanRepository.save(plan));
    }

    @Override
    @Transactional
    public MembershipPlanResponse updatePlan(Long id, MembershipPlanUpsertRequest request) {
        MembershipPlan plan = membershipPlanRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBERSHIP_PLAN_NOT_FOUND));
        validatePlanRequest(request, id);
        membershipPlanRepository.findByCodeIgnoreCase(request.getCode().trim())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> { throw new AppException(ErrorCode.MEMBERSHIP_PLAN_ALREADY_EXISTS); });

        plan.setCode(request.getCode().trim().toUpperCase());
        plan.setName(request.getName().trim());
        plan.setDescription(request.getDescription().trim());
        plan.setDurationMonths(request.getDurationMonths());
        plan.setPrice(request.getPrice());
        plan.setOriginalPrice(request.getOriginalPrice());
        plan.setHighlight(Boolean.TRUE.equals(request.getHighlight()));
        plan.setBadge(request.getBadge());
        plan.setActive(request.getActive() == null || request.getActive());

        return toPlanResponse(membershipPlanRepository.save(plan));
    }

    @Override
    @Transactional
    public void deletePlan(Long id) {
        MembershipPlan plan = membershipPlanRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBERSHIP_PLAN_NOT_FOUND));
        if (membershipSubscriptionRepository.countByPlanId(id) > 0) {
            throw new AppException(ErrorCode.MEMBERSHIP_PLAN_IN_USE);
        }
        membershipPlanRepository.delete(plan);
    }

    private void validatePlanRequest(MembershipPlanUpsertRequest request, Long currentId) {
        if (request == null || isBlank(request.getCode()) || isBlank(request.getName()) || isBlank(request.getDescription())
                || request.getDurationMonths() == null || request.getDurationMonths() <= 0
                || request.getPrice() == null || request.getPrice() <= 0
                || request.getOriginalPrice() == null || request.getOriginalPrice() <= 0
                || request.getOriginalPrice() < request.getPrice()) {
            throw new AppException(ErrorCode.MEMBERSHIP_PLAN_INVALID);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void expireOldSubscriptions(Long userId) {
        membershipSubscriptionRepository.findByUserIdAndStatus(userId, MembershipSubscriptionStatus.ACTIVE)
                .stream()
                .filter(subscription -> subscription.getEndedAt() != null && subscription.getEndedAt().isBefore(LocalDateTime.now()))
                .forEach(subscription -> subscription.setStatus(MembershipSubscriptionStatus.EXPIRED));
    }

    private String appendNote(String currentNote, String nextNote) {
        if (nextNote == null || nextNote.isBlank()) {
            return currentNote;
        }
        if (currentNote == null || currentNote.isBlank()) {
            return nextNote;
        }
        return currentNote + " | " + nextNote;
    }

    private User getCurrentAuthenticatedUser() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmailIgnoreCase(principal)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private MembershipPlanResponse toPlanResponse(MembershipPlan plan) {
        return MembershipPlanResponse.builder()
                .id(plan.getId())
                .code(plan.getCode())
                .name(plan.getName())
                .description(plan.getDescription())
                .durationMonths(plan.getDurationMonths())
                .price(plan.getPrice())
                .originalPrice(plan.getOriginalPrice())
                .highlight(plan.getHighlight())
                .badge(plan.getBadge())
                .active(plan.getActive())
                .build();
    }

    private MembershipCurrentResponse toCurrentResponse(MembershipSubscription subscription) {
        return MembershipCurrentResponse.builder()
                .membershipCode(subscription.getPlan().getCode())
                .membershipName(subscription.getPlan().getName())
                .vip(true)
                .active(subscription.getStatus() == MembershipSubscriptionStatus.ACTIVE)
                .startedAt(subscription.getStartedAt())
                .endedAt(subscription.getEndedAt())
                .currentPlan(toPlanResponse(subscription.getPlan()))
                .paymentMethod(subscription.getPaymentMethod().name())
                .paymentStatus(subscription.getPaymentStatus().name())
                .status(subscription.getStatus().name())
                .build();
    }

    private String buildSePayCode(Long subscriptionId) {
        return "VIP" + subscriptionId;
    }

    private MembershipCurrentResponse buildRegularMembership() {
        return MembershipCurrentResponse.builder()
                .membershipCode("REGULAR")
                .membershipName("Thành viên thường")
                .vip(false)
                .active(true)
                .status("REGULAR")
                .paymentMethod(null)
                .paymentStatus(null)
                .currentPlan(MembershipPlanResponse.builder()
                        .code("REGULAR")
                        .name("Thành viên thường")
                        .description("Tài khoản mặc định sau khi đăng ký thành công.")
                        .durationMonths(0)
                        .price(0L)
                        .originalPrice(0L)
                        .highlight(false)
                        .badge("Mặc định")
                        .active(true)
                        .build())
                .build();
    }
}
