package com.ecommerce.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.URL;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class VisionServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(VisionServiceClient.class);

    @Value("${vision.service.url}")
    private String visionServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Gọi khi thêm/sửa sản phẩm
    // findimg nhận file, không nhận image_url
    public void indexProduct(Long productId, String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) return;

        try {
            // Tải ảnh từ URL về bytes
            byte[] imageBytes;
            try (InputStream in = new URL(imageUrl).openStream()) {
                imageBytes = in.readAllBytes();
            }

            String filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            if (!filename.contains(".")) filename = filename + ".jpg";
            final String finalFilename = filename;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("product_id", productId.toString());
            body.add("category_id", "1"); // default category
            body.add("file", new ByteArrayResource(imageBytes) {
                @Override public String getFilename() { return finalFilename; }
            });

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(
                visionServiceUrl + "/api/products/add", request, String.class);
            logger.info("✅ [Vision] Indexed product {}", productId);
        } catch (Exception e) {
            logger.error("❌ [Vision] Index error product {}: {}", productId, e.getMessage());
        }
    }

    // Gọi khi user search bằng ảnh
    public List<Long> searchByImage(MultipartFile file, int k) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override public String getFilename() {
                    return file.getOriginalFilename() != null
                        ? file.getOriginalFilename() : "image.jpg";
                }
            });

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                visionServiceUrl + "/api/products/search-by-image?limit=" + k,
                request, Map.class);

            if (response.getBody() != null) {
                // findimg trả "results" array, mỗi phần tử có "product_id" string
                List<Map<String, Object>> results =
                    (List<Map<String, Object>>) response.getBody().get("results");
                if (results != null) {
                    return results.stream()
                        .map(r -> Long.parseLong(r.get("product_id").toString()))
                        .collect(Collectors.toList());
                }
            }
            return List.of();
        } catch (Exception e) {
            logger.error("❌ [Vision Search] Error: {}", e.getMessage());
            return List.of();
        }
    }

    // Xóa sản phẩm khỏi index (findimg chưa có endpoint này → bỏ qua)
    public void removeProduct(Long productId) {
        logger.info("🗑️ [Vision] Remove product {} (skipped - not supported)", productId);
    }
}