package com.ecommerce.modules.compare_ai.mapper;

import com.ecommerce.entity.Product;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AiCompareMapper {

    public String buildPromptFromProducts(List<Product> products) {
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("Bạn là một chuyên gia đánh giá và tư vấn đồ công nghệ của hệ thống NovaShop. ");
        promptBuilder.append(
                "Nhiệm vụ của bạn là so sánh các sản phẩm sau đây và đưa ra lời khuyên mua sắm khách quan nhất. ");
        promptBuilder.append(
                "Hãy phân tích ngắn gọn, làm nổi bật điểm mạnh/yếu của từng thiết bị dựa trên cấu hình, và chỉ rõ thiết bị nào phù hợp với đối tượng người dùng nào. Trả lời bằng tiếng Việt, trình bày dưới định dạng Markdown trực quan, sử dụng in đậm, danh sách (bullet points) cho dễ nhìn.\n\n");

        for (int i = 0; i < products.size(); i++) {
            Product p = products.get(i);
            promptBuilder.append(String.format("### Sản phẩm %d: %s\n", i + 1, p.getName()));
            promptBuilder.append(String.format("- Thông số kỹ thuật (định dạng JSON): %s\n", p.getSpecifications()));
            promptBuilder.append("\n");
        }
        return promptBuilder.toString();
    }
}