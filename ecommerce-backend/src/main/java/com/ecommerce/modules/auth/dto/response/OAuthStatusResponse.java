package com.ecommerce.modules.auth.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OAuthStatusResponse {
    private String redirectUrl;
}
