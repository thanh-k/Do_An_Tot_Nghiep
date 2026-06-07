package com.ecommerce.modules.behavior.service.impl;

import com.ecommerce.modules.behavior.repository.UserBehaviorEventRepository;
import com.ecommerce.modules.behavior.repository.UserProductInterestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class BehaviorMaintenanceService {

    private final UserBehaviorEventRepository behaviorEventRepository;
    private final UserProductInterestRepository productInterestRepository;

    @Value("${app.behavior.retention-days:30}")
    private int retentionDays;

    @Value("${app.behavior.interest-decay-days:1}")
    private int interestDecayDays;

    @Value("${app.behavior.interest-decay-rate:0.9}")
    private double interestDecayRate;

    @Value("${app.behavior.minimum-interest-score:1.0}")
    private double minimumInterestScore;

    /**
     * Chạy mỗi ngày lúc 02:00 theo giờ Việt Nam.
     *
     * Mục tiêu:
     * - Giảm điểm quan tâm của sản phẩm không còn được thao tác gần đây.
     * - Xóa interest điểm thấp hoặc quá cũ để đề xuất không bị bám vào hành vi cũ.
     * - Xóa lịch sử behavior event quá 30 ngày để tối ưu database.
     *
     * Cookie phía FE chỉ giữ sessionId, còn dữ liệu hành vi thật nằm trong database.
     */
    @Scheduled(cron = "${app.behavior.maintenance-cron:0 0 2 * * *}", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void maintainBehaviorData() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime inactiveBefore = now.minusDays(Math.max(1, interestDecayDays));
        LocalDateTime expiredBefore = now.minusDays(Math.max(1, retentionDays));

        int decayedInterests = productInterestRepository.decayInactiveScores(
                inactiveBefore,
                normalizeDecayRate(interestDecayRate)
        );

        int deletedInterests = productInterestRepository.deleteExpiredOrLowScoreInterests(
                Math.max(0.0, minimumInterestScore),
                expiredBefore
        );

        int deletedEvents = behaviorEventRepository.deleteOldEvents(expiredBefore);

        log.info(
                "Behavior maintenance done: decayedInterests={}, deletedInterests={}, deletedEvents={}, expiredBefore={}",
                decayedInterests,
                deletedInterests,
                deletedEvents,
                expiredBefore
        );
    }

    private double normalizeDecayRate(double value) {
        if (value <= 0 || value >= 1) {
            return 0.9;
        }
        return value;
    }
}
