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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiServiceImpl implements GeminiService {

    private static final List<String> FALLBACK_MODELS = List.of(
            "gemini-2.0-flash",
            "gemini-1.5-flash"
    );

    private static final String AUTH_ERROR_REPLY = "AI hiện chưa thể hoạt động do lỗi xác thực API.";
    private static final String RATE_LIMIT_REPLY = "AI đang nhận quá nhiều yêu cầu. Bạn vui lòng thử lại sau ít phút.";
    private static final String TEMPORARY_ERROR_REPLY = "AI đang bận hoặc tạm thời không phản hồi. Bạn vui lòng thử lại sau.";

    /*
     * Tránh trường hợp deploy bị Gemini trả 403/429 liên tục:
     * - 403/401: key/quyền/model chưa đúng, tạm ngưng gọi Gemini 10 phút.
     * - 429: quá quota/rate limit, tạm ngưng gọi Gemini 3 phút.
     * Trong thời gian cooldown, service trả thông báo fallback để AiChatServiceImpl
     * tự dựng câu trả lời từ dữ liệu sản phẩm nội bộ thay vì tiếp tục spam API Gemini.
     */
    private static volatile long geminiCooldownUntilMs = 0L;
    private static volatile String geminiCooldownReason = "";

    private final GeminiProperties geminiProperties;
    private final WebClient geminiWebClient;

    @Override
    public String generateCustomerSupportReply(String systemPrompt, String userMessage, String productContext) {
        if (geminiProperties.getKey() == null || geminiProperties.getKey().isBlank()) {
            log.warn("Gemini API key is blank. Fallback to internal product reply.");
            return AUTH_ERROR_REPLY;
        }

        String cooldownReply = getCooldownReplyIfNeeded();
        if (cooldownReply != null) {
            return cooldownReply;
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
            cooldownReply = getCooldownReplyIfNeeded();
            if (cooldownReply != null) {
                return cooldownReply;
            }

            String reply = callWithRetry(model, body);
            if (!isRetryableFailureMessage(reply)) {
                return reply;
            }
        }

        return TEMPORARY_ERROR_REPLY;
    }

    private List<String> buildModelOrder() {
        String configured = geminiProperties.getModel();

        List<String> ordered = new ArrayList<>();
        if (configured != null && !configured.isBlank()) {
            ordered.add(configured.trim());
        }

        for (String model : FALLBACK_MODELS) {
            if (!ordered.contains(model)) {
                ordered.add(model);
            }
        }

        return ordered;
    }

    private String callWithRetry(String model, Map<String, Object> body) {
        int maxRetries = 2;
        long delayMs = 1200;

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
                        .timeout(Duration.ofSeconds(25))
                        .block();

                JsonNode textNode = response == null
                        ? null
                        : response.path("candidates").path(0).path("content").path("parts").path(0).path("text");

                if (textNode == null || textNode.isMissingNode() || textNode.isNull()) {
                    log.warn("Gemini response missing text for model {}: {}", model, response);
                    return TEMPORARY_ERROR_REPLY;
                }

                clearGeminiCooldown();
                return textNode.asText();

            } catch (WebClientResponseException e) {
                int status = e.getStatusCode().value();
                String responseBody = e.getResponseBodyAsString();
                log.warn("Gemini error - model={} - attempt={} - status={} - body={}", model, attempt, status, responseBody);

                if (status == 401 || status == 403) {
                    startGeminiCooldown(10 * 60 * 1000L, "AUTH_" + status);
                    return AUTH_ERROR_REPLY;
                }

                if (status == 429) {
                    startGeminiCooldown(3 * 60 * 1000L, "RATE_LIMIT_429");
                    return RATE_LIMIT_REPLY;
                }

                if ((status == 503 || status == 500 || status == 502 || status == 504) && attempt < maxRetries) {
                    sleep(delayMs);
                    delayMs *= 2;
                    continue;
                }

                if (status == 404 || status == 400) {
                    return "AI model hiện tại không khả dụng hoặc request chưa hợp lệ.";
                }

                return TEMPORARY_ERROR_REPLY;
            } catch (Exception e) {
                log.warn("Gemini unknown error - model={} - attempt={} - message={}", model, attempt, e.getMessage());
                if (attempt < maxRetries) {
                    sleep(delayMs);
                    delayMs *= 2;
                    continue;
                }
                return TEMPORARY_ERROR_REPLY;
            }
        }

        return TEMPORARY_ERROR_REPLY;
    }

    private boolean isRetryableFailureMessage(String reply) {
        if (reply == null || reply.isBlank()) return true;
        return reply.contains("AI model hiện tại không khả dụng")
                || reply.contains("AI đang bận")
                || reply.contains("chưa thể hoạt động")
                || reply.contains("quá nhiều yêu cầu");
    }

    private String getCooldownReplyIfNeeded() {
        long now = System.currentTimeMillis();
        if (geminiCooldownUntilMs <= now) {
            return null;
        }

        log.warn("Gemini call skipped because cooldown is active. reason={}, remainingMs={}",
                geminiCooldownReason,
                geminiCooldownUntilMs - now);

        if (geminiCooldownReason != null && geminiCooldownReason.startsWith("AUTH")) {
            return AUTH_ERROR_REPLY;
        }

        if (geminiCooldownReason != null && geminiCooldownReason.startsWith("RATE_LIMIT")) {
            return RATE_LIMIT_REPLY;
        }

        return TEMPORARY_ERROR_REPLY;
    }

    private void startGeminiCooldown(long durationMs, String reason) {
        geminiCooldownUntilMs = System.currentTimeMillis() + durationMs;
        geminiCooldownReason = reason;
    }

    private void clearGeminiCooldown() {
        geminiCooldownUntilMs = 0L;
        geminiCooldownReason = "";
    }

    private void sleep(long delayMs) {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
