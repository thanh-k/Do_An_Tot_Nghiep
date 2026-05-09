package com.ecommerce.modules.review.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewItemResponse {
    private Long id;
    private Long userId;
    private String user;
    private String avatar;
    private Integer rating;
    private LocalDateTime createdAt;
    private String date;
    private String comment;
    private List<String> images;
    private Boolean verified;
    private Integer likes;
    private Boolean mine;
    private String shopReply;
    private String shopReplyBy;
    private LocalDateTime shopReplyAt;
}
