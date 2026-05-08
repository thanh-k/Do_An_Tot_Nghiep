package com.ecommerce.modules.membership.config;

import com.ecommerce.modules.membership.entity.MembershipPlan;
import com.ecommerce.modules.membership.repository.MembershipPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class MembershipDataInitializer implements CommandLineRunner {

    private final MembershipPlanRepository membershipPlanRepository;

    @Override
    public void run(String... args) {
        if (membershipPlanRepository.count() > 0) return;

        membershipPlanRepository.saveAll(List.of(
                MembershipPlan.builder()
                        .code("VIP_1M")
                        .name("VIP 1 tháng")
                        .description("Phù hợp để trải nghiệm nhanh các quyền lợi VIP trong 1 tháng.")
                        .durationMonths(1)
                        .price(20_000L)
                        .originalPrice(20_000L)
                        .highlight(false)
                        .badge("Gói linh hoạt")
                        .active(true)
                        .build(),
                MembershipPlan.builder()
                        .code("VIP_6M")
                        .name("VIP 6 tháng")
                        .description("Tiết kiệm hơn khi đăng ký dài hạn. Giá gốc 120.000đ, ưu đãi lần đầu còn 100.000đ.")
                        .durationMonths(6)
                        .price(100_000L)
                        .originalPrice(120_000L)
                        .highlight(true)
                        .badge("Phổ biến nhất")
                        .active(true)
                        .build(),
                MembershipPlan.builder()
                        .code("VIP_1Y")
                        .name("VIP 1 năm")
                        .description("Gói tiết kiệm dài hạn dành cho khách hàng sử dụng thường xuyên. Giá ưu đãi năm đầu 200.000đ.")
                        .durationMonths(12)
                        .price(200_000L)
                        .originalPrice(240_000L)
                        .highlight(false)
                        .badge("Ưu đãi năm đầu")
                        .active(true)
                        .build()
        ));
    }
}
