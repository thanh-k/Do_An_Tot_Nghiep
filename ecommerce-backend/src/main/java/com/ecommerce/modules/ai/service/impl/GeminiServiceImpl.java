package com.ecommerce.modules.ai.service.impl;

import com.ecommerce.modules.ai.config.GeminiProperties;
import com.ecommerce.modules.ai.service.GeminiService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiServiceImpl implements GeminiService {

    private static final List<String> FALLBACK_MODELS = List.of(
            "gemini-2.5-flash",
            "gemini-2.0-flash"
    );

    private final GeminiProperties geminiProperties;
    private final WebClient geminiWebClient;

    @Override
    public String generateCustomerSupportReply(String systemPrompt, String userMessage, String productContext) {
        if (geminiProperties.getKey() == null || geminiProperties.getKey().isBlank()) {
            return "Hệ thống AI chưa có API key Gemini.";
        }

        String finalPrompt = """
                %s

                DỮ LIỆU ỨNG VIÊN:
                %s

                CÂU HỎI KHÁCH HÀNG:
                %s
                """.formatted(systemPrompt, productContext, userMessage);

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", finalPrompt)
                        ))
                )
        );

        for (String model : buildModelOrder()) {
            String reply = callWithRetry(model, body);
            if (!isRetryableFailureMessage(reply)) {
                return reply;
            }
        }

        return "AI đang bận hoặc tạm thời không phản hồi. Bạn vui lòng thử lại sau.";
    }

    private List<String> buildModelOrder() {
        String configured = geminiProperties.getModel();
        if (configured == null || configured.isBlank()) {
            return FALLBACK_MODELS;
        }
        List<String> ordered = new java.util.ArrayList<>();
        ordered.add(configured.trim());
        for (String model : FALLBACK_MODELS) {
            if (!ordered.contains(model)) {
                ordered.add(model);
            }
        }
        return ordered;
    }

    private String callWithRetry(String model, Map<String, Object> body) {
        int maxRetries = 3;
        long delayMs = 2000;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                JsonNode response = geminiWebClient.post()
                        .uri(uriBuilder -> uriBuilder
                                .path("/models/{model}:generateContent")
                                .build(model))
                        .header("x-goog-api-key", geminiProperties.getKey())
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(JsonNode.class)
                        .timeout(Duration.ofSeconds(30))
                        .block();

                JsonNode textNode = response.path("candidates").path(0).path("content").path("parts").path(0).path("text");
                if (textNode.isMissingNode() || textNode.isNull()) {
                    log.warn("Gemini response missing text for model {}: {}", model, response);
                    return "Tôi chưa thể trả lời lúc này. Bạn vui lòng thử lại sau.";
                }
                return textNode.asText();

            } catch (WebClientResponseException e) {
                int status = e.getStatusCode().value();
                String responseBody = e.getResponseBodyAsString();
                log.warn("Gemini error - model={} - attempt={} - status={} - body={}", model, attempt, status, responseBody);

                if (status == 503 && attempt < maxRetries) {
                    sleep(delayMs);
                    delayMs *= 2;
                    continue;
                }

                if (status == 404 || status == 400) {
                    return "AI model hiện tại không khả dụng hoặc request chưa hợp lệ.";
                }

                if (status == 401 || status == 403) {
                    return "AI hiện chưa thể hoạt động do lỗi xác thực API.";
                }

                if (status == 429) {
                    return "AI đang nhận quá nhiều yêu cầu. Bạn vui lòng thử lại sau ít phút.";
                }

                return "AI đang bận hoặc tạm thời không phản hồi. Bạn vui lòng thử lại sau.";
            } catch (Exception e) {
                log.warn("Gemini unknown error - model={} - attempt={} - message={}", model, attempt, e.getMessage());
                if (attempt < maxRetries) {
                    sleep(delayMs);
                    delayMs *= 2;
                    continue;
                }
                return "AI đang bận hoặc tạm thời không phản hồi. Bạn vui lòng thử lại sau.";
            }
        }

        return "AI đang bận hoặc tạm thời không phản hồi. Bạn vui lòng thử lại sau.";
    }

    private boolean isRetryableFailureMessage(String reply) {
        if (reply == null || reply.isBlank()) return true;
        return reply.contains("AI model hiện tại không khả dụng")
                || reply.contains("AI đang bận")
                || reply.contains("chưa thể hoạt động")
                || reply.contains("quá nhiều yêu cầu");
    }

    private void sleep(long delayMs) {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
