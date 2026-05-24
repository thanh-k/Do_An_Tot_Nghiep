package com.ecommerce.modules.accountcancellation.dto;

import com.ecommerce.modules.accountcancellation.entity.AccountCancellationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AccountCancellationResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String email;
    private String phone;
    private Boolean hasUnfinishedOrders;
    private Long unfinishedOrderCount;
    private String reason;
    private AccountCancellationStatus status;
    private String adminNote;
    private Long processedById;
    private String processedByName;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
}
