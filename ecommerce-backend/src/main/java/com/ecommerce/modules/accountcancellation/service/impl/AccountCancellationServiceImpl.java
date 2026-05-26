package com.ecommerce.modules.accountcancellation.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserAddress;
import com.ecommerce.modules.accountcancellation.dto.AccountCancellationCreateRequest;
import com.ecommerce.modules.accountcancellation.dto.AccountCancellationProcessRequest;
import com.ecommerce.modules.accountcancellation.dto.AccountCancellationResponse;
import com.ecommerce.modules.accountcancellation.entity.AccountCancellationRequest;
import com.ecommerce.modules.accountcancellation.entity.AccountCancellationStatus;
import com.ecommerce.modules.accountcancellation.repository.AccountCancellationRequestRepository;
import com.ecommerce.modules.accountcancellation.service.AccountCancellationService;
import com.ecommerce.modules.role.entity.RoleName;
import com.ecommerce.modules.order.repository.OrderRepository;
import com.ecommerce.modules.user.repository.UserAddressRepository;
import com.ecommerce.modules.user.repository.UserRepository;
import com.ecommerce.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountCancellationServiceImpl implements AccountCancellationService {

    private final AccountCancellationRequestRepository accountCancellationRequestRepository;
    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final OrderRepository orderRepository;
    private final UserService userService;

    private static final List<String> FINISHED_ORDER_STATUSES = List.of(
            "COMPLETED", "COMPLETE", "DELIVERED", "PAID", "DONE",
            "CANCELLED", "CANCELED", "REFUNDED", "FAILED"
    );

    @Override
    @Transactional
    public AccountCancellationResponse createMyRequest(AccountCancellationCreateRequest request) {
        User user = getCurrentAuthenticatedUser();

        if (Boolean.TRUE.equals(user.getDeleted()) || !Boolean.TRUE.equals(user.getActive())) {
            throw new AppException(ErrorCode.USER_DISABLED);
        }

        if (user.getRole() == RoleName.ADMIN || user.getRole() == RoleName.SUPER_ADMIN) {
            throw new AppException(ErrorCode.ADMIN_CANNOT_DELETE);
        }

        if (accountCancellationRequestRepository.existsByUserIdAndStatus(user.getId(), AccountCancellationStatus.PENDING)) {
            throw new AppException(ErrorCode.ACCOUNT_CANCELLATION_REQUEST_EXISTS);
        }

        AccountCancellationRequest saved = accountCancellationRequestRepository.save(
                AccountCancellationRequest.builder()
                        .user(user)
                        .reason(cleanText(request == null ? null : request.getReason()))
                        .status(AccountCancellationStatus.PENDING)
                        .build()
        );

        return toResponse(saved);
    }

    @Override
    public List<AccountCancellationResponse> getAllRequests() {
        return accountCancellationRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AccountCancellationResponse approveRequest(Long id, AccountCancellationProcessRequest request) {
        AccountCancellationRequest cancellationRequest = findRequest(id);
        ensurePending(cancellationRequest);

        long unfinishedOrderCount = countUnfinishedOrders(cancellationRequest.getUser());
        if (unfinishedOrderCount > 0) {
            throw new AppException(ErrorCode.ACCOUNT_CANCELLATION_HAS_UNFINISHED_ORDERS);
        }

        User admin = getCurrentAuthenticatedUser();
        cancellationRequest.setStatus(AccountCancellationStatus.APPROVED);
        cancellationRequest.setProcessedBy(admin);
        cancellationRequest.setAdminNote(cleanText(request == null ? null : request.getAdminNote()));
        cancellationRequest.setProcessedAt(LocalDateTime.now());
        accountCancellationRequestRepository.save(cancellationRequest);

        if (!Boolean.TRUE.equals(cancellationRequest.getUser().getDeleted())) {
            userService.deleteUser(cancellationRequest.getUser().getId());
        }

        return toResponse(cancellationRequest);
    }

    @Override
    @Transactional
    public AccountCancellationResponse rejectRequest(Long id, AccountCancellationProcessRequest request) {
        AccountCancellationRequest cancellationRequest = findRequest(id);
        ensurePending(cancellationRequest);

        User admin = getCurrentAuthenticatedUser();
        cancellationRequest.setStatus(AccountCancellationStatus.REJECTED);
        cancellationRequest.setProcessedBy(admin);
        cancellationRequest.setAdminNote(cleanText(request == null ? null : request.getAdminNote()));
        cancellationRequest.setProcessedAt(LocalDateTime.now());

        return toResponse(accountCancellationRequestRepository.save(cancellationRequest));
    }

    private AccountCancellationRequest findRequest(Long id) {
        return accountCancellationRequestRepository.findWithUserById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_CANCELLATION_REQUEST_NOT_FOUND));
    }

    private void ensurePending(AccountCancellationRequest request) {
        if (request.getStatus() != AccountCancellationStatus.PENDING) {
            throw new AppException(ErrorCode.ACCOUNT_CANCELLATION_REQUEST_PROCESSED);
        }
    }

    private User getCurrentAuthenticatedUser() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmailIgnoreCase(principal)
                .or(() -> userAddressRepository.findAll().stream()
                        .filter(address -> address.getPhone().equals(principal))
                        .findFirst()
                        .map(UserAddress::getUser))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private long countUnfinishedOrders(User user) {
        if (user == null || user.getId() == null) {
            return 0L;
        }
        return orderRepository.countUnfinishedOrdersByUserId(String.valueOf(user.getId()), FINISHED_ORDER_STATUSES);
    }

    private String cleanText(String text) {
        if (text == null) return null;
        String value = text.trim();
        return value.isBlank() ? null : value;
    }

    private AccountCancellationResponse toResponse(AccountCancellationRequest request) {
        User user = request.getUser();
        UserAddress primary = user.getAddresses() == null ? null : user.getAddresses().stream()
                .filter(UserAddress::getIsDefault)
                .findFirst()
                .orElse(user.getAddresses().isEmpty() ? null : user.getAddresses().get(0));
        boolean deleted = Boolean.TRUE.equals(user.getDeleted());
        long unfinishedOrderCount = countUnfinishedOrders(user);

        return AccountCancellationResponse.builder()
                .id(request.getId())
                .userId(user.getId())
                .userName(deleted ? "Tài khoản đã ngưng hoạt động" : user.getFullName())
                .email(deleted ? null : user.getEmail())
                .phone(deleted || primary == null ? null : primary.getPhone())
                .hasUnfinishedOrders(unfinishedOrderCount > 0)
                .unfinishedOrderCount(unfinishedOrderCount)
                .reason(request.getReason())
                .status(request.getStatus())
                .adminNote(request.getAdminNote())
                .processedById(request.getProcessedBy() == null ? null : request.getProcessedBy().getId())
                .processedByName(request.getProcessedBy() == null ? null : request.getProcessedBy().getFullName())
                .createdAt(request.getCreatedAt())
                .processedAt(request.getProcessedAt())
                .build();
    }
}
