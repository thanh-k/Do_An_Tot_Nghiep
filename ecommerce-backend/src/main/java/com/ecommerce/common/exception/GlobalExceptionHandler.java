package com.ecommerce.common.exception;

import com.ecommerce.common.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice // Đánh dấu đây là lớp xử lý lỗi toàn cục và tự động parse JSON
public class GlobalExceptionHandler {

        // 1. Bắt lỗi AppException do mình tự định nghĩa (Ví dụ: Sản phẩm không tồn tại)
        @ExceptionHandler(AppException.class)
        public ResponseEntity<ApiResponse<Object>> handleAppException(AppException ex) {
                ErrorCode errorCode = ex.getErrorCode();
                return ResponseEntity.status(errorCode.getStatusCode().value())
                                .body(ApiResponse.builder()
                                                .code(errorCode.getCode())
                                                .message(errorCode.getMessage())
                                                .build());
        }

        // 2. Bắt lỗi Validation (Khi form gửi lên không hợp lệ)
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Object>> handleValidationException(MethodArgumentNotValidException ex) {
                String message = ex.getBindingResult().getFieldError() != null
                                ? ex.getBindingResult().getFieldError().getDefaultMessage()
                                : "Dữ liệu không hợp lệ";
                return ResponseEntity.badRequest()
                                .body(ApiResponse.builder().code(HttpStatus.BAD_REQUEST.value()).message(message)
                                                .build());
        }

        // 3. Bắt lỗi phân quyền Spring Security (Chưa đăng nhập, không có quyền)
        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(ApiResponse.builder().code(HttpStatus.FORBIDDEN.value())
                                                .message("Bạn không có quyền truy cập chức năng này").build());
        }

        // 4. Bắt các lỗi hệ thống chưa xác định (Lỗi 500) để không làm trắng trang
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Object>> handleGeneric(Exception ex) {
                // In lỗi ra console để dev còn biết đường mà fix
                ex.printStackTrace();

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(ApiResponse.builder().code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                                                .message(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage()).build());
        }
}
