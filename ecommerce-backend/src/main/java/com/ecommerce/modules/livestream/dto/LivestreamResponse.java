package com.ecommerce.modules.livestream.dto;

import com.ecommerce.modules.livestream.entity.LivestreamStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestreamResponse {
    private Long id;
    private String title;
    private String description;
    private String thumbnailUrl;
    private LivestreamStatus status;
    private LocalDateTime scheduledAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Long viewerCount;
    private Long totalViews;
    private List<LiveProductResponse> products;
    private List<LiveDealResponse> activeDeals;
}
