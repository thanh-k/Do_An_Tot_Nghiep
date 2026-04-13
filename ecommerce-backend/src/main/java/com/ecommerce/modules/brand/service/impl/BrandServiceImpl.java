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
        if (!brandRepository.existsById(id)) {
            throw new AppException(ErrorCode.BRAND_NOT_FOUND);
        }
        brandRepository.deleteById(id);
    }

    // Thêm mã này vào trong class BrandServiceImpl
    @Override
    @Transactional
    public BrandResponse updateWithImage(Long id, BrandRequest request, MultipartFile file) throws IOException {
        // 1. Tìm Brand cũ, không thấy thì báo lỗi
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));

        // 2. Cập nhật các thông tin cơ bản
        brand.setName(request.getName());
        brand.setSlug(SlugUtil.makeSlug(request.getName()));
        brand.setDescription(request.getDescription());

        // 3. Nếu có file ảnh mới thì mới upload
        if (file != null && !file.isEmpty()) {
            // Gọi CloudinaryService đã tiêm vào thông qua Constructor (hoặc bạn tự tiêm
            // thêm vào)
            // Lưu ý: Đảm bảo bạn đã khai báo private final CloudinaryService
            // cloudinaryService; ở đầu class này
            // String imageUrl = cloudinaryService.uploadFile(file, "brands");
            // brand.setLogo(imageUrl);
        }

        return brandMapper.toResponse(brandRepository.save(brand));
    }

}