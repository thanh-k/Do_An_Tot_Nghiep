package com.ecommerce.modules.coin.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.ProductReview;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserVoucher;
import com.ecommerce.entity.Voucher;
import com.ecommerce.modules.coin.dto.request.CoinTaskUpsertRequest;
import com.ecommerce.modules.coin.dto.response.CoinClaimResponse;
import com.ecommerce.modules.coin.dto.response.CoinOverviewResponse;
import com.ecommerce.modules.coin.dto.response.CoinRedeemOptionResponse;
import com.ecommerce.modules.coin.dto.response.CoinTaskResponse;
import com.ecommerce.modules.coin.entity.CoinTask;
import com.ecommerce.modules.coin.entity.CoinTaskCategory;
import com.ecommerce.modules.coin.entity.CoinTransaction;
import com.ecommerce.modules.coin.entity.UserCoinWallet;
import com.ecommerce.modules.coin.repository.CoinTaskRepository;
import com.ecommerce.modules.coin.repository.CoinTransactionRepository;
import com.ecommerce.modules.coin.repository.UserCoinWalletRepository;
import com.ecommerce.modules.coin.service.CoinTaskService;
import com.ecommerce.modules.membership.entity.MembershipSubscriptionStatus;
import com.ecommerce.modules.membership.repository.MembershipSubscriptionRepository;
import com.ecommerce.modules.user.repository.UserRepository;
import com.ecommerce.modules.voucher.repository.UserVoucherRepository;
import com.ecommerce.modules.voucher.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CoinTaskServiceImpl implements CoinTaskService {

    private final CoinTaskRepository coinTaskRepository;
    private final UserCoinWalletRepository userCoinWalletRepository;
    private final CoinTransactionRepository coinTransactionRepository;
    private final UserRepository userRepository;
    private final MembershipSubscriptionRepository membershipSubscriptionRepository;
    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;

    private static final String COIN_VOUCHER_CATEGORY = "COIN_REWARD";
    private static final String ORDER_CASHBACK_TASK_CODE = "ORDER_CASHBACK";

    @Override
    @Transactional(readOnly = true)
    public List<CoinTaskResponse> getAdminTasks() {
        return coinTaskRepository.findAllByOrderByCategoryAscSortOrderAscIdAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public CoinTaskResponse createTask(CoinTaskUpsertRequest request) {
        validate(request, null);
        CoinTask entity = new CoinTask();
        map(request, entity);
        return toResponse(coinTaskRepository.save(entity));
    }

    @Override
    @Transactional
    public CoinTaskResponse updateTask(Long id, CoinTaskUpsertRequest request) {
        CoinTask entity = coinTaskRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COIN_TASK_NOT_FOUND));
        validate(request, id);
        map(request, entity);
        return toResponse(coinTaskRepository.save(entity));
    }

    @Override
    @Transactional
    public void deleteTask(Long id) {
        CoinTask entity = coinTaskRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COIN_TASK_NOT_FOUND));
        coinTaskRepository.delete(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public CoinOverviewResponse getUserOverview() {
        User user = getCurrentAuthenticatedUser();
        UserCoinWallet wallet = userCoinWalletRepository.findByUserId(user.getId())
                .orElse(null);

        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();

        LocalDate monthStartDate = LocalDate.of(today.getYear(), today.getMonth(), 1);
        LocalDateTime monthStart = monthStartDate.atStartOfDay();
        LocalDateTime nextMonthStart = monthStartDate.plusMonths(1).atStartOfDay();

        Long todayEarned = coinTransactionRepository.sumPositiveAmountByUserIdBetween(user.getId(), todayStart, tomorrowStart);
        Long monthEarned = coinTransactionRepository.sumPositiveAmountByUserIdBetween(user.getId(), monthStart, nextMonthStart);
        boolean isVip = isVip(user.getId());

        return CoinOverviewResponse.builder()
                .balance(wallet == null || wallet.getBalance() == null ? 0L : wallet.getBalance())
                .todayEarned(todayEarned == null ? 0L : todayEarned)
                .monthEarned(monthEarned == null ? 0L : monthEarned)
                .isVip(isVip)
                .build();
    }
    @Override
    @Transactional(readOnly = true)
    public List<CoinTaskResponse> getUserTasks() {
        User user = getCurrentAuthenticatedUser();
        LocalDate today = LocalDate.now();

        return coinTaskRepository.findByIsActiveTrueOrderByCategoryAscSortOrderAscIdAsc().stream()
                .filter(task -> !ORDER_CASHBACK_TASK_CODE.equalsIgnoreCase(task.getTaskCode()))
                .map(task -> toResponse(task, user.getId(), today))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CoinRedeemOptionResponse> getRedeemOptions() {
        User user = getCurrentAuthenticatedUser();
        return voucherRepository.findByCategoryIgnoreCaseAndActiveTrueOrderByIdDesc(COIN_VOUCHER_CATEGORY).stream()
                .filter(voucher -> voucher.getExpiryDate() == null || voucher.getExpiryDate().isAfter(LocalDateTime.now()))
                .map(voucher -> toRedeemOption(voucher, user.getId()))
                .toList();
    }

    @Override
    @Transactional
    public CoinClaimResponse redeemVoucher(Long voucherId) {
        User user = getCurrentAuthenticatedUser();
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        if (!COIN_VOUCHER_CATEGORY.equalsIgnoreCase(voucher.getCategory())
                || !Boolean.TRUE.equals(voucher.getActive())
                || voucher.getExpiryDate() == null
                || voucher.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VOUCHER_INVALID);
        }

        long cost = resolveCoinVoucherCost(voucher);
        UserCoinWallet wallet = getOrCreateWallet(user);
        if (nvl(wallet.getBalance()) < cost) {
            throw new AppException(ErrorCode.COIN_TASK_INVALID);
        }

        UserVoucher userVoucher = userVoucherRepository.findByUserIdAndVoucherId(user.getId(), voucher.getId())
                .orElseGet(() -> UserVoucher.builder()
                        .user(user)
                        .voucher(voucher)
                        .remainingQuantity(0)
                        .lastResetMonth(YearMonth.now().toString())
                        .validUntil(voucher.getExpiryDate())
                        .active(true)
                        .build());

        userVoucher.setVoucher(voucher);
        userVoucher.setActive(true);
        userVoucher.setValidUntil(voucher.getExpiryDate());
        userVoucher.setLastResetMonth(YearMonth.now().toString());
        userVoucher.setRemainingQuantity((userVoucher.getRemainingQuantity() == null ? 0 : userVoucher.getRemainingQuantity()) + 1);
        userVoucherRepository.save(userVoucher);

        wallet.setBalance(nvl(wallet.getBalance()) - cost);
        wallet.setTotalSpent(nvl(wallet.getTotalSpent()) + cost);
        userCoinWalletRepository.save(wallet);

        coinTransactionRepository.save(CoinTransaction.builder()
                .user(user)
                .changeAmount(-cost)
                .balanceAfter(wallet.getBalance())
                .transactionType("VOUCHER_REDEEM")
                .note("Đổi voucher bằng xu: " + voucher.getCode())
                .sourceRef("VOUCHER:" + voucher.getId() + ":" + System.currentTimeMillis())
                .build());

        return CoinClaimResponse.builder()
                .taskCode("VOUCHER_REDEEM")
                .claimedAmount(-cost)
                .balance(wallet.getBalance())
                .alreadyClaimed(false)
                .message("Đổi voucher thành công")
                .build();
    }

    @Override
    @Transactional
    public CoinClaimResponse claimTask(String taskCode) {
        User user = getCurrentAuthenticatedUser();
        CoinTask task = coinTaskRepository.findByTaskCodeIgnoreCase(taskCode)
                .orElseThrow(() -> new AppException(ErrorCode.COIN_TASK_NOT_FOUND));

        if (!Boolean.TRUE.equals(task.getIsActive()) || ORDER_CASHBACK_TASK_CODE.equalsIgnoreCase(task.getTaskCode())) {
            throw new AppException(ErrorCode.COIN_TASK_INVALID);
        }
        if (!isManualDailyTask(task)) {
            throw new AppException(ErrorCode.COIN_TASK_INVALID);
        }

        String sourceRef = task.getTaskCode().toUpperCase() + ":" + LocalDate.now();
        if (coinTransactionRepository.existsByUserIdAndTaskTaskCodeIgnoreCaseAndSourceRef(user.getId(), task.getTaskCode(), sourceRef)) {
            UserCoinWallet wallet = getOrCreateWallet(user);
            return CoinClaimResponse.builder()
                    .taskCode(task.getTaskCode())
                    .claimedAmount(0L)
                    .balance(wallet.getBalance())
                    .alreadyClaimed(true)
                    .message("Bạn đã nhận xu của nhiệm vụ này hôm nay rồi")
                    .build();
        }

        long reward = task.getCoinReward() == null ? 0L : task.getCoinReward();
        if (Boolean.TRUE.equals(task.getVipMultiplierEnabled()) && isVip(user.getId())) {
            reward *= 2;
        }

        UserCoinWallet wallet = getOrCreateWallet(user);
        wallet.setBalance(nvl(wallet.getBalance()) + reward);
        wallet.setTotalEarned(nvl(wallet.getTotalEarned()) + reward);
        userCoinWalletRepository.save(wallet);

        coinTransactionRepository.save(CoinTransaction.builder()
                .user(user)
                .task(task)
                .changeAmount(reward)
                .balanceAfter(wallet.getBalance())
                .transactionType("TASK_CLAIM")
                .note("Nhận xu từ nhiệm vụ: " + task.getTitle())
                .sourceRef(sourceRef)
                .build());

        return CoinClaimResponse.builder()
                .taskCode(task.getTaskCode())
                .claimedAmount(reward)
                .balance(wallet.getBalance())
                .alreadyClaimed(false)
                .message("Nhận xu thành công")
                .build();
    }

    @Override
    @Transactional
    public void rewardOrderCompleted(String userId, Long orderId) {
        if (userId == null || userId.isBlank() || orderId == null) return;

        CoinTask task = coinTaskRepository.findByTaskCodeIgnoreCase(ORDER_CASHBACK_TASK_CODE).orElse(null);
        if (task == null || !Boolean.TRUE.equals(task.getIsActive())) return;

        Long parsedUserId;
        try {
            parsedUserId = Long.parseLong(userId);
        } catch (NumberFormatException ex) {
            return;
        }

        User user = userRepository.findById(parsedUserId).orElse(null);
        if (user == null) return;

        String sourceRef = "ORDER:" + orderId;
        if (coinTransactionRepository.existsByUserIdAndTaskTaskCodeIgnoreCaseAndSourceRef(user.getId(), ORDER_CASHBACK_TASK_CODE, sourceRef)) {
            return;
        }

        long reward = task.getCoinReward() == null ? 15L : task.getCoinReward();
        UserCoinWallet wallet = getOrCreateWallet(user);
        wallet.setBalance(nvl(wallet.getBalance()) + reward);
        wallet.setTotalEarned(nvl(wallet.getTotalEarned()) + reward);
        userCoinWalletRepository.save(wallet);

        coinTransactionRepository.save(CoinTransaction.builder()
                .user(user)
                .task(task)
                .changeAmount(reward)
                .balanceAfter(wallet.getBalance())
                .transactionType("ORDER_CASHBACK")
                .note("Hoàn xu khi đơn hàng #" + orderId + " hoàn thành")
                .sourceRef(sourceRef)
                .build());
    }

    @Override
    @Transactional
    public void rewardReviewCreated(User user, ProductReview review, boolean hasImages) {
        if (user == null || review == null || review.getId() == null) return;
        CoinTaskCategory category = hasImages ? CoinTaskCategory.REVIEW_WITH_IMAGE : CoinTaskCategory.REVIEW_NO_IMAGE;
        String fallbackTaskCode = hasImages ? "REVIEW_WITH_IMAGE" : "REVIEW_NO_IMAGE";
        CoinTask task = coinTaskRepository.findFirstByCategoryAndIsActiveTrueOrderBySortOrderAscIdAsc(category)
                .orElseGet(() -> coinTaskRepository.findByTaskCodeIgnoreCase(fallbackTaskCode).orElse(null));
        if (task == null || !Boolean.TRUE.equals(task.getIsActive())) return;

        String sourceRef = "REVIEW:" + review.getId();
        if (coinTransactionRepository.existsByUserIdAndTaskTaskCodeIgnoreCaseAndSourceRef(user.getId(), task.getTaskCode(), sourceRef)) {
            return;
        }

        long reward = task.getCoinReward() == null ? 0L : task.getCoinReward();
        UserCoinWallet wallet = getOrCreateWallet(user);
        wallet.setBalance(nvl(wallet.getBalance()) + reward);
        wallet.setTotalEarned(nvl(wallet.getTotalEarned()) + reward);
        userCoinWalletRepository.save(wallet);

        coinTransactionRepository.save(CoinTransaction.builder()
                .user(user)
                .task(task)
                .changeAmount(reward)
                .balanceAfter(wallet.getBalance())
                .transactionType("REVIEW_REWARD")
                .note("Thưởng xu từ đánh giá sản phẩm #" + review.getId())
                .sourceRef(sourceRef)
                .build());
    }

    private CoinRedeemOptionResponse toRedeemOption(Voucher voucher, Long userId) {
        boolean redeemed = userVoucherRepository.findByUserIdAndVoucherId(userId, voucher.getId())
                .filter(uv -> Boolean.TRUE.equals(uv.getActive()))
                .filter(uv -> uv.getRemainingQuantity() != null && uv.getRemainingQuantity() > 0)
                .filter(uv -> uv.getValidUntil() == null || uv.getValidUntil().isAfter(LocalDateTime.now()))
                .isPresent();

        return CoinRedeemOptionResponse.builder()
                .id(voucher.getId())
                .type("voucher")
                .title(buildVoucherTitle(voucher))
                .description("Dùng xu để đổi voucher " + voucher.getCode() + " cho đơn hàng tiếp theo.")
                .coinCost(resolveCoinVoucherCost(voucher))
                .voucherCode(voucher.getCode())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .minOrderValue(voucher.getMinOrderValue())
                .quantity(voucher.getQuantity())
                .redeemed(redeemed)
                .build();
    }

    private String buildVoucherTitle(Voucher voucher) {
        if ("PERCENT".equalsIgnoreCase(voucher.getDiscountType())) {
            return "Giảm " + formatNumber(voucher.getDiscountValue()) + "%";
        }
        return "Giảm " + String.format("%,.0f", voucher.getDiscountValue()).replace(',', '.') + "đ";
    }

    private String formatNumber(Double value) {
        if (value == null) return "0";
        if (Math.floor(value) == value) return String.valueOf(value.longValue());
        return String.valueOf(value);
    }

    private long resolveCoinVoucherCost(Voucher voucher) {
        if (voucher == null || voucher.getCoinCost() == null || voucher.getCoinCost() <= 0) {
            return 200L;
        }
        return voucher.getCoinCost();
    }

    private void validate(CoinTaskUpsertRequest request, Long id) {
        if (request.getTaskCode() == null || request.getTaskCode().isBlank()
                || request.getTitle() == null || request.getTitle().isBlank()
                || request.getCategory() == null
                || request.getCoinReward() == null || request.getCoinReward() < 0) {
            throw new AppException(ErrorCode.COIN_TASK_INVALID);
        }

        boolean duplicated = id == null
                ? coinTaskRepository.existsByTaskCodeIgnoreCase(request.getTaskCode())
                : coinTaskRepository.existsByTaskCodeIgnoreCaseAndIdNot(request.getTaskCode(), id);

        if (duplicated) {
            throw new AppException(ErrorCode.COIN_TASK_CODE_EXISTS);
        }

        if (request.getCategory() == CoinTaskCategory.ONLINE_DURATION
                && (request.getRequiredActiveMinutes() == null || request.getRequiredActiveMinutes() <= 0)) {
            throw new AppException(ErrorCode.COIN_TASK_INVALID);
        }
    }

    private void map(CoinTaskUpsertRequest request, CoinTask entity) {
        entity.setTaskCode(request.getTaskCode().trim().toUpperCase());
        entity.setTitle(request.getTitle().trim());
        entity.setDescription(request.getDescription());
        entity.setCategory(request.getCategory());
        entity.setCoinReward(request.getCoinReward());
        entity.setRequiredActiveMinutes(resolveRequiredActiveMinutes(request));
        entity.setIsActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive());
        entity.setVipMultiplierEnabled(request.getVipMultiplierEnabled() == null ? Boolean.FALSE : request.getVipMultiplierEnabled());
        entity.setLimitText(request.getLimitText());
        entity.setCtaLabel(request.getCtaLabel());
        entity.setSortOrder(request.getSortOrder() == null ? 0 : request.getSortOrder());
    }

    private CoinTaskResponse toResponse(CoinTask entity) {
        return CoinTaskResponse.builder()
                .id(entity.getId())
                .taskCode(entity.getTaskCode())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .coinReward(entity.getCoinReward())
                .requiredActiveMinutes(entity.getRequiredActiveMinutes())
                .isActive(entity.getIsActive())
                .vipMultiplierEnabled(entity.getVipMultiplierEnabled())
                .limitText(entity.getLimitText())
                .ctaLabel(entity.getCtaLabel())
                .sortOrder(entity.getSortOrder())
                .claimedToday(false)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private CoinTaskResponse toResponse(CoinTask entity, Long userId, LocalDate today) {
        boolean claimedToday = false;
        if (isManualDailyTask(entity)) {
            String sourceRef = entity.getTaskCode().toUpperCase() + ":" + today;
            claimedToday = coinTransactionRepository.existsByUserIdAndTaskTaskCodeIgnoreCaseAndSourceRef(userId, entity.getTaskCode(), sourceRef);
        }
        return CoinTaskResponse.builder()
                .id(entity.getId())
                .taskCode(entity.getTaskCode())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .coinReward(entity.getCoinReward())
                .requiredActiveMinutes(entity.getRequiredActiveMinutes())
                .isActive(entity.getIsActive())
                .vipMultiplierEnabled(entity.getVipMultiplierEnabled())
                .limitText(entity.getLimitText())
                .ctaLabel(entity.getCtaLabel())
                .sortOrder(entity.getSortOrder())
                .claimedToday(claimedToday)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private boolean isManualDailyTask(CoinTask task) {
        if (task == null || task.getCategory() == null) return false;
        return task.getCategory() == CoinTaskCategory.DAILY_LOGIN
                || task.getCategory() == CoinTaskCategory.ONLINE_DURATION
                || task.getCategory() == CoinTaskCategory.DAILY;
    }

    private Integer resolveRequiredActiveMinutes(CoinTaskUpsertRequest request) {
        if (request.getCategory() == CoinTaskCategory.ONLINE_DURATION) {
            return request.getRequiredActiveMinutes() == null ? 5 : Math.max(1, request.getRequiredActiveMinutes());
        }
        return null;
    }

    private UserCoinWallet getOrCreateWallet(User user) {
        return userCoinWalletRepository.findByUserId(user.getId())
                .orElseGet(() -> userCoinWalletRepository.save(UserCoinWallet.builder()
                        .user(user)
                        .balance(0L)
                        .totalEarned(0L)
                        .totalSpent(0L)
                        .build()));
    }

    private boolean isVip(Long userId) {
        return membershipSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndedAtDesc(userId, MembershipSubscriptionStatus.ACTIVE)
                .isPresent();
    }

    private long nvl(Long value) { return value == null ? 0L : value; }

    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        String principal = authentication.getName();
        return userRepository.findByEmailIgnoreCase(principal)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
