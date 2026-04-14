package com.ecommerce.modules.phoneprefix.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.PhonePrefix;
import com.ecommerce.modules.phoneprefix.dto.request.PhonePrefixRequest;
import com.ecommerce.modules.phoneprefix.dto.response.PhonePrefixResponse;
import com.ecommerce.modules.phoneprefix.repository.PhonePrefixRepository;
import com.ecommerce.modules.phoneprefix.service.PhonePrefixMapper;
import com.ecommerce.modules.phoneprefix.service.PhonePrefixService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PhonePrefixServiceImpl implements PhonePrefixService {

    private final PhonePrefixRepository repository;
    private final PhonePrefixMapper mapper;

    @Override
    public List<PhonePrefixResponse> getAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Override
    public List<PhonePrefixResponse> getActivePrefixes() {
        return repository.findAllByActiveTrueOrderByPrefixAsc().stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional
    public PhonePrefixResponse create(PhonePrefixRequest request) {
        String prefix = normalizePrefix(request.getPrefix());
        if (repository.existsByPrefix(prefix)) {
            throw new AppException(ErrorCode.PHONE_PREFIX_ALREADY_EXISTS);
        }
        PhonePrefix entity = PhonePrefix.builder()
                .prefix(prefix)
                .providerName(normalizeProviderName(request.getProviderName()))
                .active(request.getActive() == null || request.getActive())
                .build();
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public PhonePrefixResponse update(Long id, PhonePrefixRequest request) {
        PhonePrefix entity = repository.findById(id).orElseThrow(() -> new AppException(ErrorCode.PHONE_PREFIX_NOT_FOUND));
        String prefix = normalizePrefix(request.getPrefix());
        if (repository.existsByPrefixAndIdNot(prefix, id)) {
            throw new AppException(ErrorCode.PHONE_PREFIX_ALREADY_EXISTS);
        }
        entity.setPrefix(prefix);
        entity.setProviderName(normalizeProviderName(request.getProviderName()));
        entity.setActive(request.getActive() == null || request.getActive());
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        PhonePrefix entity = repository.findById(id).orElseThrow(() -> new AppException(ErrorCode.PHONE_PREFIX_NOT_FOUND));
        repository.delete(entity);
    }

    @Override
    public void validateAllowedPrefix(String phone) {
        if (phone == null || phone.length() < 3) {
            throw new AppException(ErrorCode.PHONE_INVALID);
        }
        String prefix = phone.substring(0, 3);
        PhonePrefix phonePrefix = repository.findByPrefix(prefix).orElseThrow(() -> new AppException(ErrorCode.PHONE_PREFIX_NOT_ALLOWED));
        if (!Boolean.TRUE.equals(phonePrefix.getActive())) {
            throw new AppException(ErrorCode.PHONE_PREFIX_NOT_ALLOWED);
        }
    }

    private String normalizePrefix(String prefix) {
        if (prefix == null) {
            throw new AppException(ErrorCode.PHONE_PREFIX_INVALID);
        }
        String normalized = prefix.trim();
        if (!normalized.matches("^\\d{3}$")) {
            throw new AppException(ErrorCode.PHONE_PREFIX_INVALID);
        }
        return normalized;
    }

    private String normalizeProviderName(String providerName) {
        if (providerName == null || providerName.trim().length() < 2) {
            throw new AppException(ErrorCode.PHONE_PROVIDER_INVALID);
        }
        return providerName.trim();
    }
}
