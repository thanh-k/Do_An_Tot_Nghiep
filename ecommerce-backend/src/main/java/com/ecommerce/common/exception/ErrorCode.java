package com.ecommerce.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống chưa xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Mã lỗi không hợp lệ", HttpStatus.BAD_REQUEST),
    // Lỗi về Category
    CATEGORY_EXITED(1002, "Tên danh mục này đã tồn tại!", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_FOUND(1003, "Không tìm thấy danh mục!", HttpStatus.NOT_FOUND),
    // INVALID_CATEGORY_NAME
    // Lỗi về Category Validation
    INVALID_CATEGORY_NAME(1011, "Tên danh mục không được để trống và phải từ 2-50 ký tự", HttpStatus.BAD_REQUEST),
    // (Mã 1002 nếu ní đã có thì giữ nguyên, chỉ cần thêm cái INVALID_CATEGORY_NAME
    // thôi)

    // Lỗi về Brand

    BRAND_EXISTED(1008, "Tên Thương hiệu đã tồn tại", HttpStatus.BAD_REQUEST),
    BRAND_NOT_FOUND(1009, "Không tìm thấy thương hiệu", HttpStatus.NOT_FOUND),

    // Trong file common/exception/ErrorCode.java
    INVALID_BRAND_NAME(1008, "Tên thương hiệu không được để trống và phải từ 2-50 ký tự", HttpStatus.BAD_REQUEST),
    INVALID_FILE_FORMAT(1009, "Chỉ chấp nhận ảnh định dạng .jpg, .jpeg, .png, .webp", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(1010, "Dung lượng ảnh tối đa là 2MB", HttpStatus.BAD_REQUEST),
    ;

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}