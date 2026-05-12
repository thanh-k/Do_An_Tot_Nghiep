package com.ecommerce.modules.coin.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CoinClaimResponse {
    private String taskCode;
    private Long claimedAmount;
    private Long balance;
    private Boolean alreadyClaimed;
    private String message;
}
