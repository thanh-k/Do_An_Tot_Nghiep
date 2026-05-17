package com.ecommerce.modules.behavior.dto.admin;

import com.ecommerce.modules.behavior.entity.BehaviorEventType;

public interface EventCountResponse {
    BehaviorEventType getEventType();
    Long getTotal();
}
