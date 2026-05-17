package com.ecommerce.modules.coin.dto.request;

import com.ecommerce.modules.coin.entity.CoinTaskCategory;
import lombok.Data;

@Data
public class CoinTaskUpsertRequest {
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
}