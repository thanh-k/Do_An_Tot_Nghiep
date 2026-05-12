package com.ecommerce.modules.coin.config;

import com.ecommerce.modules.coin.entity.CoinTask;
import com.ecommerce.modules.coin.entity.CoinTaskCategory;
import com.ecommerce.modules.coin.repository.CoinTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CoinTaskDataInitializer implements CommandLineRunner {

    private final CoinTaskRepository coinTaskRepository;

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
}