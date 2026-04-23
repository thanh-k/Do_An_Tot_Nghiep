package com.ecommerce.modules.phoneprefix.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PhonePrefixResponse {
    private Long id;
    private String prefix;
    private String providerName;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
