package com.ecommerce.modules.review.service;

import com.ecommerce.modules.review.dto.request.AdminReviewReplyRequest;
import com.ecommerce.modules.review.dto.request.AdminReviewVisibilityRequest;
import com.ecommerce.modules.review.dto.request.ProductReviewCreateRequest;
import com.ecommerce.modules.review.dto.response.AdminReviewResponse;
import com.ecommerce.modules.review.dto.response.ProductReviewSummaryResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProductReviewService {
    ProductReviewSummaryResponse getProductReviews(Long productId);
    ProductReviewSummaryResponse createReview(Long productId, ProductReviewCreateRequest request, List<MultipartFile> files);

    List<AdminReviewResponse> getAdminReviews(String keyword, Integer rating, Boolean visible, Boolean verified, Boolean replied);
    AdminReviewResponse getAdminReviewById(Long id);
    AdminReviewResponse updateVisibility(Long id, AdminReviewVisibilityRequest request);
    void deleteReview(Long id);
    AdminReviewResponse replyReview(Long id, AdminReviewReplyRequest request);
    AdminReviewResponse updateReply(Long id, AdminReviewReplyRequest request);
    AdminReviewResponse deleteReply(Long id);
}
