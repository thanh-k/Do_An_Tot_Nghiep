package com.ecommerce.modules.ai.controller;

import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.ai.dto.request.AiChatRequest;
import com.ecommerce.modules.ai.dto.response.AiChatResponse;
import com.ecommerce.modules.ai.service.AiChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public ApiResponse<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        String finalMessage = enrichMessageWithContext(request);
        return ApiResponse.<AiChatResponse>builder()
                .result(aiChatService.chat(finalMessage))
                .build();
    }

    private String enrichMessageWithContext(AiChatRequest request) {
        String message = request.getMessage() == null ? "" : request.getMessage().trim();
        AiChatRequest.ConversationContext context = request.getContext();

        if (context == null || context.getLastProductName() == null || context.getLastProductName().isBlank()) {
            return message;
        }

        String normalizedMessage = normalizeText(message);
        String normalizedProductName = normalizeText(context.getLastProductName());

        if (normalizedMessage.contains(normalizedProductName)) {
            return message;
        }

        boolean hasReferenceWords =
                containsAny(normalizedMessage,
                        "do", "no", "con do", "san pham do", "mau do", "ban do",
                        "vay", "lay", "chon", "them vao gio", "them gio", "mua",
                        "so luong", "cai");

        boolean hasColorWords =
                containsAny(normalizedMessage,
                        "den", "trang", "xam", "bac", "vang", "hong", "xanh", "do", "tim", "than", "titan");

        boolean hasQuantityWords =
                normalizedMessage.matches(".*\\b\\d+\\b.*")
                        || containsAny(normalizedMessage, "mot cai", "một cái", "hai cai", "ba cai", "bon cai", "nam cai");

        if (!(hasReferenceWords || hasColorWords || hasQuantityWords)) {
            return message;
        }

        String enriched = context.getLastProductName() + " " + message;

        if (context.getLastColor() != null
                && !context.getLastColor().isBlank()
                && !containsAny(normalizedMessage, "den", "trang", "xam", "bac", "vang", "hong", "xanh", "do", "tim", "than", "titan")) {
            if (containsAny(normalizedMessage, "them vao gio", "them gio", "mua", "so luong", "cai", "do", "no", "lay")) {
                enriched = context.getLastProductName() + " màu " + context.getLastColor() + " " + message;
            }
        }

        return enriched.trim();
    }

    private boolean containsAny(String text, String... keywords) {
        if (text == null) return false;
        for (String keyword : keywords) {
            if (text.contains(keyword)) return true;
        }
        return false;
    }

    private String normalizeText(String text) {
        if (text == null) return "";

        String normalized = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD);

        return normalized
                .replaceAll("\\p{M}", "")
                .replace("đ", "d")
                .replace("Đ", "D")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
