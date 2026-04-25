package com.ecommerce.modules.ai.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class AiChatResponse {
    private String reply;
    private String intent;
    private List<AiProductSuggestionResponse> suggestedProducts;
    private AiActionResponse action;
}
