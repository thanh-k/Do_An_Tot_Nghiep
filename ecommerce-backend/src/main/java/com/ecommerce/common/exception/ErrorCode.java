package com.ecommerce.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống chưa xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Mã lỗi không hợp lệ", HttpStatus.BAD_REQUEST),

    CATEGORY_EXITED(1002, "Tên danh mục này đã tồn tại!", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_FOUND(1003, "Không tìm thấy danh mục!", HttpStatus.NOT_FOUND),

    USER_NOT_FOUND(1101, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    LOGIN_FAILED(1102, "Tài khoản hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    EMAIL_INVALID(1103, "Email không hợp lệ", HttpStatus.BAD_REQUEST),
    PHONE_INVALID(1104, "Số điện thoại phải gồm đúng 10 chữ số", HttpStatus.BAD_REQUEST),
    PHONE_ALREADY_EXISTS(1105, "Số điện thoại đã tồn tại", HttpStatus.BAD_REQUEST),
    EMAIL_ALREADY_EXISTS(1106, "Email đã tồn tại", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1107, "Mật khẩu phải có ít nhất 6 ký tự", HttpStatus.BAD_REQUEST),
    FULL_NAME_INVALID(1108, "Họ và tên chỉ được chứa chữ cái và khoảng trắng, tối thiểu 2 ký tự", HttpStatus.BAD_REQUEST),
    ROLE_INVALID(1109, "Vai trò không hợp lệ", HttpStatus.BAD_REQUEST),
    USER_DISABLED(1110, "Tài khoản đã bị khóa", HttpStatus.FORBIDDEN),
    CURRENT_PASSWORD_INCORRECT(1111, "Mật khẩu hiện tại không chính xác", HttpStatus.BAD_REQUEST),
    ADMIN_CANNOT_DELETE(1112, "Không thể xóa tài khoản quản trị viên", HttpStatus.BAD_REQUEST),
    AVATAR_REQUIRED(1113, "Vui lòng chọn ảnh đại diện", HttpStatus.BAD_REQUEST),
    PHONE_REQUIRED(1114, "Số điện thoại là bắt buộc", HttpStatus.BAD_REQUEST),

    PHONE_PREFIX_NOT_FOUND(1201, "Không tìm thấy đầu số", HttpStatus.NOT_FOUND),
    PHONE_PREFIX_ALREADY_EXISTS(1202, "Đầu số đã tồn tại", HttpStatus.BAD_REQUEST),
    PHONE_PREFIX_INVALID(1203, "Đầu số phải gồm đúng 3 chữ số", HttpStatus.BAD_REQUEST),
    PHONE_PROVIDER_INVALID(1204, "Tên nhà mạng không hợp lệ", HttpStatus.BAD_REQUEST),
    PHONE_PREFIX_NOT_ALLOWED(1205, "Đầu số điện thoại chưa được cho phép", HttpStatus.BAD_REQUEST),

    BRAND_EXISTED(1008, "Thương hiệu đã tồn tại", HttpStatus.BAD_REQUEST),
    BRAND_NOT_FOUND(1009, "Không tìm thấy thương hiệu", HttpStatus.NOT_FOUND),
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
