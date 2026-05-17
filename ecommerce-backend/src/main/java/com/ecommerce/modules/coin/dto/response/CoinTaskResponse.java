package com.ecommerce.modules.coin.dto.response;

import com.ecommerce.modules.coin.entity.CoinTaskCategory;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CoinTaskResponse {
    private Long id;
    private String taskCode;
    private String title;
    private String description;
    private CoinTaskCategory category;
    private Long coinReward;
    private Boolean isActive;
    private Boolean vipMultiplierEnabled;
    private String limitText;
    private String ctaLabel;
    private Integer sortOrder;
    private Boolean claimedToday;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}