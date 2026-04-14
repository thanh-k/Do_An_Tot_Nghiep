package com.ecommerce.modules.brand.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandRequest {

    @NotBlank(message = "Tên thương hiệu không được để trống")
    @Size(min = 2, max = 50, message = "Tên thương hiệu phải từ 2 đến 50 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    private String description;

    // Logo có thể null vì mình xử lý file rời, nhưng nếu có chuỗi thì không được
    // quá dài
    private String logo;
}