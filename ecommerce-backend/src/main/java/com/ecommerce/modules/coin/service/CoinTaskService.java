package com.ecommerce.modules.coin.service;

import com.ecommerce.entity.ProductReview;
import com.ecommerce.entity.User;
import com.ecommerce.modules.coin.dto.request.CoinTaskUpsertRequest;
import com.ecommerce.modules.coin.dto.response.CoinClaimResponse;
import com.ecommerce.modules.coin.dto.response.CoinOverviewResponse;
import com.ecommerce.modules.coin.dto.response.CoinRedeemOptionResponse;
import com.ecommerce.modules.coin.dto.response.CoinTaskResponse;

import java.util.List;

public interface CoinTaskService {
    List<CoinTaskResponse> getAdminTasks();
    CoinTaskResponse createTask(CoinTaskUpsertRequest request);
    CoinTaskResponse updateTask(Long id, CoinTaskUpsertRequest request);
    void deleteTask(Long id);

    CoinOverviewResponse getUserOverview();
    List<CoinTaskResponse> getUserTasks();
    List<CoinRedeemOptionResponse> getRedeemOptions();
    CoinClaimResponse claimTask(String taskCode);
    void rewardReviewCreated(User user, ProductReview review, boolean hasImages);
}
