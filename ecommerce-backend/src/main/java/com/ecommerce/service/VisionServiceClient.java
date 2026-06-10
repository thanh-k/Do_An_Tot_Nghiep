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

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class VisionServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(VisionServiceClient.class);

    @Value("${vision.service.url:http://localhost:8001}")
    private String visionServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public void indexProduct(Long productId, String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty())
            return;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("product_id", productId.toString());
            map.add("image_url", imageUrl);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

            restTemplate.postForEntity(visionServiceUrl + "/index", request, String.class);
            logger.info("✅ [Vision Service] Đã đồng bộ vector cho sản phẩm ID: {}", productId);
        } catch (Exception e) {
            logger.error("❌ [Vision Service] Lỗi đồng bộ sản phẩm ID {}: {}", productId, e.getMessage());
        }
    }

    public List<Long> searchByImage(MultipartFile file, int k) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null
                            ? file.getOriginalFilename()
                            : "image.jpg";
                }
            });
            body.add("k", String.valueOf(k));

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    visionServiceUrl + "/search", request, Map.class);

            if (response.getBody() != null) {
                List<Integer> ids = (List<Integer>) response.getBody().get("product_ids");
                if (ids != null) {
                    return ids.stream().map(Long::valueOf).collect(Collectors.toList());
                }
            }
            return List.of();
        } catch (Exception e) {
            logger.error("❌ [Vision Search] Lỗi: {}", e.getMessage());
            return List.of();
        }
    }

    public void removeProduct(Long productId) {
        try {
            restTemplate.delete(visionServiceUrl + "/index/" + productId);
            logger.info("🗑️ [Vision Service] Đã xóa vector của sản phẩm ID: {}", productId);
        } catch (Exception e) {
            logger.error("❌ [Vision Service] Lỗi xóa vector sản phẩm ID {}: {}", productId, e.getMessage());
        }
    }
}