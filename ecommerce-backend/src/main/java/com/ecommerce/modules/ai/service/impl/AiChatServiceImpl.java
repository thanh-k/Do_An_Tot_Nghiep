package com.ecommerce.modules.ai.service.impl;

import com.ecommerce.modules.ai.dto.response.AiActionResponse;
import com.ecommerce.modules.ai.dto.response.AiChatResponse;
import com.ecommerce.modules.ai.dto.response.AiProductSuggestionResponse;
import com.ecommerce.modules.ai.service.AiChatService;
import com.ecommerce.modules.ai.service.GeminiService;
import com.ecommerce.modules.product.dto.response.ProductResponse;
import com.ecommerce.modules.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private static final String SYSTEM_PROMPT = """
        Bạn là AI chăm sóc khách hàng của NovaShop.
        Vai trò của bạn:
        - Gợi ý sản phẩm đúng nhu cầu khách hàng
        - Mô tả chi tiết sản phẩm dựa trên dữ liệu thật
        - Hỗ trợ xác định sản phẩm để thêm vào giỏ hàng
        - Luôn trả lời bằng tiếng Việt
        - Không bịa thông tin ngoài dữ liệu hệ thống cung cấp

        QUY TẮC ĐỊNH DẠNG:
        - Không dùng markdown.
        - Không dùng dấu ** hoặc *.
        - Không dùng heading markdown.
        - Trả lời theo từng dòng ngắn, rõ ràng.
        - Nếu liệt kê thông tin sản phẩm thì mỗi ý xuống một dòng riêng.
        - Văn phong thân thiện, dễ đọc, phù hợp giao diện chat.
        """;

    private final ProductService productService;
    private final GeminiService geminiService;

    @Override
    public AiChatResponse chat(String message) {
        String rawMessage = message == null ? "" : message.trim();
        String normalizedMessage = normalizeText(rawMessage);
        String intent = detectIntent(normalizedMessage);
        String color = extractColor(normalizedMessage);
        int quantity = extractQuantity(normalizedMessage);

        List<ProductResponse> allProducts = productService.getAllProducts();
        List<ProductResponse> candidateProducts = findCandidateProducts(normalizedMessage, intent, color, allProducts);
        List<AiProductSuggestionResponse> suggestions = mapSuggestions(candidateProducts);
        String productContext = buildProductContext(candidateProducts, color, quantity, intent);

        String reply = geminiService.generateCustomerSupportReply(SYSTEM_PROMPT, rawMessage, productContext);
        if (isAiUnavailableReply(reply)) {
            reply = buildFallbackReply(intent, candidateProducts, color, quantity, normalizedMessage);
        }

        AiActionResponse action = buildAction(intent, candidateProducts, color, quantity);

        return AiChatResponse.builder()
                .reply(reply)
                .intent(intent)
                .suggestedProducts(suggestions)
                .action(action)
                .build();
    }

    private boolean isAiUnavailableReply(String reply) {
        if (reply == null || reply.isBlank()) return true;
        String normalized = normalizeText(reply);
        return normalized.contains("ai dang ban")
                || normalized.contains("chua the")
                || normalized.contains("tam thoi khong phan hoi")
                || normalized.contains("loi xac thuc api")
                || normalized.contains("qua nhieu yeu cau");
    }

    private String detectIntent(String message) {
        if (containsAny(message, "them vao gio", "them gio hang", "mua ngay", "cho vao gio", "dat mua")) {
            return "ADD_TO_CART";
        }

        if (containsAny(message, "chi tiet", "mo ta", "thong tin", "gia bao nhieu", "co gi", "cau hinh")) {
            return "PRODUCT_DETAIL";
        }

        if (containsAny(message, "goi y", "tu van", "nen mua", "chon giup", "tim giup", "co nhung gi", "co cac")) {
            return "PRODUCT_SUGGESTION";
        }

        return "GENERAL";
    }

    private List<ProductResponse> findCandidateProducts(String message, String intent, String color, List<ProductResponse> products) {
        if (products == null || products.isEmpty()) {
            return List.of();
        }

        if ("PRODUCT_DETAIL".equals(intent) || "ADD_TO_CART".equals(intent)) {
            return products.stream()
                    .sorted((a, b) -> Integer.compare(scoreProductForExactMatch(b, message, color), scoreProductForExactMatch(a, message, color)))
                    .filter(p -> scoreProductForExactMatch(p, message, color) > 0)
                    .limit(4)
                    .toList();
        }

        if ("PRODUCT_SUGGESTION".equals(intent) || "GENERAL".equals(intent)) {
            return products.stream()
                    .sorted((a, b) -> Integer.compare(scoreProductForNeed(b, message, color), scoreProductForNeed(a, message, color)))
                    .filter(p -> scoreProductForNeed(p, message, color) > 0)
                    .limit(4)
                    .toList();
        }

        return products.stream().limit(4).toList();
    }

    private int scoreProductForExactMatch(ProductResponse product, String message, String color) {
        String all = getFullProductText(product);
        int score = 0;

        String name = normalizeText(product.getName());
        String slug = normalizeText(product.getSlug());

        if (!name.isBlank() && message.contains(name)) score += 250;
        if (!slug.isBlank() && message.contains(slug)) score += 220;

        if (message.contains("iphone 15 pro") && name.contains("iphone 15 pro")) score += 400;
        if (message.contains("iphone 15 plus") && name.contains("iphone 15 plus")) score += 380;
        if (message.contains("iphone 15") && name.contains("iphone 15")) score += 150;
        if (message.contains("s24 ultra") && name.contains("s24 ultra")) score += 300;

        if (color != null && variantMatchesColor(product, color)) score += 120;

        for (String token : splitWords(message)) {
            if (token.length() < 2) continue;
            if (all.contains(token)) score += 6;
        }

        return score;
    }

    private int scoreProductForNeed(ProductResponse product, String message, String color) {
        String all = getFullProductText(product);
        int score = 0;

        if (containsAny(message, "dien thoai", "iphone", "samsung", "android")) {
            if (isPhoneProduct(product)) score += 40;
            else score -= 40;
        }

        if (containsAny(message, "laptop", "macbook", "dell", "hp", "lenovo", "asus")) {
            if (isLaptopProduct(product)) score += 40;
            else score -= 40;
        }

        if (containsAny(message, "tai nghe", "headphone", "earbuds", "airpods")) {
            if (isHeadphoneProduct(product)) score += 40;
            else score -= 40;
        }

        if (containsAny(message, "chup hinh", "camera", "selfie")) {
            score += scoreForCameraNeed(product);
        }

        if (containsAny(message, "choi game", "gaming", "hieu nang")) {
            score += scoreForGamingNeed(product);
        }

        if (containsAny(message, "pin trau", "pin khoe", "dung lau")) {
            score += scoreForBatteryNeed(product);
        }

        if (color != null && variantMatchesColor(product, color)) {
            score += 50;
        }

        for (String token : splitWords(message)) {
            if (token.length() < 2) continue;
            if (all.contains(token)) score += 4;
        }

        return score;
    }

    private int scoreForCameraNeed(ProductResponse product) {
        String all = getFullProductText(product);
        int score = 0;

        if (isPhoneProduct(product)) score += 25;
        if (all.contains("camera")) score += 20;
        if (all.contains("selfie")) score += 10;
        if (all.contains("portrait")) score += 8;
        if (all.contains("zoom")) score += 8;
        if (all.contains("48mp")) score += 8;
        if (all.contains("64mp")) score += 10;
        if (all.contains("108mp")) score += 12;
        if (all.contains("200mp")) score += 16;
        if (all.contains("iphone")) score += 10;
        if (all.contains("ultra")) score += 12;
        if (all.contains("pro")) score += 8;

        return score;
    }

    private int scoreForGamingNeed(ProductResponse product) {
        String all = getFullProductText(product);
        int score = 0;

        if (all.contains("gaming")) score += 20;
        if (all.contains("snapdragon")) score += 10;
        if (all.contains("a17")) score += 10;
        if (all.contains("12gb")) score += 8;
        if (all.contains("16gb")) score += 10;
        if (all.contains("120hz")) score += 8;
        if (all.contains("144hz")) score += 10;
        if (all.contains("rtx")) score += 15;
        if (all.contains("i7")) score += 10;
        if (all.contains("i9")) score += 12;

        return score;
    }

    private int scoreForBatteryNeed(ProductResponse product) {
        String all = getFullProductText(product);
        int score = 0;

        if (all.contains("5000mah")) score += 15;
        if (all.contains("6000mah")) score += 18;
        if (all.contains("pin")) score += 8;
        if (all.contains("battery")) score += 8;
        if (all.contains("sac nhanh")) score += 6;

        return score;
    }

    private boolean isPhoneProduct(ProductResponse product) {
        String all = getFullProductText(product);
        return containsAny(all, "dien thoai", "iphone", "samsung", "android", "xiaomi", "oppo", "vivo", "realme");
    }

    private boolean isLaptopProduct(ProductResponse product) {
        String all = getFullProductText(product);
        return containsAny(all, "laptop", "macbook", "notebook", "ultrabook", "dell", "hp", "lenovo", "asus");
    }

    private boolean isHeadphoneProduct(ProductResponse product) {
        String all = getFullProductText(product);
        return containsAny(all, "tai nghe", "headphone", "earbuds", "airpods");
    }

    private boolean variantMatchesColor(ProductResponse product, String color) {
        if (color == null || product.getVariants() == null) return false;
        return product.getVariants().stream()
                .map(v -> normalizeText(v.getAttributes()))
                .anyMatch(attrs -> attrs.contains(color));
    }

    private String getFullProductText(ProductResponse product) {
        String category = product.getCategory() != null ? safe(product.getCategory().getName()) : "";
        String brand = product.getBrand() != null ? safe(product.getBrand().getName()) : "";
        String specs = safe(product.getSpecifications());
        String shortDesc = safe(product.getShortDescription());
        String desc = safe(product.getDescription());
        String name = safe(product.getName());
        String slug = safe(product.getSlug());
        String variantAttrs = product.getVariants() == null ? "" : product.getVariants().stream()
                .map(v -> safe(v.getAttributes()))
                .collect(Collectors.joining(" "));

        return normalizeText(String.join(" ", name, slug, category, brand, shortDesc, desc, specs, variantAttrs));
    }

    private List<AiProductSuggestionResponse> mapSuggestions(List<ProductResponse> products) {
        return products.stream()
                .map(product -> AiProductSuggestionResponse.builder()
                        .id(product.getId())
                        .name(product.getName())
                        .slug(product.getSlug())
                        .thumbnail(product.getThumbnail())
                        .price(extractPrice(product))
                        .compareAtPrice(extractCompareAtPrice(product))
                        .summary(buildSummary(product))
                        .build())
                .collect(Collectors.toList());
    }

    private Double extractPrice(ProductResponse product) {
        if (product.getVariants() == null || product.getVariants().isEmpty()) {
            return 0.0;
        }

        var variant = product.getVariants().get(0);
        return variant.getPrice() != null ? variant.getPrice() : 0.0;
    }

    private Double extractCompareAtPrice(ProductResponse product) {
        if (product.getVariants() == null || product.getVariants().isEmpty()) {
            return null;
        }

        var variant = product.getVariants().get(0);
        return variant.getCompareAtPrice();
    }

    private String buildSummary(ProductResponse product) {
        String shortDesc = safe(product.getShortDescription());
        if (!shortDesc.isBlank()) return shortDesc;

        String desc = safe(product.getDescription());
        if (desc.length() > 140) {
            return desc.substring(0, 140) + "...";
        }
        return desc;
    }

    private String buildProductContext(List<ProductResponse> products, String color, int quantity, String intent) {
        if (products == null || products.isEmpty()) {
            return "Không tìm thấy sản phẩm phù hợp trong hệ thống.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("INTENT: ").append(intent).append("\n");
        sb.append("MÀU KHÁCH YÊU CẦU: ").append(color == null ? "không có" : color).append("\n");
        sb.append("SỐ LƯỢNG KHÁCH YÊU CẦU: ").append(quantity).append("\n\n");

        for (int i = 0; i < products.size(); i++) {
            ProductResponse p = products.get(i);
            sb.append("SẢN PHẨM ").append(i + 1).append(":\n");
            sb.append("- ID: ").append(p.getId()).append("\n");
            sb.append("- Tên: ").append(safe(p.getName())).append("\n");
            sb.append("- Slug: ").append(safe(p.getSlug())).append("\n");

            if (p.getCategory() != null) {
                sb.append("- Danh mục: ").append(safe(p.getCategory().getName())).append("\n");
            }

            if (p.getBrand() != null) {
                sb.append("- Thương hiệu: ").append(safe(p.getBrand().getName())).append("\n");
            }

            sb.append("- Mô tả ngắn: ").append(safe(p.getShortDescription())).append("\n");
            sb.append("- Mô tả chi tiết: ").append(safe(p.getDescription())).append("\n");
            sb.append("- Thông số: ").append(safe(p.getSpecifications())).append("\n");
            sb.append("- Giá bán: ").append(extractPrice(p)).append("\n");
            sb.append("- Giá gốc: ").append(extractCompareAtPrice(p)).append("\n");

            if (p.getVariants() != null && !p.getVariants().isEmpty()) {
                sb.append("- Biến thể: ");
                String variantText = p.getVariants().stream()
                        .map(v -> safe(v.getAttributes()))
                        .collect(Collectors.joining(" | "));
                sb.append(variantText).append("\n");
            }

            sb.append("\n");
        }

        return sb.toString();
    }

    private AiActionResponse buildAction(String intent, List<ProductResponse> products, String color, int quantity) {
        if (products == null || products.isEmpty()) return null;

        ProductResponse top = products.get(0);

        if ("ADD_TO_CART".equals(intent)) {
            return AiActionResponse.builder()
                    .type("ADD_TO_CART")
                    .productId(top.getId())
                    .productSlug(top.getSlug())
                    .quantity(quantity)
                    .color(color)
                    .note("Frontend có thể dùng productId, productSlug, quantity và color để thêm sản phẩm vào giỏ hàng.")
                    .build();
        }

        if ("PRODUCT_DETAIL".equals(intent)) {
            return AiActionResponse.builder()
                    .type("VIEW_PRODUCT")
                    .productId(top.getId())
                    .productSlug(top.getSlug())
                    .quantity(quantity)
                    .color(color)
                    .note("Frontend có thể mở trang chi tiết sản phẩm.")
                    .build();
        }

        return null;
    }

    private String buildFallbackReply(String intent, List<ProductResponse> products, String color, int quantity, String normalizedMessage) {
        if (products == null || products.isEmpty()) {
            return "Tôi chưa tìm thấy sản phẩm phù hợp trong hệ thống. Bạn có thể mô tả rõ hơn nhu cầu của mình.";
        }

        ProductResponse top = products.get(0);
        String priceText = extractPrice(top) != null ? String.format("%,.0f đ", extractPrice(top)) : "chưa có giá";

        if ("PRODUCT_DETAIL".equals(intent)) {
            return "Tôi đã tìm thấy sản phẩm phù hợp là " + safe(top.getName())
                    + ". Giá hiện tại khoảng " + priceText
                    + ". Bạn có thể xem mô tả, giá bán và chi tiết ở danh sách bên dưới.";
        }

        if ("ADD_TO_CART".equals(intent)) {
            StringBuilder sb = new StringBuilder();
            sb.append("Tôi đã xác định được sản phẩm phù hợp để thêm vào giỏ hàng: ")
                    .append(safe(top.getName()));
            if (color != null) {
                sb.append(" (màu ").append(color).append(")");
            }
            sb.append(", số lượng ").append(quantity).append(".");
            return sb.toString();
        }

        if (containsAny(normalizedMessage, "iphone", "dien thoai", "samsung", "android")) {
            return "Tôi đã tìm được một số điện thoại phù hợp với nhu cầu của bạn. Bạn có thể xem các mẫu bên dưới.";
        }

        if (containsAny(normalizedMessage, "laptop", "macbook", "dell", "asus")) {
            return "Tôi đã tìm được một số laptop phù hợp với nhu cầu của bạn. Bạn có thể xem các mẫu bên dưới.";
        }

        return "Tôi đã tìm được một số sản phẩm phù hợp với nhu cầu của bạn. Bạn có thể xem danh sách gợi ý bên dưới.";
    }

    private int extractQuantity(String message) {
        if (containsAny(message, "mot cai", "1 cai", "một cái")) return 1;
        if (containsAny(message, "hai cai", "2 cai")) return 2;
        if (containsAny(message, "ba cai", "3 cai")) return 3;
        if (containsAny(message, "bon cai", "4 cai")) return 4;
        if (containsAny(message, "nam cai", "5 cai")) return 5;

        Matcher matcher = Pattern.compile("\\b(\\d+)\\b").matcher(message);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (Exception ignored) {
            }
        }
        return 1;
    }

    private String extractColor(String message) {
        String[] colors = {"den", "trang", "xam", "bac", "vang", "hong", "xanh", "do", "tim", "than", "titan"};
        for (String color : colors) {
            if (message.contains(color)) {
                return color;
            }
        }
        return null;
    }

    private boolean containsAny(String text, String... keywords) {
        if (text == null) return false;
        for (String keyword : keywords) {
            if (text.contains(keyword)) return true;
        }
        return false;
    }

    private List<String> splitWords(String text) {
        if (text == null || text.isBlank()) return List.of();
        String[] parts = text.split("\\s+");
        List<String> result = new ArrayList<>();
        for (String part : parts) {
            if (!part.isBlank()) result.add(part);
        }
        return result;
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("đ", "d")
                .replace("Đ", "D");

        return normalized.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
