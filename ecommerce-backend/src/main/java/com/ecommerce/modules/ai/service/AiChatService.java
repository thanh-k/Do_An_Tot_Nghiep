package com.ecommerce.modules.ai.service;

import com.ecommerce.modules.ai.dto.response.AiChatResponse;

public interface AiChatService {
    AiChatResponse chat(String message);
}