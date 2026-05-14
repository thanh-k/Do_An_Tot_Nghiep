package com.ecommerce.modules.behavior.dto;

import com.ecommerce.modules.behavior.entity.BehaviorEventType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BehaviorTrackRequest {
    @NotNull(message = "Loại hành vi là bắt buộc")
    private BehaviorEventType eventType;

    private Long productId;
    private List<Long> productIds;
    private Long categoryId;
    private Long brandId;
    private String keyword;
    private String pageUrl;
    private String metadataJson;
    private String sessionId;
}
