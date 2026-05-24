package com.ecommerce.modules.accountcancellation.service;

import com.ecommerce.modules.accountcancellation.dto.AccountCancellationCreateRequest;
import com.ecommerce.modules.accountcancellation.dto.AccountCancellationProcessRequest;
import com.ecommerce.modules.accountcancellation.dto.AccountCancellationResponse;

import java.util.List;

public interface AccountCancellationService {
    AccountCancellationResponse createMyRequest(AccountCancellationCreateRequest request);
    List<AccountCancellationResponse> getAllRequests();
    AccountCancellationResponse approveRequest(Long id, AccountCancellationProcessRequest request);
    AccountCancellationResponse rejectRequest(Long id, AccountCancellationProcessRequest request);
}
