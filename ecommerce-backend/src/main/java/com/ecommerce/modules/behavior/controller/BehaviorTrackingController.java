package com.ecommerce.modules.behavior.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.behavior.dto.BehaviorTrackRequest;
import com.ecommerce.modules.behavior.dto.BehaviorTrackResponse;
import com.ecommerce.modules.behavior.service.BehaviorTrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/behaviors")
@RequiredArgsConstructor
@Slf4j
public class BehaviorTrackingController {

    private final BehaviorTrackingService behaviorTrackingService;

    @PostMapping("/track")
    public ApiResponse<BehaviorTrackResponse> track(@RequestBody @Valid BehaviorTrackRequest request) {
        try {
            return ApiResponse.<BehaviorTrackResponse>builder()
                    .result(behaviorTrackingService.track(request))
                    .build();
        } catch (Exception exception) {
            // Tracking chỉ phục vụ đề xuất sản phẩm, không được làm vỡ trải nghiệm mua hàng/lọc sản phẩm.
            log.warn("Không ghi nhận được hành vi người dùng: {}", exception.getMessage(), exception);
            return ApiResponse.<BehaviorTrackResponse>builder()
                    .result(BehaviorTrackResponse.builder()
                            .tracked(false)
                            .message("Không ghi nhận được hành vi người dùng")
                            .build())
                    .build();
        }
    }
}
