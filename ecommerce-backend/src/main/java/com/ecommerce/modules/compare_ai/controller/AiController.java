package com.ecommerce.modules.compare_ai.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.compare_ai.dto.request.AiCompareRequest;
import com.ecommerce.modules.compare_ai.dto.response.AiCompareResponse;
import com.ecommerce.modules.compare_ai.service.AiCompareService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiCompareService aiCompareService;

    @PostMapping("/compare-analysis")
    public ApiResponse<AiCompareResponse> getCompareAnalysis(@RequestBody AiCompareRequest request) {
        String markdownResult = aiCompareService.analyzeComparison(request.getProductIds());

        AiCompareResponse response = new AiCompareResponse(markdownResult);

        ApiResponse<AiCompareResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(response);
        return apiResponse;
    }
}