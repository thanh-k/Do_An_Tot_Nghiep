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

    @Override
    public AiChatResponse chat(String message) {
        String rawMessage = message == null ? "" : message.trim();
        String normalizedMessage = normalizeAliases(normalizeText(rawMessage));
        long budget = extractBudget(normalizedMessage);
        String intent = detectIntent(normalizedMessage, budget);
        String color = extractColor(normalizedMessage);
        int quantity = extractQuantity(normalizedMessage);
        int compareLimit = extractCompareLimit(normalizedMessage);

        List<ProductResponse> allProducts = productService.getAllProducts();
        List<ProductResponse> candidateProducts = findCandidateProducts(normalizedMessage, intent, color, budget, compareLimit, allProducts);
        List<AiProductSuggestionResponse> suggestions = mapSuggestions(candidateProducts);

        if ("COMPARE_PRODUCTS".equals(intent)) {
            String compareReply = buildCompareReply(candidateProducts, compareLimit);
            return AiChatResponse.builder()
                    .reply(compareReply)
                    .intent(intent)
                    .suggestedProducts(suggestions)
                    .action(null)
                    .build();
        }

        String productContext = buildProductContext(candidateProducts, color, quantity, intent, budget, normalizedMessage);

        String reply = geminiService.generateCustomerSupportReply(SYSTEM_PROMPT, rawMessage, productContext);
        if (isAiUnavailableReply(reply)) {
            reply = buildFallbackReply(intent, candidateProducts, color, quantity, normalizedMessage, budget);
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

    private String detectIntent(String message, long budget) {
        if (containsAny(message, "so sanh", "so san", "khac nhau", "nen chon giua", "chon giua", "giua", "dau hon", "hon kem")) {
            return "COMPARE_PRODUCTS";
        }

        if (budget > 0 || containsAny(message, "ngan sach", "tam tien", "so tien", "toi co", "dang co", "khoang", "duoi", "tren", "tu van theo tien")) {
            return "BUDGET_SUGGESTION";
        }

        if (containsAny(message, "them vao gio", "them gio hang", "mua ngay", "cho vao gio", "dat mua")) {
            return "ADD_TO_CART";
        }

        if (containsAny(message, "chi tiet", "mo ta", "thong tin", "gia bao nhieu", "co gi", "cau hinh", "thong so")) {
            return "PRODUCT_DETAIL";
        }

        if (containsAny(message, "goi y", "tu van", "nen mua", "chon giup", "tim giup", "co nhung gi", "co cac", "san pham cua", "hang", "thuong hieu")) {
            return "PRODUCT_SUGGESTION";
        }

        return "GENERAL";
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
                    .limit(8)
                    .toList();
        }

        return products.stream().limit(4).toList();
    }

    private List<ProductResponse> findProductsByBudget(String message, String color, long budget, List<ProductResponse> products) {
        double min = budget * 0.8;
        double max = budget * 1.2;
        double upsellMax = budget * 1.35;

        List<ProductResponse> inRange = products.stream()
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

        if (inRange.size() >= 4) return inRange;

        List<ProductResponse> upsell = products.stream()
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

        return products.stream()
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

        if (containsAny(message, "dien thoai", "iphone", "samsung", "android", "oppo", "xiaomi", "vivo", "realme")) {
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

    private String buildFallbackReply(String intent, List<ProductResponse> products, String color, int quantity, String normalizedMessage, long budget) {
        if (products == null || products.isEmpty()) {
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
            boolean hasUpsell = products.stream().anyMatch(p -> getMinPrice(p) > budget);
            StringBuilder sb = new StringBuilder();
            sb.append("Với ngân sách khoảng ").append(String.format("%,d đ", budget)).append(", tôi gợi ý một số sản phẩm phù hợp bên dưới.");
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
            StringBuilder sb = new StringBuilder();
            sb.append("Tôi đã xác định được sản phẩm phù hợp để thêm vào giỏ hàng: ")
                    .append(safe(top.getName()));
            if (color != null) {
                sb.append(" (màu ").append(color).append(")");
            }
            sb.append(", số lượng ").append(quantity).append(".");
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

        Matcher millionMatcher = Pattern.compile("\\b(\\d{1,3})(?:\\s*)(trieu|tr|m)\\b").matcher(message);
        if (millionMatcher.find()) {
            return Long.parseLong(millionMatcher.group(1)) * 1_000_000L;
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
