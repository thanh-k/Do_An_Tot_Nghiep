package com.ecommerce.modules.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.gemini.api")
public class GeminiProperties {
    private String key;
    private String model;
}