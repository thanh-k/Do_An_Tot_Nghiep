package com.ecommerce.modules.ai.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiChatRequest {
    private String message;
    private ConversationContext context;

    @Getter
    @Setter
    public static class ConversationContext {
        private Long lastProductId;
        private String lastProductName;
        private String lastColor;
        private Integer lastQuantity;
        private String lastIntent;
    }
}
