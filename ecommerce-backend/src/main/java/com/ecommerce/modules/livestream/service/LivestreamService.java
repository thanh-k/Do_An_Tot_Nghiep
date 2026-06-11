package com.ecommerce.modules.livestream.service;

import com.ecommerce.modules.livestream.dto.*;
import com.ecommerce.modules.livestream.entity.LivestreamStatus;

import java.util.List;

public interface LivestreamService {
    List<LivestreamResponse> getAll();
    List<LivestreamResponse> getLive();
    LivestreamResponse getById(Long id);
    LivestreamResponse create(LivestreamRequest request);
    LivestreamResponse update(Long id, LivestreamRequest request);
    void delete(Long id);
    java.util.List<com.ecommerce.modules.livestream.dto.LiveChatMessageResponse> getChatMessages(Long livestreamId);
    LivestreamResponse updateStatus(Long id, LivestreamStatus status);
    LivestreamResponse addProduct(Long livestreamId, Long productId);
    LivestreamResponse removeProduct(Long livestreamId, Long productId);
    LivestreamResponse pinProduct(Long livestreamId, Long productId);
    LivestreamResponse unpinProduct(Long livestreamId);
    LivestreamResponse createDeal(Long livestreamId, LivestreamDealRequest request);
    LivestreamResponse increaseViewer(Long livestreamId);
}
