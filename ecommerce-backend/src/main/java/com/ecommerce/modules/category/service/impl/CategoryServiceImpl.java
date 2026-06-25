package com.ecommerce.modules.category.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.common.util.SlugUtil;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.modules.category.dto.request.CategoryRequest;
import com.ecommerce.modules.category.dto.response.CategoryResponse;
import com.ecommerce.modules.category.mapper.CategoryMapper;
import com.ecommerce.modules.category.repository.CategoryRepository;
import com.ecommerce.modules.category.service.CategoryService;
import com.ecommerce.modules.order.repository.OrderDetailRepository;
import com.ecommerce.modules.product.repository.ProductRepository;
import com.ecommerce.modules.upload.service.LocalStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Lombok tự tạo constructor cho 3 biến final ở dưới
public class CategoryServiceImpl implements CategoryService {

    private final LocalStorageService localStorageService;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final CategoryMapper categoryMapper;

    @Override
    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_EXITED);
        }
        Category category = categoryMapper.toEntity(request);
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream()
                .map(categoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponse getById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        return categoryMapper.toResponse(category);
    }

    @Override
    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());

        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // 1. Kiểm tra sản phẩm liên kết
        List<Product> relatedProducts = productRepository.findByCategoryId(id);
        if (!relatedProducts.isEmpty()) {
            // Kiểm tra xem có sản phẩm nào có biến thể nằm trong đơn hàng không
            for (Product product : relatedProducts) {
                if (product.getVariants() != null) {
                    boolean hasOrders = product.getVariants().stream()
                            .anyMatch(variant -> orderDetailRepository.existsByProductVariant_Id(variant.getId()));
                    if (hasOrders) {
                        throw new AppException(ErrorCode.CATEGORY_PRODUCTS_IN_ORDER,
                                "Danh mục '" + category.getName() + "' không thể xóa vì có sản phẩm liên kết '"
                                        + product.getName() + "' đang có đơn hàng.");
                    }
                }
            }
            // Nếu sản phẩm chưa có đơn hàng, vẫn cấm xóa để giữ toàn vẹn khóa ngoại
            throw new AppException(ErrorCode.CATEGORY_HAS_PRODUCTS,
                    "Danh mục '" + category.getName() + "' không thể xóa vì đang có "
                            + relatedProducts.size() + " sản phẩm liên kết. Vui lòng chuyển hoặc xóa sản phẩm trước.");
        }

        // 2. Xóa ảnh icon
        try {
            localStorageService.deleteFile(category.getIcon());
        } catch (Exception e) {
            System.err.println("Lỗi xóa icon danh mục: " + e.getMessage());
        }
        // 3. Xóa danh mục
        categoryRepository.delete(category);
    }

    @Override
    @Transactional
    public CategoryResponse updateWithImage(Long id, CategoryRequest request, MultipartFile file) throws IOException {
        // 1. Tìm Category cũ
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // 2. Cập nhật thông tin text
        category.setName(request.getName());
        // LUÔN LUÔN tạo lại slug từ tên mới gửi lên
        category.setSlug(SlugUtil.makeSlug(request.getName()));
        category.setDescription(request.getDescription());

        // 3. Xử lý ảnh
        if (file != null && !file.isEmpty()) {
            // Xóa ảnh cũ trên Local Storage để tránh rác storage
            if (category.getIcon() != null) {
                localStorageService.deleteFile(category.getIcon());
            }

            // Upload ảnh mới lên folder 'categories'
            String newImageUrl = localStorageService.uploadFile(file, "categories");
            category.setIcon(newImageUrl);
        }

        // 4. Lưu và trả về kết quả
        return categoryMapper.toResponse(categoryRepository.save(category));
    }
}