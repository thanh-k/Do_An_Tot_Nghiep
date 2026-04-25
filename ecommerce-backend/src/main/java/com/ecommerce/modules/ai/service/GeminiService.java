package com.ecommerce.modules.ai.service;

public interface GeminiService {
    String generateCustomerSupportReply(String systemPrompt, String userMessage, String productContext);
}
