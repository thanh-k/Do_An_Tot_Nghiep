package com.ecommerce.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL) // Chỉ hiện các trường không bị null
public class ApiResponse<T> {
    @Builder.Default
    int code = 1000; // 1000 là mã thành công mặc định

    String message;
    T result; // Đây là nơi chứa dữ liệu thực tế (ví dụ: CategoryResponse)
}