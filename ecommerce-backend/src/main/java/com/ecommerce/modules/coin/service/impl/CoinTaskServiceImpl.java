package com.ecommerce.modules.coin.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.ProductReview;
import com.ecommerce.entity.User;
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
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CoinTaskServiceImpl implements CoinTaskService {

    private final CoinTaskRepository coinTaskRepository;
    private final UserCoinWalletRepository userCoinWalletRepository;
    private final CoinTransactionRepository coinTransactionRepository;
    private final UserRepository userRepository;
    private final MembershipSubscriptionRepository membershipSubscriptionRepository;

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
                .map(task -> toResponse(task, user.getId(), today))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CoinRedeemOptionResponse> getRedeemOptions() {
        return List.of(
                CoinRedeemOptionResponse.builder()
                        .id(1L).type("voucher").title("Voucher giảm 20.000đ")
                        .description("Dùng xu để đổi mã giảm giá cho đơn hàng tiếp theo.")
                        .coinCost(200L).build(),
                CoinRedeemOptionResponse.builder()
                        .id(2L).type("voucher").title("Voucher freeship")
                        .description("Miễn phí vận chuyển cho đơn hàng đủ điều kiện.")
                        .coinCost(300L).build(),
                CoinRedeemOptionResponse.builder()
                        .id(3L).type("gift").title("Quà bí mật tháng này")
                        .description("Phần quà sự kiện, sẽ bàn thêm logic đổi sau.")
                        .coinCost(800L).build()
        );
    }

    @Override
    @Transactional
    public CoinClaimResponse claimTask(String taskCode) {
        User user = getCurrentAuthenticatedUser();
        CoinTask task = coinTaskRepository.findByTaskCodeIgnoreCase(taskCode)
                .orElseThrow(() -> new AppException(ErrorCode.COIN_TASK_NOT_FOUND));

        if (!Boolean.TRUE.equals(task.getIsActive())) {
            throw new AppException(ErrorCode.COIN_TASK_INVALID);
        }
        if (task.getCategory() != CoinTaskCategory.DAILY) {
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
    public void rewardReviewCreated(User user, ProductReview review, boolean hasImages) {
        if (user == null || review == null || review.getId() == null) return;
        String taskCode = hasImages ? "REVIEW_WITH_IMAGE" : "REVIEW_NO_IMAGE";
        CoinTask task = coinTaskRepository.findByTaskCodeIgnoreCase(taskCode).orElse(null);
        if (task == null || !Boolean.TRUE.equals(task.getIsActive())) return;

        String sourceRef = "REVIEW:" + review.getId();
        if (coinTransactionRepository.existsByUserIdAndTaskTaskCodeIgnoreCaseAndSourceRef(user.getId(), taskCode, sourceRef)) {
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
    }

    private void map(CoinTaskUpsertRequest request, CoinTask entity) {
        entity.setTaskCode(request.getTaskCode().trim().toUpperCase());
        entity.setTitle(request.getTitle().trim());
        entity.setDescription(request.getDescription());
        entity.setCategory(request.getCategory());
        entity.setCoinReward(request.getCoinReward());
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
        if (entity.getCategory() == CoinTaskCategory.DAILY) {
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
