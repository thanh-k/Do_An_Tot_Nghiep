package com.ecommerce.modules.coin.config;

import com.ecommerce.entity.Voucher;
import com.ecommerce.modules.coin.entity.CoinTask;
import com.ecommerce.modules.coin.entity.CoinTaskCategory;
import com.ecommerce.modules.coin.repository.CoinTaskRepository;
import com.ecommerce.modules.voucher.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class CoinTaskDataInitializer implements CommandLineRunner {

    private final CoinTaskRepository coinTaskRepository;
    private final VoucherRepository voucherRepository;

    @Override
    public void run(String... args) {
        seedTask("DAILY_LOGIN", "Đăng nhập hằng ngày", "Đăng nhập vào hệ thống mỗi ngày để nhận xu thưởng.",
                CoinTaskCategory.DAILY, 5L, true, true, "1 lần / ngày", "Điểm danh", 1);
        seedTask("ONLINE_5M", "Online đủ 5 phút", "Giữ trạng thái online đủ 5 phút để nhận thêm xu.",
                CoinTaskCategory.DAILY, 5L, true, true, "1 lần / ngày", "Nhận xu", 2);
        seedTask("REVIEW_NO_IMAGE", "Đánh giá sản phẩm không hình", "Viết đánh giá hợp lệ cho sản phẩm đã mua để nhận xu.",
                CoinTaskCategory.REVIEW, 50L, true, false, "Theo mỗi đánh giá hợp lệ", "Đi tới đánh giá", 3);
        seedTask("REVIEW_WITH_IMAGE", "Đánh giá sản phẩm có hình", "Đánh giá sản phẩm kèm hình ảnh sẽ nhận nhiều xu hơn.",
                CoinTaskCategory.REVIEW, 100L, true, false, "Theo mỗi đánh giá hợp lệ", "Đi tới đánh giá", 4);

        // Không tạo category ORDER mới. Hoàn xu đơn hàng được xử lý như nghiệp vụ cashback tự động.
        seedTask("ORDER_CASHBACK", "Hoàn xu khi hoàn thành đơn hàng", "Mỗi đơn hàng hoàn thành được cộng 15 xu vào ví.",
                CoinTaskCategory.DAILY, 15L, true, false, "Theo mỗi đơn hàng hoàn thành", "Tự động", 99);

        seedCoinVoucher("COIN20K", "DISCOUNT", "FIXED", 20000D, 150000D, 999, 180, 200L);
        seedCoinVoucher("COIN50K", "DISCOUNT", "FIXED", 50000D, 350000D, 999, 180, 450L);
        seedCoinVoucher("COIN10P", "DISCOUNT", "PERCENT", 10D, 500000D, 999, 180, 800L);
    }

    private void seedTask(String taskCode, String title, String description,
                          CoinTaskCategory category, Long coinReward, boolean isActive,
                          boolean vipMultiplierEnabled, String limitText, String ctaLabel, int sortOrder) {
        coinTaskRepository.findByTaskCodeIgnoreCase(taskCode).orElseGet(() ->
                coinTaskRepository.save(CoinTask.builder()
                        .taskCode(taskCode)
                        .title(title)
                        .description(description)
                        .category(category)
                        .coinReward(coinReward)
                        .isActive(isActive)
                        .vipMultiplierEnabled(vipMultiplierEnabled)
                        .limitText(limitText)
                        .ctaLabel(ctaLabel)
                        .sortOrder(sortOrder)
                        .build())
        );
    }

    private void seedCoinVoucher(String code, String category, String discountType,
                                 Double discountValue, Double minOrderValue,
                                 Integer quantity, int validDays, Long coinCost) {
        voucherRepository.findByCode(code).ifPresentOrElse(voucher -> {
            if (voucher.getCoinCost() == null || voucher.getCoinCost() <= 0) {
                voucher.setCoinCost(coinCost);
                voucherRepository.save(voucher);
            }
        }, () -> voucherRepository.save(Voucher.builder()
                .code(code)
                // COIN_REWARD là cate riêng cho voucher đổi bằng xu, không hiển thị như voucher thường.
                .category("COIN_REWARD")
                .discountType(discountType)
                .discountValue(discountValue)
                .minOrderValue(minOrderValue)
                .quantity(quantity)
                .vipOnly(false)
                .monthlyReset(false)
                .monthlyQuantity(1)
                .expiryDate(LocalDateTime.now().plusDays(validDays))
                .coinCost(coinCost)
                .active(true)
                .build()));
    }
}
