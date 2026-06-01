package com.ecommerce.modules.compare_ai.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class AiCompareRequest {
    // Danh sách ID của các sản phẩm cần so sánh
    // Truyền từ frontend dạng: { "productIds": [12, 15] }
    private List<Long> productIds;
}