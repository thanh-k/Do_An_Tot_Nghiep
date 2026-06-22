package com.ecommerce.modules.behavior.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorEventResponse;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorInterestResponse;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorSummaryResponse;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorProductReportResponse;
import com.ecommerce.modules.behavior.entity.BehaviorEventType;
import com.ecommerce.modules.behavior.service.AdminBehaviorService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/behaviors")
@RequiredArgsConstructor
public class AdminBehaviorController {

    private final AdminBehaviorService adminBehaviorService;

    @PreAuthorize("hasAuthority('BEHAVIOR_VIEW') or hasAuthority('RECOMMENDATION_VIEW')")
    @GetMapping("/summary")
    public ApiResponse<AdminBehaviorSummaryResponse> getSummary() {
        return ApiResponse.<AdminBehaviorSummaryResponse>builder()
                .result(adminBehaviorService.getSummary())
                .build();
    }

    @PreAuthorize("hasAuthority('BEHAVIOR_VIEW') or hasAuthority('RECOMMENDATION_VIEW')")
    @GetMapping
    public ApiResponse<List<AdminBehaviorEventResponse>> getEvents(
            @RequestParam(required = false) BehaviorEventType eventType,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String userKeyword,
            @RequestParam(required = false) String productKeyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "100") int limit
    ) {
        return ApiResponse.<List<AdminBehaviorEventResponse>>builder()
                .result(adminBehaviorService.getEvents(eventType, keyword, userKeyword, productKeyword, fromDate, toDate, limit))
                .build();
    }

    @PreAuthorize("hasAuthority('BEHAVIOR_VIEW') or hasAuthority('RECOMMENDATION_VIEW')")
    @GetMapping("/interests")
    public ApiResponse<List<AdminBehaviorInterestResponse>> getInterests(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String userKeyword,
            @RequestParam(required = false) String productKeyword,
            @RequestParam(defaultValue = "100") int limit
    ) {
        return ApiResponse.<List<AdminBehaviorInterestResponse>>builder()
                .result(adminBehaviorService.getInterests(keyword, userKeyword, productKeyword, limit))
                .build();
    }
    @PreAuthorize("hasAuthority('BEHAVIOR_VIEW') or hasAuthority('RECOMMENDATION_VIEW')")
    @GetMapping("/product-report")
    public ApiResponse<AdminBehaviorProductReportResponse> getProductReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.<AdminBehaviorProductReportResponse>builder()
                .result(adminBehaviorService.getProductReport(fromDate, toDate, limit))
                .build();
    }

    @PreAuthorize("hasAuthority('BEHAVIOR_VIEW') or hasAuthority('RECOMMENDATION_VIEW')")
    @GetMapping("/product-report/export")
    public ResponseEntity<byte[]> exportProductReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "10") int limit
    ) {
        byte[] file = adminBehaviorService.exportProductReportExcel(fromDate, toDate, limit);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=behavior-product-report.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }

}
