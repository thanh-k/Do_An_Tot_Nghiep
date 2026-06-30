package com.ecommerce.modules.membership.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.User;
import com.ecommerce.modules.membership.dto.request.MembershipPlanUpsertRequest;
import com.ecommerce.modules.membership.dto.request.MembershipPurchaseRequest;
import com.ecommerce.modules.membership.dto.response.MembershipCurrentResponse;
import com.ecommerce.modules.membership.dto.response.MembershipPlanResponse;
import com.ecommerce.modules.membership.dto.response.MembershipPurchaseResponse;
import com.ecommerce.modules.membership.dto.response.MembershipPurchaseHistoryResponse;
import com.ecommerce.modules.membership.entity.*;
import com.ecommerce.modules.membership.repository.MembershipPlanRepository;
import com.ecommerce.modules.membership.repository.MembershipSubscriptionRepository;
import com.ecommerce.modules.membership.service.MembershipService;
import com.ecommerce.modules.user.repository.UserRepository;
import com.ecommerce.modules.mail.MailService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MembershipServiceImpl implements MembershipService {

    private final MembershipPlanRepository membershipPlanRepository;
    private final MembershipSubscriptionRepository membershipSubscriptionRepository;
    private final UserRepository userRepository;
    private final MailService mailService;

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
                .findFirstByUserIdAndStatusAndPaymentStatusOrderByEndedAtDesc(
                        user.getId(),
                        MembershipSubscriptionStatus.ACTIVE,
                        MembershipPaymentStatus.PAID
                )
                .map(subscription -> toCurrentResponse(subscription, buildPurchaseHistory(user.getId())))
                .orElseGet(() -> buildRegularMembership(buildPurchaseHistory(user.getId())));
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
                .subscription(toCurrentResponse(saved, buildPurchaseHistory(user.getId())))
                .subscriptionId(saved.getId())
                .amount(plan.getPrice())
                .paymentMethod(MembershipPaymentMethod.SEPAY.name())
                .paymentStatus(MembershipPaymentStatus.PENDING.name())
                .paymentCode(buildSePayCode(saved.getId()))
                .expiredAt(now.plusMinutes(15))
                .build();
    }


    @Override
    @Transactional(readOnly = true)
    public MembershipPurchaseResponse getPurchaseStatus(Long subscriptionId) {
        if (subscriptionId == null) {
            throw new AppException(ErrorCode.MEMBERSHIP_PURCHASE_INVALID);
        }

        User currentUser = getCurrentAuthenticatedUser();
        MembershipSubscription subscription = membershipSubscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBERSHIP_PURCHASE_INVALID));

        if (subscription.getUser() == null || !subscription.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.MEMBERSHIP_PURCHASE_INVALID);
        }

        return MembershipPurchaseResponse.builder()
                .message(resolvePurchaseStatusMessage(subscription))
                .subscription(toCurrentResponse(subscription, buildPurchaseHistory(currentUser.getId())))
                .subscriptionId(subscription.getId())
                .amount(subscription.getPlan() == null ? 0L : subscription.getPlan().getPrice())
                .paymentMethod(subscription.getPaymentMethod() == null ? null : subscription.getPaymentMethod().name())
                .paymentStatus(subscription.getPaymentStatus() == null ? null : subscription.getPaymentStatus().name())
                .paymentCode(buildSePayCode(subscription.getId()))
                .expiredAt(subscription.getCreatedAt() == null ? null : subscription.getCreatedAt().plusMinutes(15))
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
        if (!isPendingPayment(subscription)) {
            return false;
        }

        long expectedAmount = subscription.getPlan().getPrice() == null ? 0L : subscription.getPlan().getPrice();
        if (expectedAmount <= 0L || Math.abs(transferAmount - expectedAmount) > 1000D) {
            return false;
        }

        activatePaidSubscription(subscription, "SePay webhook xác nhận thanh toán thành công");
        return true;
    }




    private String resolvePurchaseStatusMessage(MembershipSubscription subscription) {
        if (subscription == null) {
            return "Không tìm thấy phiên thanh toán gói thành viên.";
        }
        if (subscription.getPaymentStatus() == MembershipPaymentStatus.PAID
                && subscription.getStatus() == MembershipSubscriptionStatus.ACTIVE) {
            return "Thanh toán thành công. Gói VIP đã được kích hoạt.";
        }
        if (subscription.getStatus() == MembershipSubscriptionStatus.CANCELLED) {
            return "Phiên thanh toán gói thành viên đã bị hủy.";
        }
        if (subscription.getStatus() == MembershipSubscriptionStatus.EXPIRED) {
            return "Phiên thanh toán gói thành viên đã hết hạn.";
        }
        return "Phiên thanh toán gói thành viên đang chờ SePay xác nhận.";
    }

    private boolean isPendingPayment(MembershipSubscription subscription) {
        return subscription != null
                && subscription.getStatus() == MembershipSubscriptionStatus.PENDING
                && subscription.getPaymentStatus() == MembershipPaymentStatus.PENDING;
    }

    private MembershipSubscription activatePaidSubscription(MembershipSubscription subscription, String note) {
        User user = subscription.getUser();
        if (user == null || subscription.getPlan() == null) {
            throw new AppException(ErrorCode.MEMBERSHIP_PURCHASE_INVALID);
        }

        expireOldSubscriptions(user.getId());

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime baseDate = membershipSubscriptionRepository
                .findByUserIdAndStatusAndPaymentStatus(
                        user.getId(),
                        MembershipSubscriptionStatus.ACTIVE,
                        MembershipPaymentStatus.PAID
                )
                .stream()
                .filter(activeSubscription -> !activeSubscription.getId().equals(subscription.getId()))
                .map(MembershipSubscription::getEndedAt)
                .filter(endedAt -> endedAt != null && endedAt.isAfter(now))
                .max(Comparator.naturalOrder())
                .orElse(now);

        subscription.setStatus(MembershipSubscriptionStatus.ACTIVE);
        subscription.setPaymentMethod(MembershipPaymentMethod.SEPAY);
        subscription.setPaymentStatus(MembershipPaymentStatus.PAID);
        subscription.setStartedAt(baseDate);
        subscription.setEndedAt(baseDate.plusMonths(subscription.getPlan().getDurationMonths()));
        subscription.setNote(appendNote(subscription.getNote(), note));

        return membershipSubscriptionRepository.save(subscription);
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


    /**
     * Nhắc gia hạn VIP lúc 20:00 mỗi ngày nếu gói hiện tại còn đúng 7 ngày.
     * Không tạo bảng/cột mới: job chỉ gửi email cho subscription ACTIVE + PAID có endedAt trong ngày cần nhắc.
     * Nếu user đã mua nhiều gói cộng dồn, chỉ nhắc theo subscription có hạn kết thúc xa nhất của user.
     */
    @Scheduled(cron = "0 0 20 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional(readOnly = true)
    public void sendMembershipRenewalReminderEmails() {
        LocalDate remindDate = LocalDate.now().plusDays(7);
        LocalDateTime startOfDay = remindDate.atStartOfDay();
        LocalDateTime endOfDay = remindDate.atTime(LocalTime.MAX);

        List<MembershipSubscription> expiringSubscriptions = membershipSubscriptionRepository
                .findByStatusAndPaymentStatusAndEndedAtBetween(
                        MembershipSubscriptionStatus.ACTIVE,
                        MembershipPaymentStatus.PAID,
                        startOfDay,
                        endOfDay
                );

        Map<Long, MembershipSubscription> latestActiveByUser = expiringSubscriptions.stream()
                .filter(subscription -> subscription.getUser() != null && subscription.getUser().getId() != null)
                .collect(Collectors.toMap(
                        subscription -> subscription.getUser().getId(),
                        subscription -> subscription,
                        (left, right) -> isAfter(right.getEndedAt(), left.getEndedAt()) ? right : left
                ));

        latestActiveByUser.values().stream()
                .filter(this::isLatestPaidSubscriptionOfUser)
                .filter(subscription -> subscription.getUser().getEmail() != null && !subscription.getUser().getEmail().isBlank())
                .forEach(subscription -> {
                    String email = subscription.getUser().getEmail();
                    String fullName = subscription.getUser().getFullName() == null || subscription.getUser().getFullName().isBlank()
                            ? "bạn"
                            : subscription.getUser().getFullName();
                    String planName = subscription.getPlan() == null ? "VIP" : subscription.getPlan().getName();
                    String endedAt = subscription.getEndedAt() == null
                            ? "sắp tới"
                            : subscription.getEndedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

                    String membershipUrl = "https://hitcinsight.id.vn/membership";
                    String safeFullName = escapeHtml(fullName);
                    String safePlanName = escapeHtml(planName);
                    String safeEndedAt = escapeHtml(endedAt);

                    String htmlContent = """
                            <div style=\"font-family:Arial,Helvetica,sans-serif;background:#f6f8fb;padding:24px;color:#1f2937;\">
                                <div style=\"display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;\">
                                    Thông báo về gói thành viên InsightShop của bạn.
                                </div>

                                <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;\">
                                    <div style=\"padding:22px 26px;border-bottom:1px solid #e5e7eb;\">
                                        <h2 style=\"margin:0;font-size:20px;line-height:1.35;color:#111827;\">InsightShop</h2>
                                        <p style=\"margin:6px 0 0;font-size:14px;line-height:1.5;color:#6b7280;\">
                                            Thông báo về gói thành viên
                                        </p>
                                    </div>

                                    <div style=\"padding:26px;\">
                                        <p style=\"font-size:15px;line-height:1.7;margin:0 0 14px;color:#374151;\">
                                            Xin chào <strong>%s</strong>,
                                        </p>

                                        <p style=\"font-size:15px;line-height:1.7;margin:0 0 14px;color:#374151;\">
                                            Gói thành viên <strong>%s</strong> của bạn sẽ hết hạn vào ngày
                                            <strong>%s</strong>.
                                        </p>

                                        <p style=\"font-size:15px;line-height:1.7;margin:0 0 22px;color:#374151;\">
                                            Bạn có thể kiểm tra thông tin gói và gia hạn tại trang Hội viên VIP của InsightShop.
                                        </p>

                                        <p style=\"margin:26px 0;text-align:center;\">
                                            <a href=\"%s\"
                                               style=\"display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;
                                                      padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;\">
                                                Xem thông tin gói thành viên
                                            </a>
                                        </p>

                                        <p style=\"font-size:13px;line-height:1.6;color:#6b7280;margin:0;\">
                                            Nếu nút trên không hoạt động, bạn có thể truy cập:
                                            <br/>
                                            <a href=\"%s\" style=\"color:#1d4ed8;text-decoration:none;\">%s</a>
                                        </p>

                                        <hr style=\"border:none;border-top:1px solid #e5e7eb;margin:24px 0;\"/>

                                        <p style=\"font-size:13px;line-height:1.6;color:#6b7280;margin:0;\">
                                            Email này được gửi vì tài khoản của bạn đang sử dụng gói thành viên trên InsightShop.
                                            <br/>
                                            Trân trọng,<br/>
                                            InsightShop
                                        </p>
                                    </div>
                                </div>
                            </div>
                            """.formatted(
                            safeFullName,
                            safePlanName,
                            safeEndedAt,
                            membershipUrl,
                            membershipUrl,
                            membershipUrl
                    );

                    try {
                        mailService.sendHtmlEmail(
                                email,
                                "Thông báo: Gói thành viên của bạn sắp hết hạn",
                                htmlContent
                        );
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                });
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private boolean isLatestPaidSubscriptionOfUser(MembershipSubscription subscription) {
        if (subscription == null || subscription.getUser() == null || subscription.getUser().getId() == null) {
            return false;
        }

        LocalDateTime targetEndedAt = subscription.getEndedAt();
        return membershipSubscriptionRepository
                .findByUserIdAndStatusAndPaymentStatus(
                        subscription.getUser().getId(),
                        MembershipSubscriptionStatus.ACTIVE,
                        MembershipPaymentStatus.PAID
                )
                .stream()
                .map(MembershipSubscription::getEndedAt)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .map(latestEndedAt -> targetEndedAt != null && latestEndedAt.isEqual(targetEndedAt))
                .orElse(false);
    }

    private boolean isAfter(LocalDateTime candidate, LocalDateTime current) {
        if (candidate == null) {
            return false;
        }
        if (current == null) {
            return true;
        }
        return candidate.isAfter(current);
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

    private MembershipCurrentResponse toCurrentResponse(MembershipSubscription subscription, List<MembershipPurchaseHistoryResponse> purchaseHistory) {
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
                .purchaseHistory(purchaseHistory)
                .totalPurchasedMonths(resolveTotalPurchasedMonths(purchaseHistory))
                .build();
    }

    private List<MembershipPurchaseHistoryResponse> buildPurchaseHistory(Long userId) {
        return membershipSubscriptionRepository
                .findByUserIdAndPaymentStatusOrderByCreatedAtDesc(userId, MembershipPaymentStatus.PAID)
                .stream()
                .filter(subscription -> subscription.getPlan() != null)
                .map(subscription -> MembershipPurchaseHistoryResponse.builder()
                        .id(subscription.getId())
                        .planId(subscription.getPlan().getId())
                        .planCode(subscription.getPlan().getCode())
                        .planName(subscription.getPlan().getName())
                        .durationMonths(subscription.getPlan().getDurationMonths())
                        .price(subscription.getPlan().getPrice())
                        .purchasedAt(subscription.getUpdatedAt() != null ? subscription.getUpdatedAt() : subscription.getCreatedAt())
                        .startedAt(subscription.getStartedAt())
                        .endedAt(subscription.getEndedAt())
                        .status(subscription.getStatus().name())
                        .paymentStatus(subscription.getPaymentStatus().name())
                        .paymentMethod(subscription.getPaymentMethod().name())
                        .build())
                .toList();
    }

    private int resolveTotalPurchasedMonths(List<MembershipPurchaseHistoryResponse> purchaseHistory) {
        if (purchaseHistory == null || purchaseHistory.isEmpty()) {
            return 0;
        }
        return purchaseHistory.stream()
                .map(MembershipPurchaseHistoryResponse::getDurationMonths)
                .filter(duration -> duration != null && duration > 0)
                .mapToInt(Integer::intValue)
                .sum();
    }

    private String buildSePayCode(Long subscriptionId) {
        return "VIP" + subscriptionId;
    }

    private MembershipCurrentResponse buildRegularMembership(List<MembershipPurchaseHistoryResponse> purchaseHistory) {
        return MembershipCurrentResponse.builder()
                .membershipCode("REGULAR")
                .membershipName("Thành viên thường")
                .vip(false)
                .active(true)
                .status("REGULAR")
                .paymentMethod(null)
                .paymentStatus(null)
                .purchaseHistory(purchaseHistory)
                .totalPurchasedMonths(resolveTotalPurchasedMonths(purchaseHistory))
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
