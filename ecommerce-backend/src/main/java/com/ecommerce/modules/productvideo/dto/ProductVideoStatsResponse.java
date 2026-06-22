package com.ecommerce.modules.productvideo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVideoStatsResponse {
    private long totalVideos;
    private long totalViews;
    private ProductVideoResponse mostViewedVideo;
    private ProductVideoResponse mostClickedVideo;
    private ProductVideoResponse mostAddedToCartVideo;
    private ProductVideoResponse mostOrderedVideo;
}
