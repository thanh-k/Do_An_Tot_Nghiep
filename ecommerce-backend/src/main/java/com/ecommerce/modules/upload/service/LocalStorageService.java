package com.ecommerce.modules.upload.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class LocalStorageService {

    private static final Set<String> IMAGE_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif");
    private static final Set<String> VIDEO_EXTENSIONS = Set.of(".mp4", ".webm", ".mov", ".m4v");

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    /**
     * Hàm upload chung dùng cho các module cũ.
     * File được lưu local trong thư mục app.upload-dir/folderName và trả về URL /uploads/...
     */
    public String uploadFile(MultipartFile file, String folderName) throws IOException {
        validateFile(file);

        String safeFolder = normalizeFolder(folderName);
        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path folder = root.resolve(safeFolder).normalize();

        if (!folder.startsWith(root)) {
            throw new IOException("Thư mục upload không hợp lệ");
        }

        Files.createDirectories(folder);

        String ext = getExtension(file.getOriginalFilename());
        String fileName = UUID.randomUUID() + ext;

        Path filePath = folder.resolve(fileName).normalize();
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return normalizeBaseUrl() + "/uploads/" + safeFolder + "/" + fileName;
    }

    public String uploadImage(MultipartFile file, String folderName) throws IOException {
        String ext = getExtension(file == null ? null : file.getOriginalFilename());
        if (!IMAGE_EXTENSIONS.contains(ext)) {
            throw new IOException("File ảnh không hợp lệ. Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF");
        }
        return uploadFile(file, folderName);
    }

    public String uploadVideo(MultipartFile file, String folderName) throws IOException {
        String ext = getExtension(file == null ? null : file.getOriginalFilename());
        if (!VIDEO_EXTENSIONS.contains(ext)) {
            throw new IOException("File video không hợp lệ. Chỉ hỗ trợ MP4, WEBM, MOV hoặc M4V");
        }
        return uploadFile(file, folderName);
    }

    public void deleteFile(String url) {
        if (url == null || !url.contains("/uploads/")) return;
        try {
            String relativePath = url.substring(url.indexOf("/uploads/") + 9);
            Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = root.resolve(relativePath).normalize();
            if (filePath.startsWith(root)) {
                Files.deleteIfExists(filePath);
            }
        } catch (Exception e) {
            System.out.println("Lỗi xóa file local: " + e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File upload không được để trống");
        }
    }

    private String normalizeFolder(String folderName) {
        if (folderName == null || folderName.isBlank()) return "general";
        return folderName.replace("\\", "/")
                .replace("..", "")
                .replaceAll("^/+", "")
                .replaceAll("/+$", "");
    }

    private String normalizeBaseUrl() {
        if (baseUrl == null || baseUrl.isBlank()) return "";
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }
}
