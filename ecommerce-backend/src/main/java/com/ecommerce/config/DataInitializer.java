package com.ecommerce.config;

import com.ecommerce.entity.PhonePrefix;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserAddress;
import com.ecommerce.modules.phoneprefix.repository.PhonePrefixRepository;
import com.ecommerce.modules.role.entity.RoleName;
import com.ecommerce.modules.user.repository.UserAddressRepository;
import com.ecommerce.modules.user.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.jdbc.core.JdbcTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final PhonePrefixRepository phonePrefixRepository;
    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        relaxLegacyUsersSchema();
        seedPhonePrefixes();
        seedAdminAccount();
    }


    private void relaxLegacyUsersSchema() {
        try {
            Integer phoneColumn = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'phone'",
                    Integer.class
            );
            if (phoneColumn != null && phoneColumn > 0) {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN phone VARCHAR(10) NULL");
            }
        } catch (Exception ignored) {
        }
    }

    private void seedPhonePrefixes() throws Exception {
        if (phonePrefixRepository.count() > 0) return;
        InputStream inputStream = new ClassPathResource("data/phone-prefixes.json").getInputStream();
        List<Map<String, String>> items = objectMapper.readValue(inputStream, new TypeReference<>() {});
        List<PhonePrefix> prefixes = items.stream()
                .map(item -> PhonePrefix.builder().prefix(item.get("prefix")).providerName(item.get("providerName")).active(true).build())
                .toList();
        phonePrefixRepository.saveAll(prefixes);
    }

    private void seedAdminAccount() {
        if (userRepository.existsByEmailIgnoreCase("admin@novashop.vn")) return;
        User admin = User.builder()
                .fullName("Nova Admin")
                .email("admin@novashop.vn")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .role(RoleName.ADMIN)
                .active(true)
                .authProvider("LOCAL")
                .build();
        User saved = userRepository.save(admin);
        userAddressRepository.save(UserAddress.builder()
                .user(saved)
                .recipientName("Nova Admin")
                .phone("0909123456")
                .addressLine("68 Nguyễn Huệ, Quận 1, TP.HCM")
                .isDefault(true)
                .build());
    }
}
