package com.ecommerce.modules.brand.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.common.util.SlugUtil;
import com.ecommerce.entity.Brand;
import com.ecommerce.modules.brand.dto.request.BrandRequest;
import com.ecommerce.modules.brand.dto.response.BrandResponse;
import com.ecommerce.modules.brand.mapper.BrandMapper;
import com.ecommerce.modules.brand.repository.BrandRepository;
import com.ecommerce.modules.brand.service.BrandService;
import com.ecommerce.modules.upload.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.io.IOException;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService {

    private final CloudinaryService cloudinaryService;
    private final BrandRepository brandRepository;
    private final BrandMapper brandMapper;

    @Override
    @Transactional
    public BrandResponse create(BrandRequest request) {
        if (brandRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.BRAND_EXISTED);
        }
        Brand brand = brandMapper.toEntity(request);
        brand.setSlug(SlugUtil.makeSlug(request.getName()));
        return brandMapper.toResponse(brandRepository.save(brand));
    }

    @Override
    public List<BrandResponse> getAll() {
        return brandRepository.findAll().stream()
                .map(brandMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BrandResponse getById(Long id) {
        return brandRepository.findById(id)
                .map(brandMapper::toResponse)
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));
    }

    @Override
    @Transactional
    public BrandResponse update(Long id, BrandRequest request) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));

        brand.setName(request.getName());
        brand.setSlug(SlugUtil.makeSlug(request.getName()));
        brand.setDescription(request.getDescription());
        brand.setLogo(request.getLogo());

        return brandMapper.toResponse(brandRepository.save(brand));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));

        // 1. Kiểm tra tham chiếu sản phẩm(khi làm sản phẩm xong mới mở khóa)
        // Giả sử ní đã có ProductRepository
        // boolean hasProducts = productRepository.existsByBrandId(id);
        // if (hasProducts) {
        //     throw new AppException(ErrorCode.BRAND_HAS_PRODUCTS);
        // }
        // 1. Xóa ảnh trên Cloudinary trước
        try {
            cloudinaryService.deleteFile(brand.getLogo());
        } catch (IOException e) {
            System.err.println("Lỗi xóa logo thương hiệu: " + e.getMessage());
        }

        // 2. Xóa trong DB
        brandRepository.delete(brand);
    }

    @Override
    @Transactional
    public BrandResponse updateWithImage(Long id, BrandRequest request, MultipartFile file) throws IOException {
        // 1. Tìm Brand cũ
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));

        // 2. Cập nhật thông tin text và tạo lại Slug (nếu ní muốn slug nhảy theo tên
        // mới)
        brand.setName(request.getName());
        brand.setSlug(SlugUtil.makeSlug(request.getName()));
        brand.setDescription(request.getDescription());

        // 3. Xử lý ảnh logo
        if (file != null && !file.isEmpty()) {
            // Xóa logo cũ trên Cloudinary để đỡ rác
            if (brand.getLogo() != null) {
                cloudinaryService.deleteFile(brand.getLogo());
            }

            // Upload logo mới vào folder 'brands'
            String newLogoUrl = cloudinaryService.uploadFile(file, "brands");
            brand.setLogo(newLogoUrl);
        }

        return brandMapper.toResponse(brandRepository.save(brand));
    }

}