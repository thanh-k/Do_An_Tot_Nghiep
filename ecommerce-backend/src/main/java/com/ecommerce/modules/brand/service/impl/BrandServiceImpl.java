package com.ecommerce.modules.brand.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.common.util.SlugUtil;
import com.ecommerce.entity.Brand;
import com.ecommerce.entity.Product;
import com.ecommerce.modules.brand.dto.request.BrandRequest;
import com.ecommerce.modules.brand.dto.response.BrandResponse;
import com.ecommerce.modules.product.repository.ProductRepository;
import com.ecommerce.modules.order.repository.OrderDetailRepository;
import com.ecommerce.modules.brand.mapper.BrandMapper;
import com.ecommerce.modules.brand.repository.BrandRepository;
import com.ecommerce.modules.brand.service.BrandService;
import com.ecommerce.modules.upload.service.LocalStorageService;
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

    private final LocalStorageService localStorageService;
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository; // Inject ProductRepository
    private final OrderDetailRepository orderDetailRepository; // Inject OrderDetailRepository
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

        // 1. Kiểm tra sản phẩm liên kết
        List<Product> relatedProducts = productRepository.findByBrandId(id);
        if (!relatedProducts.isEmpty()) {
            // Kiểm tra xem có sản phẩm nào có biến thể nằm trong đơn hàng
            for (Product product : relatedProducts) {
                if (product.getVariants() != null) {
                    boolean hasOrders = product.getVariants().stream()
                            .anyMatch(variant -> orderDetailRepository.existsByProductVariant_Id(variant.getId()));
                    if (hasOrders) {
                        throw new AppException(ErrorCode.BRAND_PRODUCTS_IN_ORDER,
                                "Thương hiệu '" + brand.getName() + "' không thể xóa vì có sản phẩm liên kết '"
                                        + product.getName() + "' đang nằm trong đơn hàng.");
                    }
                }
            }
            // Nếu sản phẩm chưa có đơn hàng, vẫn cấm xóa để giữ toàn vẹn khóa ngoại
            throw new AppException(ErrorCode.BRAND_HAS_PRODUCTS,
                    "Thương hiệu '" + brand.getName() + "' không thể xóa vì đang có "
                            + relatedProducts.size() + " sản phẩm liên kết. Vui lòng chuyển hoặc xóa sản phẩm trước.");
        }

        // 2. Xóa ảnh logo
        try {
            localStorageService.deleteFile(brand.getLogo());
        } catch (Exception e) {
            System.err.println("Lỗi xóa logo thương hiệu: " + e.getMessage());
        }
        // 3. Xóa thương hiệu
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
            // Xóa logo cũ trên Local Storage để đỡ rác
            if (brand.getLogo() != null) {
                localStorageService.deleteFile(brand.getLogo());
            }

            // Upload logo mới vào folder 'brands'
            String newLogoUrl = localStorageService.uploadFile(file, "brands");
            brand.setLogo(newLogoUrl);
        }

        return brandMapper.toResponse(brandRepository.save(brand));
    }

}