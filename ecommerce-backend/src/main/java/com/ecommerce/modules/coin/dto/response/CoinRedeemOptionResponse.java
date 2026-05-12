package com.ecommerce.modules.coin.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CoinRedeemOptionResponse {
    private Long id;
    private String type;
    private String title;
    private String description;
    private Long coinCost;
}