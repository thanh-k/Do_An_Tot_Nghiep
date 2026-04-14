package com.ecommerce.modules.phoneprefix.service;

import com.ecommerce.entity.PhonePrefix;
import com.ecommerce.modules.phoneprefix.dto.response.PhonePrefixResponse;
import org.springframework.stereotype.Component;

@Component
public class PhonePrefixMapper {
    public PhonePrefixResponse toResponse(PhonePrefix entity) {
        return PhonePrefixResponse.builder()
                .id(entity.getId())
                .prefix(entity.getPrefix())
                .providerName(entity.getProviderName())
                .active(entity.getActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
