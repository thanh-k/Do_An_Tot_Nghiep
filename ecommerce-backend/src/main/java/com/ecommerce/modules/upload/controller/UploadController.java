package com.ecommerce.modules.upload.controller;


import com.ecommerce.common.response.ApiResponse;
import com.ecommerce.modules.upload.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping("/image")
    public ApiResponse<String> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        // Gọi service để đẩy ảnh lên Cloudinary và lấy link URL về
        String url = cloudinaryService.uploadFile(file, "categories");

        return ApiResponse.<String>builder()
                .result(url)
                .build();
    }
}