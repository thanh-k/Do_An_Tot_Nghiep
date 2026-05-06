package com.ecommerce.modules.voucher.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.Voucher;
import com.ecommerce.modules.voucher.dto.request.VoucherRequest;
import com.ecommerce.modules.voucher.dto.response.VoucherResponse;
import com.ecommerce.modules.voucher.mapper.VoucherMapper;
import com.ecommerce.modules.voucher.repository.VoucherRepository;
import com.ecommerce.modules.voucher.service.VoucherService;
import com.ecommerce.modules.upload.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final VoucherMapper voucherMapper;
    private final CloudinaryService cloudinaryService;

    /**
     * Helper để trích xuất public ID từ URL của Cloudinary.
     * VD: https://res.cloudinary.com/.../upload/v123/ecommerce/vouchers/abc.jpg
     * -> Public ID là "ecommerce/vouchers/abc"
     */
    private String getPublicIdFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        int uploadIndex = url.indexOf("/upload/");
        if (uploadIndex == -1)
            return null;

        try {
            String path = url.substring(uploadIndex + "/upload/".length());

            // Dùng Regex để loại bỏ chuỗi version (vd: v1713000000/) một cách an toàn nếu
            // có
            path = path.replaceFirst("^v\\d+/", "");

            // Loại bỏ phần đuôi mở rộng (vd: .jpg, .png)
            int lastDotIndex = path.lastIndexOf(".");
            if (lastDotIndex != -1) {
                path = path.substring(0, lastDotIndex);
            }

            System.out.println("DEBUG - Đã trích xuất Public ID để xoá: " + path);
            return path;
        } catch (Exception e) {
            System.err.println("Lỗi khi parse Public ID từ URL: " + e.getMessage());
            return null;
        }
    }

    private void validateVoucherRequest(VoucherRequest request) {
        if (request.getCode() == null || request.getCode().trim().isEmpty() ||
                request.getCategory() == null || request.getCategory().trim().isEmpty() ||
                request.getDiscountType() == null || request.getDiscountType().trim().isEmpty() ||
                request.getDiscountValue() == null || request.getDiscountValue() <= 0 ||
                request.getMinOrderValue() == null || request.getMinOrderValue() < 0 ||
                request.getQuantity() == null || request.getQuantity() < 1 ||
                request.getExpiryDate() == null) {
            throw new AppException(ErrorCode.INVALID_VOUCHER_DATA);
        }
        if (request.getImage() == null || request.getImage().trim().isEmpty()) {
            throw new AppException(ErrorCode.VOUCHER_IMAGE_REQUIRED);
        }
    }

    @Override
    public VoucherResponse createVoucher(VoucherRequest request) {
        validateVoucherRequest(request);
        return voucherMapper.toResponse(voucherRepository.save(voucherMapper.toEntity(request)));
    }

    @Override
    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAll().stream().map(voucherMapper::toResponse).toList();
    }

    @Override
    public VoucherResponse updateVoucher(Long id, VoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        String oldImageUrl = voucher.getImage();
        String newImageUrl = request.getImage();

        // Nếu ảnh bị thay đổi, tiến hành xoá ảnh cũ trên Cloudinary
        if (newImageUrl != null && !newImageUrl.equals(oldImageUrl) && oldImageUrl != null && !oldImageUrl.isEmpty()) {
            try {
                String publicId = getPublicIdFromUrl(oldImageUrl);
                if (publicId != null) {
                    cloudinaryService.deleteFile(publicId);
                }
            } catch (Exception e) {
                System.err.println("Lỗi khi xoá ảnh voucher cũ trên Cloudinary: " + e.getMessage());
                // Không chặn việc update, chỉ log lỗi
            }
        }

        validateVoucherRequest(request);
        voucher.setCode(request.getCode());
        voucher.setCategory(request.getCategory());
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMinOrderValue(request.getMinOrderValue());
        voucher.setQuantity(request.getQuantity());
        voucher.setExpiryDate(request.getExpiryDate());
        if (request.getActive() != null) {
            voucher.setActive(request.getActive());
        }
        voucher.setImage(request.getImage());
        return voucherMapper.toResponse(voucherRepository.save(voucher));
    }

    @Override
    public void deleteVoucher(Long id) {
        // 1. Tìm voucher để lấy URL ảnh trước khi xoá
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        String imageUrl = voucher.getImage();

        // 2. Xoá voucher trong database
        voucherRepository.delete(voucher);

        // 3. Nếu voucher có ảnh, tiến hành xoá trên Cloudinary
        if (imageUrl != null && !imageUrl.isEmpty()) {
            try {
                String publicId = getPublicIdFromUrl(imageUrl);
                cloudinaryService.deleteFile(publicId);
            } catch (Exception e) {
                System.err.println("Đã xoá voucher trong DB, nhưng lỗi xoá ảnh trên Cloudinary: " + e.getMessage());
            }
        }
    }

    @Override
    public Double calculateDiscount(String code, Double orderTotal) {
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        // Validate
        if (!voucher.getActive() || voucher.getQuantity() <= 0
                || voucher.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VOUCHER_INVALID);
        }
        if (orderTotal < voucher.getMinOrderValue()) {
            throw new AppException(ErrorCode.VOUCHER_MIN_ORDER_NOT_MET);
        }

        // Tính toán
        if ("PERCENT".equalsIgnoreCase(voucher.getDiscountType())) {
            return orderTotal * (voucher.getDiscountValue() / 100);
        } else {
            return voucher.getDiscountValue(); // FIXED amount
        }
    }

    @Override
    public void decrementQuantity(String code) {
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));
        if (voucher.getQuantity() > 0) {
            voucher.setQuantity(voucher.getQuantity() - 1);
            voucherRepository.save(voucher);
        }
    }
}