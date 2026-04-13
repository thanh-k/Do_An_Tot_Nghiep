package com.ecommerce.common.util;

// import java.text.Normalizer;
// import java.util.Locale;
// import java.util.regex.Pattern;

public class SlugUtil {
    // private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    // private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    public static String makeSlug(String input) {
        if (input == null || input.isEmpty())
            return "";

        // 1. Chuyển sang chữ thường
        String slug = input.toLowerCase().trim();

        // 2. Thay thế các ký tự tiếng Việt có dấu
        slug = slug.replaceAll("[áàảãạăắằẳẵặâấầẩẫậ]", "a");
        slug = slug.replaceAll("[éèẻẽẹêếềểễệ]", "e");
        slug = slug.replaceAll("[íìỉĩị]", "i");
        slug = slug.replaceAll("[óòỏõọôốồổỗộơớờởỡợ]", "o");
        slug = slug.replaceAll("[úùủũụưứừửữự]", "u");
        slug = slug.replaceAll("[ýỳỷỹỵ]", "y");
        slug = slug.replaceAll("đ", "d");

        // 3. Thay thế các ký tự đặc biệt và Khoảng trắng thành dấu gạch ngang
        slug = slug.replaceAll("[^a-z0-9\\s]", ""); // Xóa ký tự đặc biệt trừ khoảng trắng
        slug = slug.replaceAll("\\s+", "-"); // Thay khoảng trắng thành "-"

        // 4. Xóa các dấu gạch ngang thừa ở đầu và cuối
        slug = slug.replaceAll("^-+|-+$", "");

        return slug;
    }
}