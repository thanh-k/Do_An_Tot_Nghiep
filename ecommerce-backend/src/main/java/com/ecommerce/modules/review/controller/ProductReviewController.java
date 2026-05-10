package com.ecommerce.modules.review.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.review.dto.request.AdminReviewReplyRequest;
import com.ecommerce.modules.review.dto.request.AdminReviewVisibilityRequest;
import com.ecommerce.modules.review.dto.request.ProductReviewCreateRequest;
import com.ecommerce.modules.review.dto.response.AdminReviewResponse;
import com.ecommerce.modules.review.dto.response.ProductReviewSummaryResponse;
import com.ecommerce.modules.review.service.ProductReviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService productReviewService;
    private final ObjectMapper objectMapper;

    @GetMapping("/product/{productId}")
    public ApiResponse<ProductReviewSummaryResponse> getProductReviews(@PathVariable Long productId) {
        return ApiResponse.<ProductReviewSummaryResponse>builder()
                .result(productReviewService.getProductReviews(productId))
                .build();
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping(value = "/product/{productId}", consumes = {"multipart/form-data"})
    public ApiResponse<ProductReviewSummaryResponse> createReview(
            @PathVariable Long productId,
            @RequestPart("data") String data,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) throws Exception {
        ProductReviewCreateRequest request = objectMapper.readValue(data, ProductReviewCreateRequest.class);
        return ApiResponse.<ProductReviewSummaryResponse>builder()
                .message("Đánh giá sản phẩm thành công")
                .result(productReviewService.createReview(productId, request, files))
                .build();
    }

    @PreAuthorize("hasAuthority('REVIEW_VIEW')")
    @GetMapping("/admin")
    public ApiResponse<List<AdminReviewResponse>> getAdminReviews(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) Boolean visible,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(required = false) Boolean replied
    ) {
        return ApiResponse.<List<AdminReviewResponse>>builder()
                .result(productReviewService.getAdminReviews(keyword, rating, visible, verified, replied))
                .build();
    }

    @PreAuthorize("hasAuthority('REVIEW_VIEW')")
    @GetMapping("/admin/{id}")
    public ApiResponse<AdminReviewResponse> getAdminReviewById(@PathVariable Long id) {
        return ApiResponse.<AdminReviewResponse>builder()
                .result(productReviewService.getAdminReviewById(id))
                .build();
    }

    @PreAuthorize("hasAuthority('REVIEW_UPDATE')")
    @PatchMapping("/admin/{id}/visibility")
    public ApiResponse<AdminReviewResponse> updateVisibility(
            @PathVariable Long id,
            @RequestBody AdminReviewVisibilityRequest request
    ) {
        return ApiResponse.<AdminReviewResponse>builder()
                .message("Cập nhật trạng thái hiển thị đánh giá thành công")
                .result(productReviewService.updateVisibility(id, request))
                .build();
    }

    @PreAuthorize("hasAuthority('REVIEW_DELETE')")
    @DeleteMapping("/admin/{id}")
    public ApiResponse<String> deleteReview(@PathVariable Long id) {
        productReviewService.deleteReview(id);
        return ApiResponse.<String>builder().message("Xóa đánh giá thành công").result("OK").build();
    }

    @PreAuthorize("hasAuthority('REVIEW_REPLY') or hasAuthority('REVIEW_UPDATE')")
    @PostMapping("/admin/{id}/reply")
    public ApiResponse<AdminReviewResponse> replyReview(
            @PathVariable Long id,
            @RequestBody AdminReviewReplyRequest request
    ) {
        return ApiResponse.<AdminReviewResponse>builder()
                .message("Phản hồi đánh giá thành công")
                .result(productReviewService.replyReview(id, request))
                .build();
    }

    @PreAuthorize("hasAuthority('REVIEW_REPLY') or hasAuthority('REVIEW_UPDATE')")
    @PutMapping("/admin/{id}/reply")
    public ApiResponse<AdminReviewResponse> updateReply(
            @PathVariable Long id,
            @RequestBody AdminReviewReplyRequest request
    ) {
        return ApiResponse.<AdminReviewResponse>builder()
                .message("Cập nhật phản hồi đánh giá thành công")
                .result(productReviewService.updateReply(id, request))
                .build();
    }

    @PreAuthorize("hasAuthority('REVIEW_REPLY') or hasAuthority('REVIEW_UPDATE')")
    @DeleteMapping("/admin/{id}/reply")
    public ApiResponse<AdminReviewResponse> deleteReply(@PathVariable Long id) {
        return ApiResponse.<AdminReviewResponse>builder()
                .message("Xóa phản hồi đánh giá thành công")
                .result(productReviewService.deleteReply(id))
                .build();
    }
}
