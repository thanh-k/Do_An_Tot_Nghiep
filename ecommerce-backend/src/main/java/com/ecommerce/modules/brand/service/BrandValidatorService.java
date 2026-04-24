package com.ecommerce.modules.brand.service;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.modules.brand.dto.request.BrandRequest;

import com.ecommerce.modules.brand.repository.BrandRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.util.Arrays;
import java.util.List;

@Component // Đánh dấu để Spring Boot quản lý và cho phép Inject vào Controller
public class BrandValidatorService {

    private final BrandRepository brandRepository;
    // Danh sách các định dạng ảnh cho phép
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList("image/jpeg", "image/png", "image/webp",
            "image/jpg");
    // Dung lượng tối đa (2MB)
    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024;

    BrandValidatorService(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    public void validate(BrandRequest request, MultipartFile file, Long currentId) {
        // 1. Validate các trường Text (Dữ liệu từ BrandRequest)
        if (request.getName() == null || request.getName().trim().length() < 2
                || request.getName().trim().length() > 50) {
            throw new AppException(ErrorCode.INVALID_BRAND_NAME);
        }

        // --- 2. LOGIC KIỂM TRA TRÙNG TÊN (MỚI THÊM) ---
        brandRepository.findByName(request.getName()).ifPresent(existingBrand -> {
            // Nếu là tạo mới (currentId == null) mà đã thấy tên tồn tại
            // HOẶC là cập nhật mà tên trùng với một Brand khác (ID khác nhau)
            if (currentId == null || !existingBrand.getId().equals(currentId)) {
                throw new AppException(ErrorCode.BRAND_EXISTED);
            }
        });
        // 2. Validate File ảnh (Nếu người dùng có gửi file)
        if (file != null && !file.isEmpty()) {
            // Kiểm tra định dạng
            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
                throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
            }

            // Kiểm tra dung lượng
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new AppException(ErrorCode.FILE_TOO_LARGE);
            }
        }

        // có thể thêm logic kiểm tra khác ở đây, ví dụ:
        // Check xem mô tả có chứa từ cấm không...
    }
}