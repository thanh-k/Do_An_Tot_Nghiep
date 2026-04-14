package com.ecommerce.modules.phoneprefix.dto.request;

import lombok.Data;

@Data
public class PhonePrefixRequest {
    private String prefix;
    private String providerName;
    private Boolean active;
}
