package com.ecommerce.modules.review.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ProductReviewCreateRequest {
    private Integer rating;
    private String comment;
    private List<String> images;
}
