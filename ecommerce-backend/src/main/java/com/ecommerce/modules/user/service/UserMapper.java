package com.ecommerce.modules.user.service;

import com.ecommerce.entity.AccessPermission;
import com.ecommerce.entity.AccessRole;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserAddress;
import com.ecommerce.modules.membership.entity.MembershipSubscription;
import com.ecommerce.modules.membership.entity.MembershipSubscriptionStatus;
import com.ecommerce.modules.membership.repository.MembershipSubscriptionRepository;
import com.ecommerce.modules.user.dto.response.UserAddressResponse;
import com.ecommerce.modules.user.dto.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final MembershipSubscriptionRepository membershipSubscriptionRepository;

    public UserResponse toResponse(User user) {
        List<UserAddressResponse> addresses = user.getAddresses() == null ? List.of() : user.getAddresses().stream()
                .sorted(Comparator.comparing(UserAddress::getIsDefault).reversed().thenComparing(UserAddress::getCreatedAt))
                .map(this::toAddressResponse)
                .toList();

        UserAddressResponse primary = addresses.stream().filter(UserAddressResponse::getIsDefault).findFirst()
                .orElse(addresses.isEmpty() ? null : addresses.get(0));

        List<String> roles = user.getAccessRoles() == null ? List.of() : user.getAccessRoles().stream().map(AccessRole::getCode).sorted().toList();
        List<String> permissions = user.getAccessRoles() == null ? List.of() : user.getAccessRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(AccessPermission::getCode)
                .distinct()
                .sorted()
                .toList();
        String primaryRole = !roles.isEmpty() ? roles.get(0) : user.getRole().name();

        Optional<MembershipSubscription> activeSubscription = membershipSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndedAtDesc(user.getId(), MembershipSubscriptionStatus.ACTIVE);
        Optional<MembershipSubscription> latestSubscription = activeSubscription.isPresent()
                ? activeSubscription
                : membershipSubscriptionRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId());

        boolean vip = activeSubscription.isPresent();
        String membershipCode = vip ? activeSubscription.get().getPlan().getCode() : "REGULAR";
        String membershipName = vip ? activeSubscription.get().getPlan().getName() : "Thành viên thường";
        String membershipStatus = latestSubscription.map(subscription -> subscription.getStatus().name()).orElse("REGULAR");

        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .primaryPhone(primary != null ? primary.getPhone() : null)
                .primaryAddress(primary != null ? primary.getAddressLine() : null)
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .role(primaryRole)
                .roles(roles)
                .permissions(permissions)
                .active(user.getActive())
                .authProvider(user.getAuthProvider())
                .vip(vip)
                .membershipCode(membershipCode)
                .membershipName(membershipName)
                .membershipStatus(membershipStatus)
                .membershipStartedAt(activeSubscription.map(MembershipSubscription::getStartedAt).orElse(null))
                .membershipEndedAt(activeSubscription.map(MembershipSubscription::getEndedAt).orElse(null))
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .addresses(addresses)
                .build();
    }

    public UserAddressResponse toAddressResponse(UserAddress address) {
        return UserAddressResponse.builder()
                .id(address.getId())
                .recipientName(address.getRecipientName())
                .phone(address.getPhone())
                .addressLine(address.getAddressLine())
                .isDefault(address.getIsDefault())
                .createdAt(address.getCreatedAt())
                .updatedAt(address.getUpdatedAt())
                .build();
    }
}
