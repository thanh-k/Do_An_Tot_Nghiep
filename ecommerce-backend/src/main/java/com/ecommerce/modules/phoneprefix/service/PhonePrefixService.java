package com.ecommerce.modules.phoneprefix.service;

import com.ecommerce.modules.phoneprefix.dto.request.PhonePrefixRequest;
import com.ecommerce.modules.phoneprefix.dto.response.PhonePrefixResponse;

import java.util.List;

public interface PhonePrefixService {
    List<PhonePrefixResponse> getAll();

    List<PhonePrefixResponse> getActivePrefixes();

    PhonePrefixResponse create(PhonePrefixRequest request);

    PhonePrefixResponse update(Long id, PhonePrefixRequest request);

    void delete(Long id);

    void validateAllowedPrefix(String phone);
}
