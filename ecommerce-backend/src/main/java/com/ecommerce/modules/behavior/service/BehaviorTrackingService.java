package com.ecommerce.modules.behavior.service;

import com.ecommerce.modules.behavior.dto.BehaviorTrackRequest;
import com.ecommerce.modules.behavior.dto.BehaviorTrackResponse;

public interface BehaviorTrackingService {
    BehaviorTrackResponse track(BehaviorTrackRequest request);
}
