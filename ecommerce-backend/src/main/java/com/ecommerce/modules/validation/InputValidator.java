package com.ecommerce.modules.validation;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class InputValidator {

    private static final String EMAIL_REGEX = "^[^\\s@]+@[^\\s@]+\\.[^\\s@.]+$";
    private static final String FULL_NAME_REGEX = "^[\\p{L} ]{2,100}$";
    private static final String PHONE_REGEX = "^\\d{10}$";

    public String normalizePhone(String phone) {
        if (phone == null) {
            throw new AppException(ErrorCode.PHONE_REQUIRED);
        }
        return phone.replaceAll("\\s+", "").trim();
    }

    public String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String normalized = email.trim().toLowerCase();
        return normalized.isBlank() ? null : normalized;
    }

    public String normalizeFullName(String fullName) {
        if (fullName == null) {
            throw new AppException(ErrorCode.FULL_NAME_INVALID);
        }
        return fullName.trim().replaceAll("\\s+", " ");
    }

    public void validateEmail(String email) {
        if (email == null) {
            return;
        }
        if (email.length() < 3 || email.length() > 320 || !email.matches(EMAIL_REGEX)) {
            throw new AppException(ErrorCode.EMAIL_INVALID);
        }
    }

    public void validatePhone(String phone) {
        if (phone == null || !phone.matches(PHONE_REGEX)) {
            throw new AppException(ErrorCode.PHONE_INVALID);
        }
    }

    public void validateFullName(String fullName) {
        if (fullName == null || !fullName.matches(FULL_NAME_REGEX) || fullName.trim().length() < 2) {
            throw new AppException(ErrorCode.FULL_NAME_INVALID);
        }
    }
}
