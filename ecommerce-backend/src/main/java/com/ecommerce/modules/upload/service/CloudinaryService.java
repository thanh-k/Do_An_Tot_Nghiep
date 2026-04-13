package com.ecommerce.modules.upload.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    // Sửa dòng này từ:
    // public String uploadFile(MultipartFile file) throws IOException
    // Thành:
    public String uploadFile(MultipartFile file, String folderName) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap("folder", "ecommerce/" + folderName)); // Sử dụng folderName ở đây

        return uploadResult.get("url").toString();
    }

    // Thêm hàm này vào CloudinaryService.java
    public void deleteFile(String url) throws IOException {
        if (url == null || url.isEmpty())
            return;

        // 1. Trích xuất Public ID từ URL
        // URL có dạng: .../upload/v12345/ecommerce/categories/abcxyz.jpg
        // Chúng ta cần lấy: ecommerce/categories/abcxyz
        try {
            String publicId = url.substring(url.lastIndexOf("ecommerce/"), url.lastIndexOf("."));

            // 2. Gọi lệnh xóa
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            System.out.println("Lỗi xóa ảnh trên Cloudinary: " + e.getMessage());
        }
    }
}