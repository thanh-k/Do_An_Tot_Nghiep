package com.ecommerce.modules.productCompare.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddCompareRequest {
    @NotNull(message = "ID sản phẩm không được để trống")
    private Long productId;
}