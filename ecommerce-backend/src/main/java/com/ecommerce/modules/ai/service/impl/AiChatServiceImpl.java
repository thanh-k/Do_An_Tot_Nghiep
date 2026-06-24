package com.ecommerce.modules.ai.service.impl;

import com.ecommerce.modules.ai.dto.response.AiActionResponse;
import com.ecommerce.modules.ai.dto.response.AiChatResponse;
import com.ecommerce.modules.ai.dto.response.AiProductSuggestionResponse;
import com.ecommerce.modules.ai.service.AiChatService;
import com.ecommerce.modules.ai.service.GeminiService;
import com.ecommerce.modules.product.dto.response.ProductResponse;
import com.ecommerce.modules.product.dto.response.VariantResponse;
import com.ecommerce.modules.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private static final String SYSTEM_PROMPT = """
        Bạn là AI chăm sóc khách hàng của NovaShop.
        Vai trò của bạn:
        - Gợi ý sản phẩm đúng nhu cầu khách hàng dựa trên dữ liệu thật của hệ thống.
        - Có thể hiểu tên thương hiệu/brand như Apple, Samsung, OPPO, Xiaomi, ASUS, Dell...
        - Có thể hiểu danh mục/category như điện thoại, laptop, tai nghe, màn hình...
        - Có thể so sánh 2 đến 3 sản phẩm nếu các sản phẩm cùng danh mục.
        - Có thể tư vấn theo ngân sách khách hàng đưa ra.
        - Nếu gợi ý sản phẩm cao hơn ngân sách, hãy nói nhẹ nhàng, khích lệ kiểu: nếu có thể cố gắng thêm một chút thì mẫu này đáng cân nhắc hơn.
        - Luôn trả lời bằng tiếng Việt.
        - Không bịa thông tin ngoài dữ liệu hệ thống cung cấp.

        QUY TẮC ĐỊNH DẠNG:
        - Không dùng markdown.
        - Không dùng dấu ** hoặc *.
        - Không dùng heading markdown.
        - Trả lời theo từng dòng ngắn, rõ ràng.
        - Nếu liệt kê thông tin sản phẩm thì mỗi ý xuống một dòng riêng.
        - Khi so sánh, trình bày theo từng sản phẩm và kết luận nên chọn mẫu nào theo nhu cầu.
        - Văn phong thân thiện, dễ đọc, phù hợp giao diện chat.
        """;

    private final ProductService productService;
    private final GeminiService geminiService;

    private record CategoryRequest(boolean mentioned, boolean known, String label, String key) {
        static CategoryRequest none() {
            return new CategoryRequest(false, false, null, null);
        }
    }

    @Override
    public AiChatResponse chat(String message) {
        String rawMessage = message == null ? "" : message.trim();
        String normalizedMessage = normalizeAliases(normalizeText(rawMessage));

        if (isGreeting(normalizedMessage)) {
            return buildSimpleReply("GREETING", buildGreetingReply());
        }

        if (isThanks(normalizedMessage)) {
            return buildSimpleReply("THANKS", "Rất vui được hỗ trợ bạn. Khi cần tìm sản phẩm, so sánh mẫu hoặc thêm vào giỏ hàng, bạn cứ nhắn cho tôi nhé.");
        }

        if (isGoodbye(normalizedMessage)) {
            return buildSimpleReply("GOODBYE", "Cảm ơn bạn đã ghé InsightShop. Chúc bạn mua sắm vui vẻ nhé.");
        }

        if (isHelpRequest(normalizedMessage)) {
            return buildSimpleReply("HELP", buildHelpReply());
        }

        long budget = extractBudget(normalizedMessage);
        String intent = detectIntent(normalizedMessage, budget);
        String color = extractColor(normalizedMessage);
        int quantity = extractQuantity(normalizedMessage);
        int compareLimit = extractCompareLimit(normalizedMessage);

        List<ProductResponse> allProducts = productService.getAllProducts();
        CategoryRequest requestedCategory = detectRequestedCategory(normalizedMessage, allProducts);
        List<ProductResponse> candidateProducts = findCandidateProducts(normalizedMessage, intent, color, budget, compareLimit, allProducts);
        List<AiProductSuggestionResponse> suggestions = mapSuggestions(candidateProducts);

        if (candidateProducts.isEmpty() && ("BUDGET_SUGGESTION".equals(intent) || "PRODUCT_SUGGESTION".equals(intent)) && requestedCategory.mentioned()) {
            return AiChatResponse.builder()
                    .reply(buildNoProductByCategoryReply(requestedCategory, normalizedMessage, budget, allProducts))
                    .intent(intent)
                    .suggestedProducts(List.of())
                    .action(null)
                    .actions(List.of())
                    .build();
        }

        if ("COMPARE_PRODUCTS".equals(intent)) {
            String compareReply = buildCompareReply(candidateProducts, compareLimit);
            return AiChatResponse.builder()
                    .reply(compareReply)
                    .intent(intent)
                    .suggestedProducts(suggestions)
                    .action(null)
                    .actions(List.of())
                    .build();
        }

        if ("PRODUCT_DETAIL".equals(intent)) {
            String detailReply = buildProductDetailReply(candidateProducts, normalizedMessage);
            return AiChatResponse.builder()
                    .reply(detailReply)
                    .intent(intent)
                    .suggestedProducts(suggestions)
                    .action(candidateProducts.isEmpty() ? null : AiActionResponse.builder()
                            .type("VIEW_PRODUCT")
                            .productId(candidateProducts.get(0).getId())
                            .productSlug(candidateProducts.get(0).getSlug())
                            .quantity(1)
                            .color(color)
                            .note("Bạn có thể nhấn vào để xem thông tin chi tiết sản phẩm.")
                            .build())
                    .actions(List.of())
                    .build();
        }

        if ("ADD_TO_CART".equals(intent)) {
            List<AiActionResponse> actions = buildActions(intent, candidateProducts, color, quantity);
            AiActionResponse action = actions.isEmpty() ? null : actions.get(0);
            return AiChatResponse.builder()
                    .reply(buildFallbackReply(intent, candidateProducts, color, quantity, normalizedMessage, budget))
                    .intent(intent)
                    .suggestedProducts(suggestions)
                    .action(action)
                    .actions(actions)
                    .build();
        }

        String productContext = buildProductContext(candidateProducts, color, quantity, intent, budget, normalizedMessage);

        String reply = geminiService.generateCustomerSupportReply(SYSTEM_PROMPT, rawMessage, productContext);
        if (isAiUnavailableReply(reply)) {
            reply = buildFallbackReply(intent, candidateProducts, color, quantity, normalizedMessage, budget);
        }

        List<AiActionResponse> actions = buildActions(intent, candidateProducts, color, quantity);
        AiActionResponse action = actions.isEmpty() ? null : actions.get(0);

        return AiChatResponse.builder()
                .reply(reply)
                .intent(intent)
                .suggestedProducts(suggestions)
                .action(action)
                .actions(actions)
                .build();
    }

    private AiChatResponse buildSimpleReply(String intent, String reply) {
        return AiChatResponse.builder()
                .reply(reply)
                .intent(intent)
                .suggestedProducts(List.of())
                .action(null)
                .actions(List.of())
                .build();
    }

    private boolean isGreeting(String message) {
        if (message == null || message.isBlank()) return false;
        String text = message.trim();
        return text.equals("chao")
                || text.equals("xin chao")
                || text.equals("hello")
                || text.equals("hi")
                || text.equals("hey")
                || text.equals("alo")
                || text.equals("shop oi")
                || text.equals("ad oi")
                || text.equals("tu van vien oi")
                || text.equals("em oi")
                || text.equals("anh oi")
                || text.equals("chi oi");
    }

    private boolean isThanks(String message) {
        if (message == null || message.isBlank()) return false;
        String text = message.trim();
        return text.equals("cam on")
                || text.equals("thanks")
                || text.equals("thank you")
                || text.equals("ok cam on")
                || text.equals("cam on ban")
                || text.equals("cam on shop");
    }

    private boolean isGoodbye(String message) {
        if (message == null || message.isBlank()) return false;
        String text = message.trim();
        return text.equals("bye")
                || text.equals("tam biet")
                || text.equals("hen gap lai")
                || text.equals("thoat");
    }

    private boolean isHelpRequest(String message) {
        if (message == null || message.isBlank()) return false;
        String text = message.trim();
        return text.equals("help")
                || text.equals("tro giup")
                || text.equals("ban lam duoc gi")
                || text.equals("ai lam duoc gi")
                || text.equals("huong dan")
                || text.equals("cach dung");
    }

    private String buildGreetingReply() {
        return """
                Xin chào 👋
                Tôi là trợ lý mua sắm của InsightShop.

                Tôi có thể hỗ trợ bạn:
                • Tìm sản phẩm theo nhu cầu
                • Tìm sản phẩm theo thương hiệu hoặc danh mục
                • Gợi ý sản phẩm theo ngân sách
                • So sánh 2 hoặc 3 sản phẩm cùng loại
                • Hỗ trợ thêm sản phẩm vào giỏ hàng

                Bạn có thể thử:
                - Điện thoại dưới 20 triệu
                - Laptop gaming khoảng 25 triệu
                - Sản phẩm Samsung đáng mua
                - So sánh iPhone 16 và Samsung Galaxy S25
                - Thêm iPhone 15 Pro vào giỏ hàng
                """;
    }

    private String buildHelpReply() {
        return """
                Tôi có thể giúp bạn mua sắm nhanh hơn bằng các câu hỏi như:

                • Tìm theo ngân sách:
                - Điện thoại dưới 20 triệu
                - Laptop khoảng 15 triệu
                - Tai nghe dưới 3 triệu

                • Tìm theo thương hiệu hoặc danh mục:
                - Có sản phẩm Apple nào?
                - Gợi ý laptop ASUS
                - Tìm điện thoại Samsung

                • So sánh:
                - So sánh iPhone 16 và Samsung Galaxy S25
                - So sánh 3 điện thoại tốt nhất

                • Giỏ hàng:
                - Thêm iPhone 15 Pro vào giỏ hàng
                - Cho iPhone 15 Pro vô giỏ
                - Đặt mua iPhone 15 Pro số lượng 2
                - Chốt đơn iPhone 15 Pro
                - Mình muốn mua iPhone 15 Pro
                - Thêm Samsung Galaxy S24 Ultra và iPhone 15 Pro vào giỏ hàng
                """;
    }

    private boolean isUnderBudgetQuery(String message) {
        return containsAny(message, "duoi", "duoi tam", "toi da", "khong qua", "nho hon", "re hon");
    }

    private boolean isAboveBudgetQuery(String message) {
        return containsAny(message, "tren", "hon", "cao hon", "tu");
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

    private String detectIntent(String message, long budget) {
        // Ưu tiên nhận diện thêm giỏ hàng trước các intent tư vấn.
        // Câu thực tế thường là: "Thêm iPhone 15 Pro vào giỏ hàng số lượng 1 cái".
        // Nếu chỉ check chuỗi "them vao gio" thì sẽ miss vì tên sản phẩm nằm giữa "them" và "vao gio".
        if (isAddToCartRequest(message)) {
            return "ADD_TO_CART";
        }

        if (containsAny(message, "so sanh", "so san", "khac nhau", "nen chon giua", "chon giua", "giua", "dau hon", "hon kem")) {
            return "COMPARE_PRODUCTS";
        }

        if (budget > 0 || containsAny(message, "ngan sach", "tam tien", "so tien", "toi co", "dang co", "khoang", "duoi", "duoi tam", "toi da", "khong qua", "tren", "tu van theo tien")) {
            return "BUDGET_SUGGESTION";
        }

        if (containsAny(message,
                "chi tiet", "chi tiet san pham", "xem chi tiet",
                "mo ta", "mo ta san pham", "gioi thieu", "noi dung",
                "thong tin", "thong tin san pham", "info",
                "gia bao nhieu", "gia may", "bao nhieu tien", "gia ban", "gia cua",
                "co gi", "co nhung gi", "gom nhung gi",
                "cau hinh", "cau hinh may", "config", "configuration",
                "thong so", "thong so ky thuat", "spec", "specs", "specification",
                "chip", "cpu", "ram", "bo nho", "storage", "ssd", "man hinh", "display",
                "camera", "pin", "battery", "he dieu hanh", "os", "cong", "khung")) {
            return "PRODUCT_DETAIL";
        }

        if (containsAny(message, "goi y", "tu van", "nen mua", "chon giup", "tim giup", "tim", "co nhung gi", "co cac", "san pham cua", "hang", "thuong hieu",
                "dien thoai", "smartphone", "phone", "laptop", "lap top", "notebook", "macbook", "tai nghe", "headphone", "earbuds", "tablet", "may tinh bang", "dong ho", "watch", "monitor", "man hinh", "phu kien", "apple", "samsung", "oppo", "asus", "dell", "xiaomi")) {
            return "PRODUCT_SUGGESTION";
        }

        return "GENERAL";
    }


    private boolean isAddToCartRequest(String message) {
        if (message == null || message.isBlank()) return false;

        String text = (" " + message + " ").replaceAll("\\s+", " ");

        // Bắt nhanh những câu rất phổ biến trước khi đi vào regex dài.
        // Mục tiêu: không để câu "Thêm iPhone 15 Pro vào giỏ hàng số lượng 1 cái"
        // bị rơi xuống intent tư vấn sản phẩm.
        boolean hasCartWord = containsAny(text,
                " gio ", " gio hang ", " vao gio ", " vao gio hang ",
                " vo gio ", " vo gio hang ", " cart ", " to cart ");
        boolean hasAddVerb = containsAny(text,
                " them ", " add ", " cho ", " bo ", " dua ",
                " them giup ", " cho minh ", " cho toi ", " bo giup ");

        if (hasCartWord && hasAddVerb) {
            return true;
        }

        // Tránh hiểu nhầm các câu tư vấn thành thao tác thêm giỏ hàng.
        // Ví dụ: "nên mua iPhone nào", "mua điện thoại nào tốt" chỉ là hỏi tư vấn.
        if (containsAny(text,
                " nen mua ", " co nen mua ", " tu van mua ", " mua gi ", " mua gi tot ",
                " mua may nao ", " mua loai nao ", " mua san pham nao ", " mua dien thoai nao ",
                " mua laptop nao ", " dang phan van mua ", " nen chon mua ")) {
            return false;
        }

        // Nhóm 1: câu có cụm giỏ hàng rõ ràng.
        // Hỗ trợ nhiều cách nói cùng ý:
        // - "Thêm iPhone 15 Pro vào giỏ hàng"
        // - "Cho iPhone 15 Pro vô giỏ"
        // - "Bỏ iPhone 15 Pro vào cart"
        // - "Add iPhone 15 Pro to cart"
        if (Pattern.compile(".*\\b(them|cho|bo|dua|add|them\\s+giup|cho\\s+minh|cho\\s+toi)\\b.{0,120}\\b(vao|vo|toi|to)?\\s*(gio|gio\\s+hang|cart)\\b.*")
                .matcher(text)
                .matches()) {
            return true;
        }

        if (Pattern.compile(".*\\b(gio|gio\\s+hang|cart)\\b.{0,120}\\b(them|cho|bo|dua|add)\\b.*")
                .matcher(text)
                .matches()) {
            return true;
        }

        // Nhóm 2: câu mua/đặt hàng có tính hành động, không phải hỏi tư vấn.
        // - "Mua ngay iPhone 15 Pro"
        // - "Đặt mua iPhone 15 Pro"
        // - "Đặt hàng iPhone 15 Pro số lượng 2"
        // - "Chốt đơn iPhone 15 Pro"
        // - "Lấy cho mình iPhone 15 Pro"
        if (Pattern.compile(".*\\b(mua\\s+ngay|dat\\s+mua|dat\\s+hang|chot\\s+don|len\\s+don|lay\\s+cho|lay\\s+giup|mua\\s+giup)\\b.{0,140}.*")
                .matcher(text)
                .matches()) {
            return true;
        }

        // Nhóm 3: câu thể hiện ý định mua trực tiếp kèm sản phẩm.
        // Không bắt các câu hỏi chung vì phía trên đã loại trừ các cụm "nên mua/mua nào".
        // - "Mình muốn mua iPhone 15 Pro"
        // - "Tôi lấy iPhone 15 Pro 1 cái"
        // - "Cho mình đặt iPhone 15 Pro"
        if (Pattern.compile(".*\\b(muon\\s+mua|can\\s+mua|toi\\s+mua|minh\\s+mua|toi\\s+lay|minh\\s+lay|cho\\s+minh\\s+dat|cho\\s+toi\\s+dat)\\b.{1,140}.*")
                .matcher(text)
                .matches()) {
            return true;
        }

        return containsAny(text,
                " them vao gio ", " them vao gio hang ", " them gio hang ", " them vao cart ",
                " cho vao gio ", " cho vao gio hang ", " cho vo gio ", " bo vao gio ", " bo vao gio hang ",
                " dua vao gio ", " dua vao gio hang ", " add to cart ", " add vao gio ",
                " mua ngay ", " dat mua ", " dat hang ", " chot don ", " len don ");
    }

    private List<ProductResponse> findCandidateProducts(String message, String intent, String color, long budget, int compareLimit, List<ProductResponse> products) {
        if (products == null || products.isEmpty()) {
            return List.of();
        }

        if ("BUDGET_SUGGESTION".equals(intent) && budget > 0) {
            return findProductsByBudget(message, color, budget, products);
        }

        if ("COMPARE_PRODUCTS".equals(intent)) {
            return findComparableProducts(message, color, compareLimit, products);
        }

        if ("ADD_TO_CART".equals(intent)) {
            return findProductsForAddToCart(message, color, products);
        }

        if ("PRODUCT_DETAIL".equals(intent)) {
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
                    .limit(8)
                    .toList();
        }

        return products.stream().limit(4).toList();
    }

    private List<ProductResponse> findProductsForAddToCart(String message, String color, List<ProductResponse> products) {
        int requestedCount = extractRequestedProductCount(message);
        int limit = Math.max(1, Math.min(5, requestedCount));

        List<ProductResponse> explicitlyMentioned = products.stream()
                .map(product -> Map.entry(product, scoreProductMentionForCompare(product, message, color)))
                .filter(entry -> entry.getValue() >= 80)
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .map(Map.Entry::getKey)
                .limit(limit)
                .toList();

        if (!explicitlyMentioned.isEmpty()) {
            return explicitlyMentioned;
        }

        List<ProductResponse> exactMatched = products.stream()
                .sorted((a, b) -> Integer.compare(
                        scoreProductForExactMatch(b, message, color),
                        scoreProductForExactMatch(a, message, color)
                ))
                .filter(p -> scoreProductForExactMatch(p, message, color) > 0)
                .limit(limit)
                .toList();

        if (!exactMatched.isEmpty()) {
            return exactMatched;
        }

        return products.stream()
                .sorted((a, b) -> Integer.compare(
                        scoreProductForNeed(b, message, color),
                        scoreProductForNeed(a, message, color)
                ))
                .filter(p -> scoreProductForNeed(p, message, color) > 0)
                .limit(limit)
                .toList();
    }

    private List<ProductResponse> findProductsByBudget(String message, String color, long budget, List<ProductResponse> products) {
        boolean underBudget = isUnderBudgetQuery(message);
        boolean aboveBudget = isAboveBudgetQuery(message);
        CategoryRequest requestedCategory = detectRequestedCategory(message, products);

        if (requestedCategory.mentioned() && !requestedCategory.known()) {
            return List.of();
        }

        double min = underBudget ? 0 : budget * 0.8;
        double max = underBudget ? budget : (aboveBudget ? budget * 1.6 : budget * 1.2);
        double upsellMax = underBudget ? budget * 1.15 : budget * 1.35;

        List<ProductResponse> categoryFilteredProducts = products.stream()
                .filter(p -> !requestedCategory.mentioned() || sameCategory(p, requestedCategory))
                .toList();

        List<ProductResponse> inRange = categoryFilteredProducts.stream()
                .filter(p -> getMinPrice(p) > 0)
                .filter(p -> scoreProductForNeed(p, message, color) >= 0)
                .filter(p -> {
                    double price = getMinPrice(p);
                    return price >= min && price <= max;
                })
                .sorted(Comparator
                        .comparingInt((ProductResponse p) -> -scoreProductForNeed(p, message, color))
                        .thenComparingDouble(p -> Math.abs(getMinPrice(p) - budget)))
                .limit(6)
                .toList();

        if (underBudget) return inRange;
        if (inRange.size() >= 4) return inRange;

        List<ProductResponse> upsell = categoryFilteredProducts.stream()
                .filter(p -> getMinPrice(p) > max && getMinPrice(p) <= upsellMax)
                .filter(p -> scoreProductForNeed(p, message, color) >= 0)
                .sorted(Comparator
                        .comparingInt((ProductResponse p) -> -scoreProductForNeed(p, message, color))
                        .thenComparingDouble(p -> getMinPrice(p)))
                .limit(6 - inRange.size())
                .toList();

        List<ProductResponse> result = new ArrayList<>(inRange);
        result.addAll(upsell);

        if (!result.isEmpty()) return result;

        return categoryFilteredProducts.stream()
                .filter(p -> getMinPrice(p) > 0)
                .sorted(Comparator.comparingDouble(p -> Math.abs(getMinPrice(p) - budget)))
                .limit(6)
                .toList();
    }

    private List<ProductResponse> findComparableProducts(String message, String color, int compareLimit, List<ProductResponse> products) {
        int limit = normalizeCompareLimit(compareLimit);

        List<ProductResponse> explicitlyMentioned = products.stream()
                .map(product -> Map.entry(product, scoreProductMentionForCompare(product, message, color)))
                .filter(entry -> entry.getValue() >= 80)
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .map(Map.Entry::getKey)
                .limit(limit)
                .toList();

        List<ProductResponse> matchedProducts = explicitlyMentioned;

        if (matchedProducts.size() < 2) {
            matchedProducts = products.stream()
                    .sorted((a, b) -> Integer.compare(
                            scoreProductForExactMatch(b, message, color),
                            scoreProductForExactMatch(a, message, color)
                    ))
                    .filter(p -> scoreProductForExactMatch(p, message, color) > 0)
                    .limit(10)
                    .toList();
        }

        if (matchedProducts.size() < 2) {
            matchedProducts = products.stream()
                    .sorted((a, b) -> Integer.compare(
                            scoreProductForNeed(b, message, color),
                            scoreProductForNeed(a, message, color)
                    ))
                    .filter(p -> scoreProductForNeed(p, message, color) > 0)
                    .limit(10)
                    .toList();
        }

        if (matchedProducts.size() < 2) {
            return matchedProducts;
        }

        Map<String, List<ProductResponse>> byCategory = matchedProducts.stream()
                .collect(Collectors.groupingBy(
                        this::categoryKey,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<ProductResponse> sameCategoryProducts = byCategory.values().stream()
                .filter(list -> list.size() >= 2)
                .findFirst()
                .orElse(null);

        if (sameCategoryProducts != null) {
            return sameCategoryProducts.stream().limit(limit).toList();
        }

        return matchedProducts.stream().limit(limit).toList();
    }

    private int scoreProductMentionForCompare(ProductResponse product, String message, String color) {
        String name = normalizeText(product.getName());
        String slug = normalizeText(product.getSlug());
        String brandName = product.getBrand() != null ? normalizeText(product.getBrand().getName()) : "";
        String all = getFullProductText(product);

        int score = 0;

        if (!name.isBlank() && message.contains(name)) score += 500;
        if (!slug.isBlank() && message.contains(slug)) score += 450;

        List<String> productTokens = splitWords(name).stream()
                .filter(token -> token.length() >= 2)
                .filter(token -> !isGenericCompareToken(token))
                .toList();

        int matchedTokenCount = 0;
        boolean hasStrongModelToken = false;

        for (String token : productTokens) {
            if (message.contains(token)) {
                matchedTokenCount++;
                score += isStrongModelToken(token) ? 120 : 35;
                if (isStrongModelToken(token)) {
                    hasStrongModelToken = true;
                }
            }
        }

        if (!brandName.isBlank() && message.contains(brandName)) {
            score += 45;
        }

        if (color != null && variantMatchesColor(product, color)) {
            score += 35;
        }

        if (hasStrongModelToken && matchedTokenCount >= 1) {
            score += 120;
        }

        if (productTokens.size() > 0 && matchedTokenCount >= Math.min(2, productTokens.size())) {
            score += 80;
        }

        if (message.contains("s25") && all.contains("s25")) score += 250;
        if (message.contains("s24 ultra") && all.contains("s24 ultra")) score += 250;
        if (message.contains("iphone 16") && all.contains("iphone 16")) score += 260;
        if (message.contains("iphone 15 pro") && all.contains("iphone 15 pro")) score += 260;

        return score;
    }

    private boolean isGenericCompareToken(String token) {
        return containsAny(token, "dien", "thoai", "laptop", "may", "tinh", "bang", "tai", "nghe", "dong", "ho");
    }

    private boolean isStrongModelToken(String token) {
        return token.matches(".*\\d.*")
                || token.contains("pro")
                || token.contains("ultra")
                || token.contains("plus")
                || token.contains("max")
                || token.contains("air")
                || token.contains("m1")
                || token.contains("m2")
                || token.contains("m3")
                || token.contains("m4");
    }

    private int scoreProductForExactMatch(ProductResponse product, String message, String color) {
        String all = getFullProductText(product);
        int score = 0;

        String name = normalizeText(product.getName());
        String slug = normalizeText(product.getSlug());
        String brandName = product.getBrand() != null ? normalizeText(product.getBrand().getName()) : "";
        String brandSlug = product.getBrand() != null ? normalizeText(product.getBrand().getSlug()) : "";
        String categoryName = product.getCategory() != null ? normalizeText(product.getCategory().getName()) : "";
        String categorySlug = product.getCategory() != null ? normalizeText(product.getCategory().getSlug()) : "";

        if (!name.isBlank() && message.contains(name)) score += 250;
        if (!slug.isBlank() && message.contains(slug)) score += 220;
        if (!brandName.isBlank() && message.contains(brandName)) score += 130;
        if (!brandSlug.isBlank() && message.contains(brandSlug)) score += 120;
        if (!categoryName.isBlank() && message.contains(categoryName)) score += 90;
        if (!categorySlug.isBlank() && message.contains(categorySlug)) score += 80;

        if (message.contains("iphone 15 pro") && name.contains("iphone 15 pro")) score += 400;
        if (message.contains("iphone 15 plus") && name.contains("iphone 15 plus")) score += 380;
        if (message.contains("iphone 15") && name.contains("iphone 15")) score += 150;
        if (message.contains("s24 ultra") && name.contains("s24 ultra")) score += 300;
        if (message.contains("oppo") && all.contains("oppo")) score += 160;

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

        if (brandMentioned(product, message)) score += 140;
        if (categoryMentioned(product, message)) score += 100;

        if (containsAny(message, "dien thoai", "smartphone", "phone", "iphone", "samsung", "android", "oppo", "xiaomi", "vivo", "realme")) {
            if (isPhoneProduct(product)) score += 40;
            else score -= 40;
        }

        if (containsAny(message, "laptop", "lap top", "notebook", "macbook", "dell", "hp", "lenovo", "asus")) {
            if (isLaptopProduct(product)) score += 40;
            else score -= 40;
        }

        if (containsAny(message, "tai nghe", "tai nge", "headphone", "earbuds", "airpods")) {
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

    private boolean brandMentioned(ProductResponse product, String message) {
        if (product.getBrand() == null) return false;
        String brandName = normalizeText(product.getBrand().getName());
        String brandSlug = normalizeText(product.getBrand().getSlug());
        return (!brandName.isBlank() && message.contains(brandName))
                || (!brandSlug.isBlank() && message.contains(brandSlug));
    }

    private boolean categoryMentioned(ProductResponse product, String message) {
        if (product.getCategory() == null) return false;
        String categoryName = normalizeText(product.getCategory().getName());
        String categorySlug = normalizeText(product.getCategory().getSlug());
        return (!categoryName.isBlank() && message.contains(categoryName))
                || (!categorySlug.isBlank() && message.contains(categorySlug));
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

    private boolean hasSpecificCategoryInMessage(String message) {
        return detectRequestedCategory(message, productService.getAllProducts()).mentioned();
    }

    private boolean matchesRequestedCategory(ProductResponse product, String message) {
        CategoryRequest requestedCategory = detectRequestedCategory(message, productService.getAllProducts());
        return !requestedCategory.mentioned() || (requestedCategory.known() && sameCategory(product, requestedCategory));
    }

    private CategoryRequest detectRequestedCategory(String message, List<ProductResponse> products) {
        if (message == null || message.isBlank()) return CategoryRequest.none();
        String text = normalizeAliases(normalizeText(message));

        // Nhận diện các cách user hay gõ sai/gõ tắt. Nếu DB có danh mục tương ứng thì khóa vào danh mục đó.
        Map<String, List<String>> aliases = new LinkedHashMap<>();
        aliases.put("dien thoai", List.of("dien thoai", "phone", "smartphone", "mobile", "iphone", "android", "oppo phone", "xiaomi phone"));
        aliases.put("laptop", List.of("laptop", "lap top", "laptop", "notebook", "macbook", "ultrabook", "may tinh xach tay", "may tinh laptop"));
        aliases.put("tai nghe", List.of("tai nghe", "tai nge", "headphone", "head phone", "earphone", "earbuds", "airpods", "am thanh"));
        aliases.put("may tinh bang", List.of("may tinh bang", "tablet", "ipad", "tab"));
        aliases.put("dong ho", List.of("dong ho", "watch", "smartwatch", "dong ho thong minh"));
        aliases.put("man hinh", List.of("man hinh", "monitor", "display", "screen"));
        aliases.put("phu kien", List.of("phu kien", "accessory", "accessories", "sac", "cap sac", "adapter"));
        aliases.put("gia dung thong minh", List.of("gia dung", "gia dung thong minh", "nha thong minh", "may hut bui", "robot hut bui", "may pha ca phe"));

        for (Map.Entry<String, List<String>> entry : aliases.entrySet()) {
            boolean mentioned = entry.getValue().stream().anyMatch(alias -> containsPhrase(text, alias));
            if (!mentioned) continue;

            String canonicalKey = entry.getKey();
            ProductResponse sample = products.stream()
                    .filter(p -> categoryText(p).contains(canonicalKey)
                            || entry.getValue().stream().anyMatch(alias -> categoryText(p).contains(normalizeText(alias))))
                    .findFirst()
                    .orElse(null);

            if (sample != null && sample.getCategory() != null) {
                return new CategoryRequest(true, true, safe(sample.getCategory().getName()), categoryKey(sample));
            }

            return new CategoryRequest(true, false, toDisplayCategoryName(canonicalKey), canonicalKey);
        }

        for (ProductResponse product : products) {
            if (product.getCategory() == null) continue;
            String categoryName = normalizeText(product.getCategory().getName());
            String categorySlug = normalizeText(product.getCategory().getSlug());
            if ((!categoryName.isBlank() && containsPhrase(text, categoryName))
                    || (!categorySlug.isBlank() && containsPhrase(text, categorySlug))) {
                return new CategoryRequest(true, true, safe(product.getCategory().getName()), categoryKey(product));
            }
        }

        // Một số danh mục phổ biến nếu user hỏi nhưng hệ thống chưa bán.
        Map<String, String> unsupported = Map.of(
                "may giat", "Máy giặt",
                "tu lanh", "Tủ lạnh",
                "tivi", "Tivi",
                "tv", "Tivi",
                "may lanh", "Máy lạnh",
                "dieu hoa", "Điều hòa",
                "may anh", "Máy ảnh",
                "camera", "Camera"
        );
        for (Map.Entry<String, String> entry : unsupported.entrySet()) {
            if (containsPhrase(text, entry.getKey())) {
                return new CategoryRequest(true, false, entry.getValue(), entry.getKey());
            }
        }

        return CategoryRequest.none();
    }

    private boolean sameCategory(ProductResponse product, CategoryRequest requestedCategory) {
        return product != null
                && product.getCategory() != null
                && requestedCategory != null
                && requestedCategory.key() != null
                && categoryKey(product).equals(requestedCategory.key());
    }

    private String categoryText(ProductResponse product) {
        if (product == null || product.getCategory() == null) return "";
        return normalizeText(safe(product.getCategory().getName()) + " " + safe(product.getCategory().getSlug()));
    }

    private boolean containsPhrase(String text, String phrase) {
        if (text == null || phrase == null) return false;
        String normalizedText = " " + normalizeAliases(normalizeText(text)) + " ";
        String normalizedPhrase = " " + normalizeAliases(normalizeText(phrase)) + " ";
        return normalizedText.contains(normalizedPhrase.trim().length() <= 3 ? normalizedPhrase : normalizedPhrase);
    }

    private String toDisplayCategoryName(String key) {
        return switch (key) {
            case "dien thoai" -> "Điện thoại";
            case "laptop" -> "Laptop";
            case "tai nghe" -> "Tai nghe";
            case "may tinh bang" -> "Máy tính bảng";
            case "dong ho" -> "Đồng hồ thông minh";
            case "man hinh" -> "Màn hình";
            case "phu kien" -> "Phụ kiện";
            case "gia dung thong minh" -> "Gia dụng thông minh";
            default -> key;
        };
    }

    private boolean isPhoneProduct(ProductResponse product) {
        String category = product.getCategory() != null
                ? normalizeText(safe(product.getCategory().getName()) + " " + safe(product.getCategory().getSlug()))
                : "";
        String name = normalizeText(safe(product.getName()) + " " + safe(product.getSlug()));
        String all = getFullProductText(product);

        return containsAny(category, "dien thoai", "smartphone", "phone")
                || containsAny(name, "iphone", "galaxy s", "galaxy z", "zenfone", "rog phone", "oppo", "xiaomi", "vivo", "realme", "pixel")
                || containsAny(all, "dien thoai flagship", "dien thoai gaming", "smartphone");
    }

    private boolean isLaptopProduct(ProductResponse product) {
        String category = product.getCategory() != null
                ? normalizeText(safe(product.getCategory().getName()) + " " + safe(product.getCategory().getSlug()))
                : "";
        String name = normalizeText(safe(product.getName()) + " " + safe(product.getSlug()));
        return containsAny(category, "laptop", "notebook", "ultrabook")
                || containsAny(name, "macbook", "thinkpad", "inspiron", "latitude", "vivobook", "zenbook", "laptop");
    }

    private boolean isHeadphoneProduct(ProductResponse product) {
        String category = product.getCategory() != null
                ? normalizeText(safe(product.getCategory().getName()) + " " + safe(product.getCategory().getSlug()))
                : "";
        String name = normalizeText(safe(product.getName()) + " " + safe(product.getSlug()));
        return containsAny(category, "tai nghe", "headphone", "earbuds", "audio")
                || containsAny(name, "airpods", "earbuds", "headphone", "buds", "tai nghe");
    }

    private boolean isTabletProduct(ProductResponse product) {
        String category = product.getCategory() != null
                ? normalizeText(safe(product.getCategory().getName()) + " " + safe(product.getCategory().getSlug()))
                : "";
        String name = normalizeText(safe(product.getName()) + " " + safe(product.getSlug()));
        return containsAny(category, "may tinh bang", "tablet")
                || containsAny(name, "ipad", "galaxy tab", "tablet");
    }

    private boolean isWatchProduct(ProductResponse product) {
        String category = product.getCategory() != null
                ? normalizeText(safe(product.getCategory().getName()) + " " + safe(product.getCategory().getSlug()))
                : "";
        String name = normalizeText(safe(product.getName()) + " " + safe(product.getSlug()));
        return containsAny(category, "dong ho", "watch")
                || containsAny(name, "watch", "garmin", "dong ho");
    }

    private boolean isMonitorProduct(ProductResponse product) {
        String category = product.getCategory() != null
                ? normalizeText(safe(product.getCategory().getName()) + " " + safe(product.getCategory().getSlug()))
                : "";
        String name = normalizeText(safe(product.getName()) + " " + safe(product.getSlug()));
        return containsAny(category, "man hinh", "monitor")
                || containsAny(name, "monitor", "man hinh");
    }

    private boolean variantMatchesColor(ProductResponse product, String color) {
        if (color == null || product.getVariants() == null) return false;
        return product.getVariants().stream()
                .map(v -> normalizeText(v.getAttributes()))
                .anyMatch(attrs -> attrs.contains(color));
    }

    private String getFullProductText(ProductResponse product) {
        String category = product.getCategory() != null ? safe(product.getCategory().getName()) + " " + safe(product.getCategory().getSlug()) : "";
        String brand = product.getBrand() != null ? safe(product.getBrand().getName()) + " " + safe(product.getBrand().getSlug()) : "";
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
                        .price(getMinPrice(product))
                        .compareAtPrice(getCompareAtPriceOfMinPriceVariant(product))
                        .summary(buildSummary(product))
                        .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                        .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                        .build())
                .collect(Collectors.toList());
    }

    private Double extractPrice(ProductResponse product) {
        double minPrice = getMinPrice(product);
        return minPrice > 0 ? minPrice : 0.0;
    }

    private Double extractCompareAtPrice(ProductResponse product) {
        Double compareAtPrice = getCompareAtPriceOfMinPriceVariant(product);
        return compareAtPrice != null ? compareAtPrice : null;
    }

    private double getMinPrice(ProductResponse product) {
        if (product == null || product.getVariants() == null || product.getVariants().isEmpty()) {
            return 0.0;
        }

        return product.getVariants().stream()
                .map(VariantResponse::getPrice)
                .filter(Objects::nonNull)
                .min(Double::compareTo)
                .orElse(0.0);
    }

    private Double getCompareAtPriceOfMinPriceVariant(ProductResponse product) {
        if (product == null || product.getVariants() == null || product.getVariants().isEmpty()) {
            return null;
        }

        return product.getVariants().stream()
                .filter(v -> v.getPrice() != null)
                .min(Comparator.comparing(VariantResponse::getPrice))
                .map(VariantResponse::getCompareAtPrice)
                .orElse(null);
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



    private String buildProductDetailReply(List<ProductResponse> products, String normalizedMessage) {
        if (products == null || products.isEmpty()) {
            return "Tôi chưa tìm thấy sản phẩm bạn hỏi. Bạn có thể nhập rõ hơn tên sản phẩm, ví dụ: thông số MacBook Air M3, cấu hình iPhone 16 hoặc mô tả Samsung Galaxy S25.";
        }

        ProductResponse product = products.get(0);
        StringBuilder sb = new StringBuilder();

        sb.append("Tôi tìm thấy sản phẩm: ").append(safe(product.getName())).append(".\n");

        if (product.getBrand() != null && !safe(product.getBrand().getName()).isBlank()) {
            sb.append("Thương hiệu: ").append(safe(product.getBrand().getName())).append(".\n");
        }

        if (product.getCategory() != null && !safe(product.getCategory().getName()).isBlank()) {
            sb.append("Danh mục: ").append(safe(product.getCategory().getName())).append(".\n");
        }

        sb.append("Giá bán hiện tại: ").append(formatVnd(getMinPrice(product))).append(".\n");

        Double compareAtPrice = getCompareAtPriceOfMinPriceVariant(product);
        if (compareAtPrice != null && compareAtPrice > getMinPrice(product)) {
            sb.append("Giá gốc: ").append(formatVnd(compareAtPrice)).append(".\n");
        }

        boolean wantsSpecs = containsAny(normalizedMessage,
                "thong so", "thong so ky thuat", "cau hinh", "config", "spec", "specs",
                "chip", "cpu", "ram", "bo nho", "storage", "ssd", "man hinh", "display",
                "camera", "pin", "battery", "he dieu hanh", "os", "cong", "khung");

        boolean wantsDescription = containsAny(normalizedMessage,
                "mo ta", "gioi thieu", "thong tin", "chi tiet", "co gi", "noi dung");

        if (wantsSpecs || !safe(product.getSpecifications()).isBlank()) {
            String specText = buildReadableSpecifications(product);
            if (!specText.isBlank()) {
                sb.append("\nThông số kỹ thuật:\n").append(specText);
            }
        }

        if (wantsDescription || sb.length() < 120) {
            String shortDescription = safe(product.getShortDescription());
            String description = safe(product.getDescription());

            if (!shortDescription.isBlank()) {
                sb.append("\nMô tả ngắn: ").append(shortDescription).append("\n");
            }

            if (!description.isBlank() && !description.equalsIgnoreCase(shortDescription)) {
                sb.append("Mô tả chi tiết: ").append(limitForChat(description, 420)).append("\n");
            }
        }

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            sb.append("\nBiến thể hiện có:\n");
            product.getVariants().stream()
                    .limit(5)
                    .forEach(variant -> {
                        String attrs = safe(variant.getAttributes());
                        sb.append("- ");
                        if (!attrs.isBlank() && !"{}".equals(attrs)) {
                            sb.append(cleanVariantAttributes(attrs)).append(" - ");
                        }
                        sb.append("giá ").append(variant.getPrice() == null ? "chưa có giá" : formatVnd(variant.getPrice()));
                        if (variant.getStock() != null) {
                            sb.append(", còn ").append(variant.getStock());
                        }
                        sb.append("\n");
                    });
        }

        sb.append("\nBạn có thể bấm vào sản phẩm bên dưới để xem hình ảnh, biến thể và đặt mua.");
        return sb.toString().trim();
    }

    private String buildReadableSpecifications(ProductResponse product) {
        Map<String, String> specs = parseSpecMap(safe(product.getSpecifications()));
        if (specs.isEmpty()) {
            return "";
        }

        List<String> priorityKeys = List.of(
                "chip", "cpu", "ram", "bo nho", "storage", "ssd",
                "man hinh", "display", "camera", "pin", "battery",
                "he dieu hanh", "os", "khung", "cong"
        );

        StringBuilder sb = new StringBuilder();
        List<String> usedKeys = new ArrayList<>();

        for (String priorityKey : priorityKeys) {
            for (Map.Entry<String, String> entry : specs.entrySet()) {
                String normalizedKey = normalizeText(entry.getKey());
                if (!usedKeys.contains(entry.getKey())
                        && (normalizedKey.equals(priorityKey)
                        || normalizedKey.contains(priorityKey)
                        || priorityKey.contains(normalizedKey))) {
                    sb.append("- ").append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
                    usedKeys.add(entry.getKey());
                }
            }
        }

        specs.entrySet().stream()
                .filter(entry -> !usedKeys.contains(entry.getKey()))
                .limit(8)
                .forEach(entry -> sb.append("- ").append(entry.getKey()).append(": ").append(entry.getValue()).append("\n"));

        return sb.toString();
    }

    private String cleanVariantAttributes(String value) {
        Map<String, String> attrs = parseSpecMap(value);
        if (attrs.isEmpty()) {
            return value.replace("{", "").replace("}", "").replace("\"", "").trim();
        }
        return attrs.entrySet().stream()
                .map(entry -> entry.getKey() + ": " + entry.getValue())
                .collect(Collectors.joining(", "));
    }

    private String limitForChat(String value, int maxLength) {
        if (value == null) return "";
        String cleaned = value.replaceAll("\\s+", " ").trim();
        if (cleaned.length() <= maxLength) return cleaned;
        return cleaned.substring(0, maxLength).trim() + "...";
    }

    private String buildCompareReply(List<ProductResponse> products, int compareLimit) {
        int limit = normalizeCompareLimit(compareLimit);

        if (products == null || products.size() < 2) {
            return "Tôi chưa tìm đủ 2 sản phẩm để so sánh. Bạn hãy nhập rõ tên 2 hoặc 3 sản phẩm cùng danh mục, ví dụ: so sánh iPhone 16 và Samsung Galaxy S25.";
        }

        boolean sameCategory = products.stream()
                .map(this::categoryKey)
                .distinct()
                .count() == 1;

        if (!sameCategory) {
            String categories = products.stream()
                    .map(p -> p.getCategory() != null ? safe(p.getCategory().getName()) : "Chưa rõ danh mục")
                    .distinct()
                    .collect(Collectors.joining(", "));

            return "Tôi chỉ so sánh các sản phẩm cùng danh mục để kết quả công bằng.\n"
                    + "Các sản phẩm bạn hỏi hiện chưa cùng danh mục hoặc hệ thống chưa xác định rõ danh mục.\n"
                    + "Danh mục tìm được: " + categories + ".\n"
                    + "Bạn hãy chọn 2 hoặc 3 sản phẩm cùng loại, ví dụ cùng là điện thoại hoặc cùng là laptop.";
        }

        List<ProductResponse> compareProducts = products.stream().limit(limit).toList();
        String categoryName = compareProducts.get(0).getCategory() != null
                ? safe(compareProducts.get(0).getCategory().getName())
                : "cùng danh mục";

        StringBuilder sb = new StringBuilder();
        sb.append("Tôi sẽ so sánh ").append(compareProducts.size()).append(" sản phẩm thuộc danh mục ").append(categoryName).append(".\n\n");

        sb.append("1. So sánh nhanh\n");
        for (ProductResponse product : compareProducts) {
            sb.append("- ").append(safe(product.getName())).append("\n");
            if (product.getBrand() != null) {
                sb.append("  Thương hiệu: ").append(safe(product.getBrand().getName())).append("\n");
            }
            sb.append("  Giá bán: ").append(formatVnd(getMinPrice(product))).append("\n");

            Double compareAtPrice = getCompareAtPriceOfMinPriceVariant(product);
            if (compareAtPrice != null && compareAtPrice > getMinPrice(product)) {
                sb.append("  Giá gốc: ").append(formatVnd(compareAtPrice)).append("\n");
            }

            String shortDescription = safe(product.getShortDescription());
            if (!shortDescription.isBlank()) {
                sb.append("  Mô tả: ").append(shortDescription).append("\n");
            }

            appendSpecLine(sb, product, "Chip", "chip", "cpu", "vi xu ly", "bo xu ly");
            appendSpecLine(sb, product, "RAM", "ram");
            appendSpecLine(sb, product, "Bộ nhớ", "bo nho", "storage", "rom", "ssd");
            appendSpecLine(sb, product, "Màn hình", "man hinh", "display");
            appendSpecLine(sb, product, "Camera", "camera", "may anh");
            appendSpecLine(sb, product, "Pin", "pin", "battery");
            appendSpecLine(sb, product, "Hệ điều hành", "he dieu hanh", "os");
            sb.append("\n");
        }

        sb.append("2. Ưu điểm từng sản phẩm\n");
        for (ProductResponse product : compareProducts) {
            sb.append("- ").append(safe(product.getName())).append(": ")
                    .append(buildProductStrength(product))
                    .append("\n");
        }

        sb.append("\n3. Kết luận nên chọn\n");

        ProductResponse cheapest = compareProducts.stream()
                .min(Comparator.comparingDouble(this::getMinPrice))
                .orElse(compareProducts.get(0));

        ProductResponse gaming = compareProducts.stream()
                .max(Comparator.comparingInt(this::scoreForGamingNeed))
                .orElse(compareProducts.get(0));

        ProductResponse camera = compareProducts.stream()
                .max(Comparator.comparingInt(this::scoreForCameraNeed))
                .orElse(compareProducts.get(0));

        ProductResponse battery = compareProducts.stream()
                .max(Comparator.comparingInt(this::scoreForBatteryNeed))
                .orElse(compareProducts.get(0));

        ProductResponse value = compareProducts.stream()
                .max(Comparator.comparingDouble(this::scoreProductValue))
                .orElse(cheapest);

        sb.append("- Tiết kiệm chi phí: ").append(safe(cheapest.getName())).append(" vì có giá dễ tiếp cận nhất.\n");
        sb.append("- Chơi game/hiệu năng: ").append(safe(gaming.getName())).append(".\n");
        sb.append("- Chụp ảnh/quay video: ").append(safe(camera.getName())).append(".\n");
        sb.append("- Pin và dùng lâu: ").append(safe(battery.getName())).append(".\n");
        sb.append("- Đáng tiền tổng thể: ").append(safe(value.getName())).append(".\n");

        sb.append("\nNếu bạn ưu tiên giá tốt thì chọn ").append(safe(cheapest.getName())).append(".");
        if (!Objects.equals(cheapest.getId(), value.getId())) {
            sb.append(" Nếu có thể cố gắng thêm một chút, ").append(safe(value.getName())).append(" là lựa chọn đáng cân nhắc hơn về trải nghiệm tổng thể.");
        }

        return sb.toString();
    }

    private void appendSpecLine(StringBuilder sb, ProductResponse product, String label, String... keys) {
        String value = findSpecValue(product, keys);
        if (!value.isBlank()) {
            sb.append("  ").append(label).append(": ").append(value).append("\n");
        }
    }

    private String findSpecValue(ProductResponse product, String... keys) {
        Map<String, String> specs = parseSpecMap(safe(product.getSpecifications()));
        for (String key : keys) {
            String normalizedKey = normalizeText(key);
            for (Map.Entry<String, String> entry : specs.entrySet()) {
                String candidateKey = normalizeText(entry.getKey());
                if (candidateKey.equals(normalizedKey)
                        || candidateKey.contains(normalizedKey)
                        || normalizedKey.contains(candidateKey)) {
                    return entry.getValue();
                }
            }
        }
        return "";
    }

    private Map<String, String> parseSpecMap(String specifications) {
        Map<String, String> result = new LinkedHashMap<>();
        if (specifications == null || specifications.isBlank()) {
            return result;
        }

        Matcher matcher = Pattern.compile("\\\"([^\\\"]+)\\\"\\s*:\\s*\\\"?([^\\\",}]+)\\\"?").matcher(specifications);
        while (matcher.find()) {
            result.put(matcher.group(1).trim(), matcher.group(2).trim());
        }

        return result;
    }

    private String buildProductStrength(ProductResponse product) {
        List<String> strengths = new ArrayList<>();
        String all = getFullProductText(product);

        if (scoreForGamingNeed(product) >= 20) strengths.add("hiệu năng tốt");
        if (scoreForCameraNeed(product) >= 25) strengths.add("camera đáng chú ý");
        if (scoreForBatteryNeed(product) >= 15) strengths.add("pin tốt");
        if (all.contains("pro") || all.contains("ultra")) strengths.add("thuộc dòng cao cấp");
        if (getMinPrice(product) > 0) strengths.add("giá hiện tại " + formatVnd(getMinPrice(product)));

        if (strengths.isEmpty()) {
            String shortDescription = safe(product.getShortDescription());
            if (!shortDescription.isBlank()) return shortDescription;
            return "phù hợp nhu cầu sử dụng phổ thông";
        }

        return String.join(", ", strengths);
    }

    private double scoreProductValue(ProductResponse product) {
        double price = getMinPrice(product);
        int qualityScore = scoreForGamingNeed(product)
                + scoreForCameraNeed(product)
                + scoreForBatteryNeed(product);

        if (price <= 0) return qualityScore;

        return qualityScore * 1_000_000D / price;
    }

    private String formatVnd(double value) {
        if (value <= 0) return "chưa có giá";
        return String.format("%,.0f đ", value);
    }

    private String buildProductContext(List<ProductResponse> products, String color, int quantity, String intent, long budget, String normalizedMessage) {
        if (products == null || products.isEmpty()) {
            return "Không tìm thấy sản phẩm phù hợp trong hệ thống.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("INTENT: ").append(intent).append("\n");
        sb.append("MÀU KHÁCH YÊU CẦU: ").append(color == null ? "không có" : color).append("\n");
        sb.append("SỐ LƯỢNG KHÁCH YÊU CẦU: ").append(quantity).append("\n");
        if (budget > 0) {
            sb.append("NGÂN SÁCH KHÁCH ĐƯA RA: ").append(budget).append(" VND\n");
            sb.append("KHOẢNG GIÁ NÊN TƯ VẤN: khoảng ").append(Math.round(budget * 0.8)).append(" đến ").append(Math.round(budget * 1.2)).append(" VND\n");
            sb.append("Nếu sản phẩm cao hơn ngân sách nhưng đáng mua, hãy khích lệ nhẹ nhàng rằng khách có thể cố gắng thêm một chút.\n");
        }
        if ("COMPARE_PRODUCTS".equals(intent)) {
            boolean sameCategory = products.stream().map(this::categoryKey).distinct().count() == 1 && products.size() >= 2;
            sb.append("YÊU CẦU SO SÁNH: chỉ so sánh nếu sản phẩm cùng danh mục.\n");
            sb.append("CÁC SẢN PHẨM CÙNG DANH MỤC: ").append(sameCategory ? "có" : "không chắc chắn hoặc chưa đủ sản phẩm cùng danh mục").append("\n");
        }
        sb.append("TIN NHẮN ĐÃ CHUẨN HÓA: ").append(normalizedMessage).append("\n\n");

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
            sb.append("- Giá bán thấp nhất: ").append(extractPrice(p)).append("\n");
            sb.append("- Giá gốc tương ứng: ").append(extractCompareAtPrice(p)).append("\n");

            if (p.getVariants() != null && !p.getVariants().isEmpty()) {
                sb.append("- Biến thể: ");
                String variantText = p.getVariants().stream()
                        .map(v -> safe(v.getAttributes()) + " giá " + v.getPrice() + " tồn " + v.getStock())
                        .collect(Collectors.joining(" | "));
                sb.append(variantText).append("\n");
            }

            sb.append("\n");
        }

        return sb.toString();
    }

    private List<AiActionResponse> buildActions(String intent, List<ProductResponse> products, String color, int quantity) {
        if (!"ADD_TO_CART".equals(intent) || products == null || products.isEmpty()) {
            return List.of();
        }

        int productLimit = Math.max(1, Math.min(5, products.size()));

        return products.stream()
                .limit(productLimit)
                .map(product -> AiActionResponse.builder()
                        .type("ADD_TO_CART")
                        .productId(product.getId())
                        .productSlug(product.getSlug())
                        .quantity(quantity)
                        .color(color)
                        .note("Frontend có thể dùng productId, productSlug, quantity và color để thêm sản phẩm vào giỏ hàng.")
                        .build())
                .toList();
    }

    private String buildNoProductByCategoryReply(CategoryRequest requestedCategory, String normalizedMessage, long budget, List<ProductResponse> allProducts) {
        String label = requestedCategory.label() == null ? "danh mục này" : requestedCategory.label();

        if (!requestedCategory.known()) {
            String availableCategories = allProducts.stream()
                    .filter(p -> p.getCategory() != null)
                    .map(p -> safe(p.getCategory().getName()))
                    .filter(name -> !name.isBlank())
                    .distinct()
                    .limit(10)
                    .collect(Collectors.joining(", "));

            return "Hiện tại hệ thống chưa có danh mục \"" + label + "\".\n"
                    + "Bạn có thể chọn các danh mục đang có như: "
                    + (availableCategories.isBlank() ? "điện thoại, laptop, tai nghe, màn hình." : availableCategories + ".");
        }

        if (budget > 0) {
            if (isUnderBudgetQuery(normalizedMessage)) {
                return "Hiện tại tôi chưa tìm thấy sản phẩm thuộc danh mục " + label
                        + " có giá dưới " + String.format("%,d đ", budget) + ".\n"
                        + "Bạn có thể tăng khoảng giá hoặc thử danh mục/thương hiệu khác nhé.";
            }

            return "Hiện tại tôi chưa tìm thấy sản phẩm thuộc danh mục " + label
                    + " phù hợp với ngân sách khoảng " + String.format("%,d đ", budget) + ".\n"
                    + "Bạn có thể mô tả thêm nhu cầu hoặc thay đổi khoảng giá để tôi gợi ý chính xác hơn.";
        }

        return "Hiện tại tôi chưa tìm thấy sản phẩm thuộc danh mục " + label
                + " phù hợp với yêu cầu này. Bạn có thể nói rõ thêm thương hiệu, mức giá hoặc nhu cầu sử dụng nhé.";
    }

    private String buildFallbackReply(String intent, List<ProductResponse> products, String color, int quantity, String normalizedMessage, long budget) {
        if (products == null || products.isEmpty()) {
            if ("GENERAL".equals(intent)) {
                return "Tôi có thể hỗ trợ tìm sản phẩm, tư vấn theo ngân sách, so sánh sản phẩm hoặc thêm sản phẩm vào giỏ hàng. Bạn hãy thử nhập: điện thoại dưới 20 triệu, laptop ASUS, hoặc so sánh iPhone 16 và Samsung Galaxy S25.";
            }
            return "Tôi chưa tìm thấy sản phẩm phù hợp trong hệ thống. Bạn có thể mô tả rõ hơn nhu cầu, thương hiệu, danh mục hoặc khoảng giá mong muốn.";
        }

        ProductResponse top = products.get(0);
        String priceText = extractPrice(top) != null ? String.format("%,.0f đ", extractPrice(top)) : "chưa có giá";

        if ("COMPARE_PRODUCTS".equals(intent)) {
            if (products.size() < 2) {
                return "Tôi chưa tìm đủ sản phẩm để so sánh. Bạn hãy nhập rõ tên 2 hoặc 3 sản phẩm cùng danh mục nhé.";
            }
            boolean sameCategory = products.stream().map(this::categoryKey).distinct().count() == 1;
            if (!sameCategory) {
                return "Tôi chỉ nên so sánh các sản phẩm cùng danh mục để kết quả công bằng. Bạn hãy chọn 2 hoặc 3 sản phẩm cùng loại, ví dụ cùng là điện thoại hoặc cùng là laptop.";
            }
            String names = products.stream().map(ProductResponse::getName).collect(Collectors.joining(", "));
            return "Tôi có thể so sánh các sản phẩm cùng danh mục này: " + names + ". Bạn xem danh sách bên dưới, tôi sẽ dựa trên giá, mô tả và thông số để tư vấn mẫu phù hợp nhất.";
        }

        if ("BUDGET_SUGGESTION".equals(intent) && budget > 0) {
            boolean underBudget = isUnderBudgetQuery(normalizedMessage);
            boolean hasUpsell = products.stream().anyMatch(p -> getMinPrice(p) > budget);
            StringBuilder sb = new StringBuilder();

            CategoryRequest requestedCategory = detectRequestedCategory(normalizedMessage, products);
            String categoryPart = requestedCategory.mentioned() && requestedCategory.known()
                    ? " thuộc danh mục " + requestedCategory.label()
                    : "";

            if (underBudget) {
                sb.append("Với yêu cầu dưới ").append(String.format("%,d đ", budget)).append(categoryPart).append(", tôi đã ưu tiên các sản phẩm nằm trong tầm giá này.");
            } else {
                sb.append("Với ngân sách khoảng ").append(String.format("%,d đ", budget)).append(categoryPart).append(", tôi gợi ý một số sản phẩm phù hợp bên dưới.");
            }

            if (hasUpsell) {
                sb.append(" Có vài mẫu cao hơn ngân sách một chút, nếu bạn có thể cố gắng thêm thì rất đáng cân nhắc vì cấu hình và trải nghiệm sẽ tốt hơn.");
            }
            return sb.toString();
        }

        if ("PRODUCT_DETAIL".equals(intent)) {
            return "Tôi đã tìm thấy sản phẩm phù hợp là " + safe(top.getName())
                    + ". Giá hiện tại khoảng " + priceText
                    + ". Bạn có thể xem mô tả, giá bán và chi tiết ở danh sách bên dưới.";
        }

        if ("ADD_TO_CART".equals(intent)) {
            String names = products.stream()
                    .limit(Math.max(1, Math.min(5, products.size())))
                    .map(ProductResponse::getName)
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining(", "));

            StringBuilder sb = new StringBuilder();
            sb.append("Tôi đã tìm thấy sản phẩm bạn muốn thêm vào giỏ hàng: ")
                    .append(names)
                    .append(". Số lượng: ").append(quantity).append(".");
            if (color != null) {
                sb.append(" Màu bạn nhắc tới: ").append(color).append(".");
            }
            sb.append(" Tôi sẽ kiểm tra biến thể còn hàng trước khi thêm để tránh chọn sai màu/dung lượng/RAM.");
            return sb.toString();
        }

        if (containsAny(normalizedMessage, "iphone", "dien thoai", "samsung", "android", "oppo")) {
            return "Tôi đã tìm được một số điện thoại phù hợp với nhu cầu hoặc thương hiệu bạn hỏi. Bạn có thể xem các mẫu bên dưới.";
        }

        if (containsAny(normalizedMessage, "laptop", "macbook", "dell", "asus")) {
            return "Tôi đã tìm được một số laptop phù hợp với nhu cầu hoặc thương hiệu bạn hỏi. Bạn có thể xem các mẫu bên dưới.";
        }

        return "Tôi đã tìm được một số sản phẩm phù hợp với nhu cầu của bạn. Bạn có thể xem danh sách gợi ý bên dưới.";
    }

    private int normalizeCompareLimit(int compareLimit) {
        if (compareLimit >= 3) return 3;
        return 2;
    }

    private int extractRequestedProductCount(String message) {
        if (message == null || message.isBlank()) return 1;

        String cleaned = (" " + message + " ")
                .replace(" them vao gio hang ", " ")
                .replace(" them vao gio ", " ")
                .replace(" them gio hang ", " ")
                .replace(" cho vao gio ", " ")
                .replace(" mua ngay ", " ")
                .replace(" dat mua ", " ")
                .replace(" so luong ", " ")
                .replace(" 1 cai ", " ")
                .replace(" mot cai ", " ")
                .replace(" một cái ", " ")
                .replace(" 2 cai ", " ")
                .replace(" hai cai ", " ")
                .replace(" 3 cai ", " ")
                .replace(" ba cai ", " ")
                .replace(" voi ", " | ")
                .replace(" va ", " | ")
                .replace(" vs ", " | ")
                .replace(" voi lai ", " | ")
                .replace(",", " | ")
                .replace("/", " | ")
                .replace("&", " | ")
                .replaceAll("\\s+", " ")
                .trim();

        long parts = Pattern.compile("\\|")
                .splitAsStream(cleaned)
                .map(String::trim)
                .filter(part -> part.length() >= 3)
                .count();

        if (parts >= 3) return 3;
        if (parts >= 2) return 2;
        return 1;
    }

    private int extractCompareLimit(String message) {
        if (message == null || message.isBlank()) return 2;

        if (containsAny(message, "3 san pham", "ba san pham", "so sanh 3", "so sanh ba")) {
            return 3;
        }

        if (containsAny(message, "2 san pham", "hai san pham", "so sanh 2", "so sanh hai")) {
            return 2;
        }

        String cleaned = (" " + message + " ")
                .replace(" so sanh ", " ")
                .replace(" so san ", " ")
                .replace(" khac nhau ", " ")
                .replace(" nen chon giua ", " ")
                .replace(" chon giua ", " ")
                .replace(" giua ", " ")
                .replace(" voi ", " | ")
                .replace(" va ", " | ")
                .replace(" vs ", " | ")
                .replace(" voi lai ", " | ")
                .replace(",", " | ")
                .replace("/", " | ")
                .replace("&", " | ")
                .replaceAll("\\s+", " ")
                .trim();

        long parts = Pattern.compile("\\|")
                .splitAsStream(cleaned)
                .map(String::trim)
                .filter(part -> part.length() >= 3)
                .count();

        return parts >= 3 ? 3 : 2;
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

    private long extractBudget(String message) {
        if (message == null || message.isBlank()) return 0L;

        Matcher millionMatcher = Pattern.compile("\\b(\\d{1,3})(?:[\\.,](\\d{1,2}))?(?:\\s*)(trieu|tr|m|cu)\\b").matcher(message);
        if (millionMatcher.find()) {
            long whole = Long.parseLong(millionMatcher.group(1)) * 1_000_000L;
            String decimal = millionMatcher.group(2);
            if (decimal != null && !decimal.isBlank()) {
                whole += Long.parseLong(decimal) * (decimal.length() == 1 ? 100_000L : 10_000L);
            }
            return whole;
        }

        Matcher thousandMatcher = Pattern.compile("\\b(\\d{3,6})(?:\\s*)(ngan|k)\\b").matcher(message);
        if (thousandMatcher.find()) {
            return Long.parseLong(thousandMatcher.group(1)) * 1_000L;
        }

        Matcher rawNumberMatcher = Pattern.compile("\\b(\\d{7,11})\\b").matcher(message.replaceAll("\\s+", ""));
        if (rawNumberMatcher.find()) {
            return Long.parseLong(rawNumberMatcher.group(1));
        }

        return 0L;
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

    private String categoryKey(ProductResponse product) {
        if (product == null || product.getCategory() == null) return "unknown";
        String slug = safe(product.getCategory().getSlug());
        String name = safe(product.getCategory().getName());
        return !slug.isBlank() ? normalizeText(slug) : normalizeText(name);
    }

    private String normalizeAliases(String text) {
        if (text == null) return "";
        String padded = " " + text + " ";
        padded = padded
                .replace(" appo ", " oppo ")
                .replace(" opp ", " oppo ")
                .replace(" ip ", " iphone ")
                .replace(" sam sung ", " samsung " )
                .replace(" ap ple ", " apple " );
        return padded.replaceAll("\\s+", " " ).trim();
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
