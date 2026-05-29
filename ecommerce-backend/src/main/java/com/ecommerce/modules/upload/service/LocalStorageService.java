package com.ecommerce.modules.upload.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class LocalStorageService {

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.base-url:https://hitcinsight.id.vn}")
    private String baseUrl;

    public String uploadFile(MultipartFile file, String folderName) throws IOException {
        Path folder = Paths.get(uploadDir, folderName);
        Files.createDirectories(folder);

        String ext = getExtension(file.getOriginalFilename());
        String fileName = UUID.randomUUID() + ext;

        Path filePath = folder.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return baseUrl + "/uploads/" + folderName + "/" + fileName;
    }

    public void deleteFile(String url) {
        if (url == null || !url.contains("/uploads/")) return;
        try {
            String relativePath = url.substring(url.indexOf("/uploads/") + 9);
            Path filePath = Paths.get(uploadDir, relativePath);
            Files.deleteIfExists(filePath);
        } catch (Exception e) {
            System.out.println("Lỗi xóa file: " + e.getMessage());
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }
}