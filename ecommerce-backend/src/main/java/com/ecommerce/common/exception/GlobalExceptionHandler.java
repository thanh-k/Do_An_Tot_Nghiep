package com.ecommerce.common.exception;

import com.ecommerce.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice // Đánh dấu đây là lớp xử lý lỗi toàn cục
public class GlobalExceptionHandler {

    // 1. Bắt lỗi AppException do mình tự định nghĩa (Lỗi trùng tên, không tìm
    // thấy...)
    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();

        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity
                .status(errorCode.getStatusCode()) // Trả về 400, 404, 409 tùy mình định nghĩa ở ErrorCode
                .body(apiResponse);
    }

    // 2. Bắt các lỗi hệ thống chưa xác định (Lỗi 500) để không làm trắng trang
    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse> handlingRuntimeException(Exception exception) {
        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
        apiResponse.setMessage(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());

        // In lỗi ra console để ní còn biết đường mà fix
        exception.printStackTrace();

        return ResponseEntity.badRequest().body(apiResponse);
    }
}