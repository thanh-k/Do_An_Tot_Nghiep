package com.ecommerce.modules.productCompare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCompareResponse {
    private Long id;
    private Long productId;
    private LocalDateTime createdAt;
}