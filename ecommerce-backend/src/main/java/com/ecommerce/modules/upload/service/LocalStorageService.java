package com.ecommerce.modules.upload.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class LocalStorageService {

    private static final Set<String> IMAGE_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif");
    private static final Set<String> VIDEO_EXTENSIONS = Set.of(".mp4", ".mov", ".m4v");
    private static final long MAX_PRODUCT_VIDEO_SIZE_BYTES = 80L * 1024L * 1024L;
    private static final double MAX_PRODUCT_VIDEO_DURATION_SECONDS = 90.0;

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
        validateProductVideo(file);
        return uploadFile(file, folderName);
    }

    private void validateProductVideo(MultipartFile file) throws IOException {
        validateFile(file);

        String ext = getExtension(file.getOriginalFilename());
        if (!VIDEO_EXTENSIONS.contains(ext)) {
            throw new IOException("File video không hợp lệ. Chỉ hỗ trợ MP4, MOV hoặc M4V");
        }

        if (file.getSize() > MAX_PRODUCT_VIDEO_SIZE_BYTES) {
            throw new IOException("Video mô tả sản phẩm không được vượt quá 80MB");
        }

        double duration = readMp4DurationSeconds(file);
        if (duration <= 0) {
            throw new IOException("Không đọc được thời lượng video. Vui lòng dùng video MP4/MOV/M4V chuẩn H.264");
        }

        if (duration > MAX_PRODUCT_VIDEO_DURATION_SECONDS) {
            throw new IOException("Video mô tả sản phẩm tối đa 1 phút 30 giây");
        }
    }

    private double readMp4DurationSeconds(MultipartFile file) throws IOException {
        try (ReadableByteChannel channel = Channels.newChannel(file.getInputStream())) {
            return findMvhdDuration(channel, file.getSize(), 0);
        }
    }

    private double findMvhdDuration(ReadableByteChannel channel, long limit, int depth) throws IOException {
        long position = 0;
        while (position + 8 <= limit) {
            ByteBuffer header = ByteBuffer.allocate(8).order(ByteOrder.BIG_ENDIAN);
            if (!readFully(channel, header)) return -1;
            header.flip();

            long size = Integer.toUnsignedLong(header.getInt());
            String type = readType(header);
            position += 8;
            long headerSize = 8;

            if (size == 1) {
                ByteBuffer largeSize = ByteBuffer.allocate(8).order(ByteOrder.BIG_ENDIAN);
                if (!readFully(channel, largeSize)) return -1;
                largeSize.flip();
                size = largeSize.getLong();
                position += 8;
                headerSize = 16;
            } else if (size == 0) {
                size = limit - position + headerSize;
            }

            long payloadSize = size - headerSize;
            if (payloadSize < 0) return -1;

            if ("mvhd".equals(type)) {
                return parseMvhdDuration(channel, payloadSize);
            }

            if (isContainerAtom(type) && depth < 4) {
                byte[] payload = readPayload(channel, payloadSize);
                double nestedDuration = findMvhdDuration(Channels.newChannel(new java.io.ByteArrayInputStream(payload)), payloadSize, depth + 1);
                if (nestedDuration > 0) return nestedDuration;
            } else {
                skipFully(channel, payloadSize);
            }

            position += payloadSize;
        }
        return -1;
    }

    private double parseMvhdDuration(ReadableByteChannel channel, long payloadSize) throws IOException {
        if (payloadSize < 20) {
            skipFully(channel, payloadSize);
            return -1;
        }

        byte[] payload = readPayload(channel, payloadSize);
        ByteBuffer buffer = ByteBuffer.wrap(payload).order(ByteOrder.BIG_ENDIAN);
        int version = Byte.toUnsignedInt(buffer.get());
        buffer.position(buffer.position() + 3);

        long timescale;
        long duration;
        if (version == 1) {
            if (payload.length < 32) return -1;
            buffer.position(20);
            timescale = Integer.toUnsignedLong(buffer.getInt());
            duration = buffer.getLong();
        } else {
            if (payload.length < 20) return -1;
            buffer.position(12);
            timescale = Integer.toUnsignedLong(buffer.getInt());
            duration = Integer.toUnsignedLong(buffer.getInt());
        }

        if (timescale <= 0 || duration <= 0) return -1;
        return duration / (double) timescale;
    }

    private boolean isContainerAtom(String type) {
        return Set.of("moov", "trak", "mdia", "minf", "stbl", "edts", "udta").contains(type);
    }

    private boolean readFully(ReadableByteChannel channel, ByteBuffer buffer) throws IOException {
        while (buffer.hasRemaining()) {
            if (channel.read(buffer) < 0) return false;
        }
        return true;
    }

    private String readType(ByteBuffer buffer) {
        byte[] typeBytes = new byte[4];
        buffer.get(typeBytes);
        return new String(typeBytes, java.nio.charset.StandardCharsets.US_ASCII);
    }

    private byte[] readPayload(ReadableByteChannel channel, long payloadSize) throws IOException {
        if (payloadSize > Integer.MAX_VALUE) {
            throw new IOException("File video quá lớn để xử lý");
        }
        ByteBuffer payload = ByteBuffer.allocate((int) payloadSize);
        if (!readFully(channel, payload)) {
            throw new IOException("Không thể đọc dữ liệu video");
        }
        return payload.array();
    }

    private void skipFully(ReadableByteChannel channel, long bytes) throws IOException {
        ByteBuffer buffer = ByteBuffer.allocate((int) Math.min(8192, Math.max(1, bytes)));
        long remaining = bytes;
        while (remaining > 0) {
            buffer.clear();
            buffer.limit((int) Math.min(buffer.capacity(), remaining));
            int read = channel.read(buffer);
            if (read < 0) break;
            remaining -= read;
        }
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
