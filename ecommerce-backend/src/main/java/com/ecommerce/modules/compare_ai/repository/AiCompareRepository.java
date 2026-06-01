package com.ecommerce.modules.compare_ai.repository;

import com.ecommerce.modules.ai.config.GeminiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Repository
@RequiredArgsConstructor
public class AiCompareRepository {

    private final GeminiProperties geminiProperties;
    private final WebClient geminiWebClient;

    private static final List<String> FALLBACK_MODELS = List.of(
            "gemini-1.5-pro", // Ưu tiên gọi bản Pro của bạn trước
            "gemini-pro", // Dự phòng bản Pro cũ hơn
            "gemini-1.5-flash",
            "gemini-2.0-flash");

    public String callGeminiApi(String prompt) {
        // HARDCODE API KEY Ở ĐÂY
        String myApiKey = "";

        if (myApiKey == null || myApiKey.isBlank() || myApiKey.equals("DÁN_API_KEY_CỦA_BẠN_VÀO_ĐÂY")) {
            return "⚠️ **Lỗi:** Bạn chưa dán API Key mới vào file code `AiCompareRepository.java`.";
        }

        // Thay vì lấy model từ cấu hình, ta dùng luôn danh sách ưu tiên bản Pro ở trên
        List<String> modelsToTry = FALLBACK_MODELS;

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)))));

        StringBuilder errorLog = new StringBuilder();

        for (String model : modelsToTry) {
            try {
                String reply = callWithRetry(model, body, errorLog, myApiKey);
                if (reply != null) {
                    return reply;
                }
            } catch (Exception e) {
                log.error("Lỗi nội bộ khi gọi model {}: {}", model, e.getMessage());
            }
        }

        log.error("Tất cả các model Gemini đều gọi thất bại. Lịch sử lỗi: {}", errorLog);
        return "⚠️ **Không thể phân tích lúc này.**\n\nQuá trình kết nối với AI gặp lỗi. Chi tiết:\n\n"
                + errorLog.toString();
    }

    private String callWithRetry(String model, Map<String, Object> body, StringBuilder errorLog, String apiKey) {
        int maxRetries = 2;
        long delayMs = 1500;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                JsonNode response = geminiWebClient.post()
                        .uri(uriBuilder -> uriBuilder
                                .path("/models/{model}:generateContent")
                                .queryParam("key", apiKey) // Dùng key trực tiếp của bạn
                                .build(model))
                        .header("x-goog-api-key", apiKey) // Dùng key trực tiếp của bạn
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(JsonNode.class)
                        .timeout(Duration.ofSeconds(30))
                        .block();

                if (response != null) {
                    JsonNode textNode = response.path("candidates").path(0).path("content").path("parts").path(0)
                            .path("text");
                    if (!textNode.isMissingNode() && !textNode.isNull()) {
                        return textNode.asText();
                    } else {
                        log.warn("Gemini trả về rỗng hoặc bị chặn an toàn. Response: {}", response);
                        errorLog.append(String.format(
                                "- Model `%s` (Lần %d): Bị chặn bởi bộ lọc an toàn hoặc không có nội dung.\n", model,
                                attempt));
                        return null; // Bị chặn an toàn, thử model khác
                    }
                }

            } catch (WebClientResponseException e) {
                int status = e.getStatusCode().value();
                String resBody = e.getResponseBodyAsString();
                log.warn("Lỗi API Gemini - model={} - attempt={} - status={} - body={}", model, attempt, status,
                        resBody);
                errorLog.append(String.format("- Model `%s` (Lần %d): Lỗi HTTP %d.\n", model, attempt, status));

                if (status == 503 || status == 429) {
                    if (attempt < maxRetries) {
                        sleep(delayMs);
                        delayMs *= 2;
                        continue;
                    }
                }
                return null; // Bỏ qua model hiện tại nếu lỗi xác thực/cú pháp (4xx)

            } catch (Exception e) {
                log.warn("Lỗi không mong muốn Gemini - model={} - error={}", model, e.getMessage());
                errorLog.append(
                        String.format("- Model `%s` (Lần %d): Lỗi Exception - %s.\n", model, attempt, e.getMessage()));
                if (attempt < maxRetries) {
                    sleep(delayMs);
                    delayMs *= 2;
                    continue;
                }
                return null;
            }
        }
        return null;
    }

    private void sleep(long delayMs) {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}