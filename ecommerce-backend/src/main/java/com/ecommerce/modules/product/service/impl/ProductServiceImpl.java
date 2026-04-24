package com.ecommerce.modules.product.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.entity.*;
import com.ecommerce.modules.brand.dto.response.BrandResponse;
import com.ecommerce.modules.brand.repository.BrandRepository;
import com.ecommerce.modules.category.dto.response.CategoryResponse;
import com.ecommerce.modules.category.repository.CategoryRepository;
import com.ecommerce.modules.product.dto.request.ProductRequest;
import com.ecommerce.modules.product.dto.response.*;
import com.ecommerce.modules.product.repository.*;
import com.ecommerce.modules.product.service.ProductService;
import com.ecommerce.modules.product.service.ProductValidatorService;
import com.ecommerce.modules.upload.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
// import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

        private final ProductRepository productRepository;
        private final ProductVariantRepository variantRepository;
        private final ProductImageRepository imageRepository;
        private final CategoryRepository categoryRepository;
        private final BrandRepository brandRepository;
        private final ProductValidatorService productValidator;
        private final CloudinaryService cloudinaryService;

        @Override
        @Transactional(readOnly = true)
        public ProductResponse getProductBySlug(String slug) {
                Product product = productRepository.findBySlug(slug)
                                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
                return getProductResponse(product);
        }

        @Override
        @Transactional
        public ProductResponse createProduct(ProductRequest request) {
                productValidator.validate(request, null);

                Category category = categoryRepository.findById(request.getCategoryId())
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
                Brand brand = brandRepository.findById(request.getBrandId())
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

                Product product = mapRequestToEntity(request, new Product());
                product.setCategory(category);
                product.setBrand(brand);

                Product savedProduct = productRepository.save(product);
                saveVariantsAndImages(request, savedProduct);

                return getProductResponse(savedProduct);
        }

        @Override
        @Transactional
        public ProductResponse updateProduct(Long id, ProductRequest request) {
                Product existingProduct = productRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

                productValidator.validate(request, id);

                // --- XỬ LÝ XÓA ẢNH CŨ TRÊN CLOUDINARY THÔNG MINH ---
                // 1. Gom tất cả URL ảnh cũ đang có trên DB
                Set<String> oldImageUrls = new HashSet<>();
                if (existingProduct.getThumbnail() != null)
                        oldImageUrls.add(existingProduct.getThumbnail());
                if (existingProduct.getImages() != null) {
                        existingProduct.getImages().forEach(img -> {
                                if (img.getImageUrl() != null)
                                        oldImageUrls.add(img.getImageUrl());
                        });
                }
                if (existingProduct.getVariants() != null) {
                        existingProduct.getVariants().forEach(var -> {
                                if (var.getImage() != null)
                                        oldImageUrls.add(var.getImage());
                        });
                }

                // 2. Gom tất cả URL ảnh mới từ Request gửi lên
                Set<String> newImageUrls = new HashSet<>();
                if (request.getThumbnail() != null)
                        newImageUrls.add(request.getThumbnail());
                if (request.getImages() != null)
                        newImageUrls.addAll(request.getImages());
                if (request.getVariants() != null) {
                        request.getVariants().forEach(var -> {
                                if (var.getImage() != null)
                                        newImageUrls.add(var.getImage());
                        });
                }

                // 3. Xóa những ảnh có ở Cũ nhưng KHÔNG CÓ ở Mới
                for (String oldUrl : oldImageUrls) {
                        if (!newImageUrls.contains(oldUrl)) {
                                String publicId = extractPublicId(oldUrl);
                                if (publicId != null) {
                                        try {
                                                cloudinaryService.deleteFile(publicId);
                                        } catch (Exception ignored) {
                                        }
                                }
                        }
                }

                // --- CẬP NHẬT DATABASE ---
                mapRequestToEntity(request, existingProduct);

                Category category = categoryRepository.findById(request.getCategoryId())
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
                Brand brand = brandRepository.findById(request.getBrandId())
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

                existingProduct.setCategory(category);
                existingProduct.setBrand(brand);

                // FIX: Khi Entity Product có orphanRemoval = true, CHỈ CẦN gọi clear(), KHÔNG
                // dùng deleteAll()
                if (existingProduct.getVariants() != null) {
                        existingProduct.getVariants().clear();
                }
                if (existingProduct.getImages() != null) {
                        existingProduct.getImages().clear();
                }

                productRepository.saveAndFlush(existingProduct);

                saveVariantsAndImages(request, existingProduct);
                return getProductResponse(existingProduct);
        }

        @Override
        @Transactional
        public void deleteProduct(Long id) {
                Product product = productRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

                // Xóa tất cả ảnh liên quan trên Cloudinary
                cleanOldResources(product);

                productRepository.delete(product);
        }

        @Override
        @Transactional(readOnly = true)
        public List<ProductResponse> getAllProducts() {
                return productRepository.findAll().stream()
                                .map(this::getProductResponse)
                                .collect(Collectors.toList());
        }

        @Override
        @Transactional(readOnly = true) // FIX: Thêm dòng này để tránh lỗi LazyInitialization
        public ProductResponse getProductById(Long id) {
                Product product = productRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
                return getProductResponse(product);
        }

        // --- HELPER METHODS ---

        private void saveVariantsAndImages(ProductRequest request, Product product) {
                if (request.getVariants() != null) {
                        List<ProductVariant> variants = request.getVariants().stream()
                                        .map(vReq -> ProductVariant.builder()
                                                        .sku(vReq.getSku())
                                                        .price(vReq.getPrice())
                                                        .compareAtPrice(vReq.getCompareAtPrice())
                                                        .stock(vReq.getStock())
                                                        .attributes(vReq.getAttributes())
                                                        .image(vReq.getImage())
                                                        .product(product)
                                                        .build())
                                        .collect(Collectors.toList());
                        variants = variantRepository.saveAll(variants);

                        // FIX: Cập nhật Collection an toàn cho Hibernate để tránh lỗi "collection no
                        // longer referenced"
                        if (product.getVariants() == null) {
                                product.setVariants(new HashSet<>(variants));
                        } else {
                                product.getVariants().addAll(variants);
                        }
                } else {
                        if (product.getVariants() != null) {
                                product.getVariants().clear();
                        }
                }

                if (request.getImages() != null) {
                        List<ProductImage> images = request.getImages().stream().map(url -> ProductImage.builder()
                                        .imageUrl(url)
                                        .product(product)
                                        .build()).collect(Collectors.toList());
                        images = imageRepository.saveAll(images);

                        // FIX: Tương tự với danh sách Images
                        if (product.getImages() == null) {
                                product.setImages(new HashSet<>(images));
                        } else {
                                product.getImages().addAll(images);
                        }
                } else {
                        if (product.getImages() != null) {
                                product.getImages().clear();
                        }
                }
        }

        // Hàm helper để trích xuất publicId từ URL Cloudinary
        private String extractPublicId(String url) {
                if (url == null || !url.contains("cloudinary.com") || !url.contains("upload/"))
                        return null;
                try {
                        String[] parts = url.split("upload/");
                        if (parts.length < 2)
                                return null;
                        String afterUpload = parts[1];

                        // Bỏ qua version (vd: v1712345678)
                        if (afterUpload.matches("^v\\d+/.*")) {
                                afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
                        }

                        // FIX: KHÔNG cắt phần đuôi mở rộng (.jpg, .png) ở đây nữa!
                        // Vì hàm deleteFile trong CloudinaryService của bạn đã tự động cắt rồi.
                        // Nếu cắt ở đây sẽ làm CloudinaryService bị lỗi "out of bounds".

                        return afterUpload;
                } catch (Exception e) {
                        System.err.println("Lỗi trích xuất Public ID từ URL: " + url);
                        return null;
                }
        }

        private void cleanOldResources(Product product) {
                Set<String> publicIdsToDelete = new HashSet<>();

                if (product.getThumbnail() != null) {
                        String id = extractPublicId(product.getThumbnail());
                        if (id != null)
                                publicIdsToDelete.add(id);
                }
                if (product.getImages() != null) {
                        for (ProductImage img : product.getImages()) {
                                String id = extractPublicId(img.getImageUrl());
                                if (id != null)
                                        publicIdsToDelete.add(id);
                        }
                }
                if (product.getVariants() != null) {
                        for (ProductVariant var : product.getVariants()) {
                                String id = extractPublicId(var.getImage());
                                if (id != null)
                                        publicIdsToDelete.add(id);
                        }
                }

                for (String publicId : publicIdsToDelete) {
                        try {
                                cloudinaryService.deleteFile(publicId);
                        } catch (Exception e) {
                                System.err.println("Lỗi xóa ảnh Cloudinary ID " + publicId + ": " + e.getMessage());
                        }
                }
        }

        private Product mapRequestToEntity(ProductRequest request, Product product) {
                product.setName(request.getName());
                product.setSlug(request.getSlug());
                product.setShortDescription(request.getShortDescription());
                product.setDescription(request.getDescription());
                product.setSpecifications(request.getSpecifications());
                product.setThumbnail(request.getThumbnail());
                product.setIsFeatured(request.getIsFeatured());
                product.setIsNew(request.getIsNew());
                product.setIsSale(request.getIsSale());
                return product;
        }

        private ProductResponse getProductResponse(Product product) {
                if (product == null)
                        return null;

                try {
                        // Lấy các dữ liệu an toàn, kiểm tra null trước khi gọi method
                        Category category = product.getCategory();
                        Brand brand = product.getBrand();
                        List<ProductVariant> variants = new ArrayList<>(
                                        product.getVariants() != null ? product.getVariants() : new HashSet<>());
                        List<ProductImage> images = new ArrayList<>(
                                        product.getImages() != null ? product.getImages() : new HashSet<>());

                        return ProductResponse.builder()
                                        .id(product.getId())
                                        .name(product.getName())
                                        .slug(product.getSlug())
                                        .thumbnail(product.getThumbnail())
                                        .shortDescription(product.getShortDescription())
                                        .description(product.getDescription())
                                        .specifications(product.getSpecifications())
                                        .isFeatured(product.getIsFeatured())
                                        .isNew(product.getIsNew())
                                        .isSale(product.getIsSale())
                                        // Dùng toán tử 3 ngôi an toàn
                                        .category(category != null ? CategoryResponse.builder()
                                                        .id(category.getId())
                                                        .name(category.getName())
                                                        .build() : null)
                                        .brand(brand != null ? BrandResponse.builder()
                                                        .id(brand.getId())
                                                        .name(brand.getName())
                                                        .build() : null)
                                        // Stream an toàn
                                        .variants(variants.stream().map(v -> VariantResponse.builder()
                                                        .id(v.getId())
                                                        .sku(v.getSku())
                                                        .price(v.getPrice())
                                                        .compareAtPrice(v.getCompareAtPrice())
                                                        .stock(v.getStock())
                                                        .attributes(v.getAttributes())
                                                        .image(v.getImage())
                                                        .build()).collect(Collectors.toList()))
                                        .images(images.stream()
                                                        .map(ProductImage::getImageUrl)
                                                        .collect(Collectors.toList()))
                                        .build();

                } catch (Exception e) {
                        // NÍ NHÌN LOG NÀY Ở CONSOLE INTELLIJ KHI BỊ LỖI
                        System.err.println("LỖI XẢY RA TẠI GETPRODUCTRESPONSE: " + e.getMessage());
                        e.printStackTrace();
                        throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION); // Trả về lỗi để Frontend xử lý
                }
        }

}