package com.ecommerce.modules.brand.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String logo;
    private Boolean active;
    private LocalDateTime createdAt;
}