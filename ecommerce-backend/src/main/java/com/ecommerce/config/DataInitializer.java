package com.ecommerce.config;

import com.ecommerce.entity.AccessPermission;
import com.ecommerce.entity.AccessRole;
import com.ecommerce.entity.PhonePrefix;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserAddress;
import com.ecommerce.modules.phoneprefix.repository.PhonePrefixRepository;
import com.ecommerce.modules.role.entity.RoleName;
import com.ecommerce.modules.role.repository.AccessPermissionRepository;
import com.ecommerce.modules.role.repository.AccessRoleRepository;
import com.ecommerce.modules.user.repository.UserAddressRepository;
import com.ecommerce.modules.user.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final PhonePrefixRepository phonePrefixRepository;
    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;
    private final AccessPermissionRepository accessPermissionRepository;
    private final AccessRoleRepository accessRoleRepository;

    @Override
    public void run(String... args) throws Exception {
        relaxLegacyUsersSchema();
        seedPhonePrefixes();
        seedAccessControl();
        seedAdminAccount();
        syncUsersToDynamicRoles();
    }

    private void relaxLegacyUsersSchema() {
        try {
            Integer phoneColumn = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns " +
                            "WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'phone'",
                    Integer.class
            );
            if (phoneColumn != null && phoneColumn > 0) {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN phone VARCHAR(10) NULL");
            }

            Integer passwordColumn = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns " +
                            "WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'password_hash'",
                    Integer.class
            );
            if (passwordColumn != null && passwordColumn > 0) {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN password_hash TEXT NULL");
            }
        } catch (Exception ignored) {
        }
    }

    private void seedPhonePrefixes() throws Exception {
        if (phonePrefixRepository.count() > 0) return;

        InputStream inputStream = new ClassPathResource("data/phone-prefixes.json").getInputStream();
        List<Map<String, String>> items = objectMapper.readValue(inputStream, new TypeReference<>() {});

        List<PhonePrefix> prefixes = items.stream()
                .map(item -> PhonePrefix.builder()
                        .prefix(item.get("prefix"))
                        .providerName(item.get("providerName"))
                        .active(true)
                        .build())
                .toList();

        phonePrefixRepository.saveAll(prefixes);
    }

    private void seedAccessControl() {
        List<AccessPermission> permissions = List.of(

                // =========================
                // SYSTEM / ACCESS
                // =========================
                permission("ROLE_MANAGE", "Quản lý danh sách vai trò", "ACCESS"),
                permission("ROLE_ASSIGN", "Gán vai trò cho người dùng", "ACCESS"),

                // =========================
                // USER / STAFF / CUSTOMER
                // =========================
                permission("USER_VIEW", "Xem người dùng", "USER"),
                permission("USER_CREATE", "Tạo người dùng", "USER"),
                permission("USER_UPDATE", "Cập nhật người dùng", "USER"),
                permission("USER_DELETE", "Xóa người dùng", "USER"),
                permission("CUSTOMER_VIEW", "Xem khách hàng", "CUSTOMER"),
                permission("STAFF_VIEW", "Xem nhân sự", "STAFF"),

                // =========================
                // PHONE PREFIX
                // =========================
                permission("PHONE_PREFIX_VIEW", "Xem đầu số điện thoại", "PHONE"),
                permission("PHONE_PREFIX_MANAGE", "Quản lý đầu số điện thoại", "PHONE"),

                // =========================
                // NEWS TOPIC
                // =========================
                permission("NEWS_TOPIC_VIEW", "Xem chủ đề tin tức", "NEWS_TOPIC"),
                permission("NEWS_TOPIC_CREATE", "Thêm chủ đề tin tức", "NEWS_TOPIC"),
                permission("NEWS_TOPIC_UPDATE", "Sửa chủ đề tin tức", "NEWS_TOPIC"),
                permission("NEWS_TOPIC_DELETE", "Xóa chủ đề tin tức", "NEWS_TOPIC"),

                // =========================
                // NEWS POST
                // =========================
                permission("NEWS_POST_VIEW", "Xem bài viết tin tức", "NEWS_POST"),
                permission("NEWS_POST_CREATE", "Thêm bài viết tin tức", "NEWS_POST"),
                permission("NEWS_POST_UPDATE", "Sửa bài viết tin tức", "NEWS_POST"),
                permission("NEWS_POST_DELETE", "Xóa bài viết tin tức", "NEWS_POST"),
                permission("NEWS_POST_PUBLISH", "Xuất bản bài viết tin tức", "NEWS_POST"),

                // =========================
                // CONTACT
                // =========================
                permission("CONTACT_VIEW", "Xem liên hệ", "CONTACT"),
                permission("CONTACT_REPLY", "Phản hồi liên hệ", "CONTACT"),
                permission("CONTACT_UPDATE", "Cập nhật trạng thái liên hệ", "CONTACT"),

                // =========================
                // ANALYTICS
                // =========================
                permission("ANALYTICS_VIEW", "Xem thống kê", "ANALYTICS"),
                permission("ANALYTICS_EXPORT", "Xuất báo cáo thống kê", "ANALYTICS"),

                // =========================
                // RECOMMENDATION
                // =========================
                permission("RECOMMENDATION_VIEW", "Xem gợi ý sản phẩm", "RECOMMENDATION"),
                permission("RECOMMENDATION_MANAGE", "Quản lý gợi ý sản phẩm", "RECOMMENDATION"),

                // =========================
                // WALLET
                // =========================
                permission("WALLET_VIEW", "Xem ví thành viên", "WALLET"),
                permission("WALLET_TOPUP", "Nạp tiền vào ví", "WALLET"),
                permission("WALLET_DEDUCT", "Trừ tiền ví", "WALLET"),
                permission("WALLET_TRANSACTION_VIEW", "Xem lịch sử giao dịch ví", "WALLET"),

                // =========================
                // MEMBERSHIP
                // =========================
                permission("MEMBERSHIP_VIEW", "Xem hạng thành viên", "MEMBERSHIP"),
                permission("MEMBERSHIP_UPDATE", "Cập nhật hạng thành viên", "MEMBERSHIP"),
                permission("MEMBERSHIP_MANAGE", "Quản lý hạng thành viên", "MEMBERSHIP"),

                // =========================
                // PAYMENT BACKEND
                // =========================
                permission("PAYMENT_VIEW", "Xem thông tin thanh toán", "PAYMENT"),
                permission("PAYMENT_USE", "Sử dụng thanh toán", "PAYMENT"),
                permission("PAYMENT_MANAGE", "Quản lý thanh toán", "PAYMENT"),
                permission("PAYMENT_VERIFY", "Xác thực giao dịch thanh toán", "PAYMENT"),

                // =========================
                // VOUCHER BACKEND
                // =========================
                permission("VOUCHER_VIEW", "Xem voucher", "VOUCHER"),
                permission("VOUCHER_CREATE", "Thêm voucher", "VOUCHER"),
                permission("VOUCHER_UPDATE", "Sửa voucher", "VOUCHER"),
                permission("VOUCHER_DELETE", "Xóa voucher", "VOUCHER"),
                permission("VOUCHER_VALIDATE", "Kiểm tra voucher", "VOUCHER"),
                permission("VOUCHER_APPLY", "Áp dụng voucher", "VOUCHER"),

                // =========================
                // PRODUCT
                // =========================
                permission("PRODUCT_VIEW", "Xem sản phẩm", "PRODUCT"),
                permission("PRODUCT_CREATE", "Thêm sản phẩm", "PRODUCT"),
                permission("PRODUCT_UPDATE", "Sửa sản phẩm", "PRODUCT"),
                permission("PRODUCT_DELETE", "Xóa sản phẩm", "PRODUCT"),

                // =========================
                // CATEGORY
                // =========================
                permission("CATEGORY_VIEW", "Xem danh mục", "CATEGORY"),
                permission("CATEGORY_CREATE", "Thêm danh mục", "CATEGORY"),
                permission("CATEGORY_UPDATE", "Sửa danh mục", "CATEGORY"),
                permission("CATEGORY_DELETE", "Xóa danh mục", "CATEGORY"),

                // =========================
                // INVENTORY
                // =========================
                permission("INVENTORY_VIEW", "Xem tồn kho", "INVENTORY"),
                permission("INVENTORY_UPDATE", "Cập nhật tồn kho", "INVENTORY"),

                // =========================
                // IMAGE
                // =========================
                permission("IMAGE_UPLOAD", "Tải ảnh sản phẩm", "IMAGE"),
                permission("IMAGE_DELETE", "Xóa ảnh sản phẩm", "IMAGE"),

                // =========================
                // VISION
                // =========================
                permission("VISION_SEARCH", "Tìm kiếm bằng hình ảnh", "VISION"),
                permission("VISION_MANAGE", "Quản lý tìm kiếm hình ảnh", "VISION"),

                // =========================
                // COMPARE
                // =========================
                permission("COMPARE_PRODUCT_USE", "So sánh sản phẩm", "COMPARE"),

                // =========================
                // CART
                // =========================
                permission("CART_VIEW", "Xem giỏ hàng", "CART"),
                permission("CART_ADD", "Thêm vào giỏ hàng", "CART"),
                permission("CART_UPDATE", "Cập nhật giỏ hàng", "CART"),
                permission("CART_DELETE", "Xóa khỏi giỏ hàng", "CART"),

                // =========================
                // ORDER
                // =========================
                permission("ORDER_CREATE", "Tạo đơn hàng", "ORDER"),
                permission("ORDER_VIEW", "Xem đơn hàng", "ORDER"),
                permission("ORDER_UPDATE", "Cập nhật đơn hàng", "ORDER"),
                permission("ORDER_DELETE", "Xóa đơn hàng", "ORDER"),

                // =========================
                // REVIEW / COMMENT
                // =========================
                permission("REVIEW_VIEW", "Xem bình luận", "REVIEW"),
                permission("REVIEW_CREATE", "Thêm bình luận", "REVIEW"),
                permission("REVIEW_UPDATE", "Sửa bình luận", "REVIEW"),
                permission("REVIEW_DELETE", "Xóa bình luận", "REVIEW")
        );

        for (AccessPermission permission : permissions) {
            accessPermissionRepository.findByCode(permission.getCode())
                    .orElseGet(() -> accessPermissionRepository.save(permission));
        }

        createSystemRole("USER", "Khách hàng", List.of());

        createSystemRole(
                "ADMIN",
                "Quản trị viên",
                List.of(
                        "USER_VIEW",
                        "USER_CREATE",
                        "USER_UPDATE",
                        "USER_DELETE",
                        "CUSTOMER_VIEW",
                        "STAFF_VIEW",
                        "PHONE_PREFIX_VIEW",
                        "PHONE_PREFIX_MANAGE",

                        "NEWS_TOPIC_VIEW",
                        "NEWS_TOPIC_CREATE",
                        "NEWS_TOPIC_UPDATE",
                        "NEWS_TOPIC_DELETE",

                        "NEWS_POST_VIEW",
                        "NEWS_POST_CREATE",
                        "NEWS_POST_UPDATE",
                        "NEWS_POST_DELETE",
                        "NEWS_POST_PUBLISH",

                        "CONTACT_VIEW",
                        "CONTACT_REPLY",
                        "CONTACT_UPDATE",

                        "ANALYTICS_VIEW",
                        "ANALYTICS_EXPORT",

                        "RECOMMENDATION_VIEW",
                        "RECOMMENDATION_MANAGE",

                        "WALLET_VIEW",
                        "WALLET_TOPUP",
                        "WALLET_DEDUCT",
                        "WALLET_TRANSACTION_VIEW",

                        "MEMBERSHIP_VIEW",
                        "MEMBERSHIP_UPDATE",
                        "MEMBERSHIP_MANAGE",

                        "PAYMENT_VIEW",
                        "PAYMENT_USE",
                        "PAYMENT_MANAGE",
                        "PAYMENT_VERIFY",

                        "VOUCHER_VIEW",
                        "VOUCHER_CREATE",
                        "VOUCHER_UPDATE",
                        "VOUCHER_DELETE",
                        "VOUCHER_VALIDATE",
                        "VOUCHER_APPLY",

                        "PRODUCT_VIEW",
                        "PRODUCT_CREATE",
                        "PRODUCT_UPDATE",
                        "PRODUCT_DELETE",

                        "CATEGORY_VIEW",
                        "CATEGORY_CREATE",
                        "CATEGORY_UPDATE",
                        "CATEGORY_DELETE",

                        "INVENTORY_VIEW",
                        "INVENTORY_UPDATE",

                        "IMAGE_UPLOAD",
                        "IMAGE_DELETE",

                        "VISION_SEARCH",
                        "VISION_MANAGE",

                        "COMPARE_PRODUCT_USE",

                        "ORDER_VIEW",
                        "ORDER_UPDATE",

                        "REVIEW_VIEW",
                        "REVIEW_DELETE"
                )
        );

        createSystemRole(
                "SUPER_ADMIN",
                "Siêu quản trị",
                List.of(
                        "ROLE_MANAGE",
                        "ROLE_ASSIGN",

                        "USER_VIEW",
                        "USER_CREATE",
                        "USER_UPDATE",
                        "USER_DELETE",
                        "CUSTOMER_VIEW",
                        "STAFF_VIEW",

                        "PHONE_PREFIX_VIEW",
                        "PHONE_PREFIX_MANAGE",

                        "NEWS_TOPIC_VIEW",
                        "NEWS_TOPIC_CREATE",
                        "NEWS_TOPIC_UPDATE",
                        "NEWS_TOPIC_DELETE",

                        "NEWS_POST_VIEW",
                        "NEWS_POST_CREATE",
                        "NEWS_POST_UPDATE",
                        "NEWS_POST_DELETE",
                        "NEWS_POST_PUBLISH",

                        "CONTACT_VIEW",
                        "CONTACT_REPLY",
                        "CONTACT_UPDATE",

                        "ANALYTICS_VIEW",
                        "ANALYTICS_EXPORT",

                        "RECOMMENDATION_VIEW",
                        "RECOMMENDATION_MANAGE",

                        "WALLET_VIEW",
                        "WALLET_TOPUP",
                        "WALLET_DEDUCT",
                        "WALLET_TRANSACTION_VIEW",

                        "MEMBERSHIP_VIEW",
                        "MEMBERSHIP_UPDATE",
                        "MEMBERSHIP_MANAGE",

                        "PAYMENT_VIEW",
                        "PAYMENT_USE",
                        "PAYMENT_MANAGE",
                        "PAYMENT_VERIFY",

                        "VOUCHER_VIEW",
                        "VOUCHER_CREATE",
                        "VOUCHER_UPDATE",
                        "VOUCHER_DELETE",
                        "VOUCHER_VALIDATE",
                        "VOUCHER_APPLY",

                        "PRODUCT_VIEW",
                        "PRODUCT_CREATE",
                        "PRODUCT_UPDATE",
                        "PRODUCT_DELETE",

                        "CATEGORY_VIEW",
                        "CATEGORY_CREATE",
                        "CATEGORY_UPDATE",
                        "CATEGORY_DELETE",

                        "INVENTORY_VIEW",
                        "INVENTORY_UPDATE",

                        "IMAGE_UPLOAD",
                        "IMAGE_DELETE",

                        "VISION_SEARCH",
                        "VISION_MANAGE",

                        "COMPARE_PRODUCT_USE",

                        "CART_VIEW",
                        "CART_ADD",
                        "CART_UPDATE",
                        "CART_DELETE",

                        "ORDER_CREATE",
                        "ORDER_VIEW",
                        "ORDER_UPDATE",
                        "ORDER_DELETE",

                        "REVIEW_VIEW",
                        "REVIEW_CREATE",
                        "REVIEW_UPDATE",
                        "REVIEW_DELETE"
                )
        );
    }

    private void createSystemRole(String code, String name, List<String> permissionCodes) {
        AccessRole role = accessRoleRepository.findByCodeIgnoreCase(code)
                .orElseGet(() -> accessRoleRepository.save(
                        AccessRole.builder()
                                .code(code)
                                .name(name)
                                .description(name)
                                .systemRole(true)
                                .build()
                ));

        Set<AccessPermission> permissions = new LinkedHashSet<>();
        for (String permissionCode : permissionCodes) {
            accessPermissionRepository.findByCode(permissionCode).ifPresent(permissions::add);
        }

        role.setPermissions(permissions);
        accessRoleRepository.save(role);
    }

    private AccessPermission permission(String code, String name, String module) {
        return AccessPermission.builder()
                .code(code)
                .name(name)
                .module(module)
                .description(name)
                .build();
    }

    private void seedAdminAccount() {
        if (userRepository.existsByEmailIgnoreCase("admin@novashop.vn")) return;

        User admin = User.builder()
                .fullName("Nova Admin")
                .email("admin@novashop.vn")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .role(RoleName.SUPER_ADMIN)
                .active(true)
                .authProvider("LOCAL")
                .build();

        User saved = userRepository.save(admin);

        userAddressRepository.save(
                UserAddress.builder()
                        .user(saved)
                        .recipientName("Nova Admin")
                        .phone("0909123456")
                        .addressLine("68 Nguyễn Huệ, Quận 1, TP.HCM")
                        .isDefault(true)
                        .build()
        );
    }

    private void syncUsersToDynamicRoles() {
        AccessRole userRole = accessRoleRepository.findByCodeIgnoreCase("USER").orElse(null);
        AccessRole adminRole = accessRoleRepository.findByCodeIgnoreCase("ADMIN").orElse(null);
        AccessRole superRole = accessRoleRepository.findByCodeIgnoreCase("SUPER_ADMIN").orElse(null);

        for (User user : userRepository.findAll()) {
            if (user.getAccessRoles() == null || user.getAccessRoles().isEmpty()) {
                if (user.getRole() == RoleName.SUPER_ADMIN && superRole != null) {
                    user.getAccessRoles().add(superRole);
                } else if (user.getRole() == RoleName.ADMIN && adminRole != null) {
                    user.getAccessRoles().add(adminRole);
                } else if (userRole != null) {
                    user.getAccessRoles().add(userRole);
                }
                userRepository.save(user);
            }
        }
    }
}