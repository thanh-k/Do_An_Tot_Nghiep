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
    @Size(min = 2, message = "Tên thương hiệu phải có ít nhất 2 ký tự")
    private String name;

    private String description;

    private String logo; // Link ảnh logo thương hiệu
}