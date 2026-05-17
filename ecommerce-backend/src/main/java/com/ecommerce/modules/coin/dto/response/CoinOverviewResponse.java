package com.ecommerce.modules.coin.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CoinOverviewResponse {
    private Long balance;
    private Long todayEarned;
    private Long monthEarned;
    private Boolean isVip;
}