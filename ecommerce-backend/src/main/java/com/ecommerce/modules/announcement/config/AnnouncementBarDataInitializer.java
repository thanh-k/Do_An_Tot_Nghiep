package com.ecommerce.modules.announcement.config;

import com.ecommerce.modules.announcement.entity.AnnouncementBar;
import com.ecommerce.modules.announcement.repository.AnnouncementBarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AnnouncementBarDataInitializer implements CommandLineRunner {

    private final AnnouncementBarRepository announcementBarRepository;

    @Override
    public void run(String... args) {
        if (announcementBarRepository.count() > 0) return;

        announcementBarRepository.save(AnnouncementBar.builder()
                .message("🎉 Chào mừng bạn đến với InsightShop - Săn sale hôm nay, nhận ưu đãi cực lớn!")
                .active(true)
                .backgroundColor("#0f766e")
                .textColor("#ffffff")
                .speedSeconds(18)
                .sortOrder(1)
                .build());
    }
}
