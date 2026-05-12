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
import com.ecommerce.modules.order.repository.OrderDetailRepository;
import com.ecommerce.modules.product.service.ProductService;
import com.ecommerce.modules.product.service.ProductValidatorService;
import com.ecommerce.modules.review.repository.ProductReviewRepository;
import com.ecommerce.modules.upload.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
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
        private final ProductReviewRepository productReviewRepository;
        private final OrderDetailRepository orderDetailRepository;

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

                Set<String> oldImageUrls = new HashSet<>();
                if (existingProduct.getThumbnail() != null) {
                        oldImageUrls.add(existingProduct.getThumbnail());
                }
                if (existingProduct.getImages() != null) {
                        existingProduct.getImages().forEach(img -> {
                                if (img.getImageUrl() != null) {
                                        oldImageUrls.add(img.getImageUrl());
                                }
                        });
                }
                if (existingProduct.getVariants() != null) {
                        existingProduct.getVariants().forEach(var -> {
                                if (var.getImage() != null) {
                                        oldImageUrls.add(var.getImage());
                                }
                        });
                }

                Set<String> newImageUrls = new HashSet<>();
                if (request.getThumbnail() != null) {
                        newImageUrls.add(request.getThumbnail());
                }
                if (request.getImages() != null) {
                        newImageUrls.addAll(request.getImages());
                }
                if (request.getVariants() != null) {
                        request.getVariants().forEach(var -> {
                                if (var.getImage() != null) {
                                        newImageUrls.add(var.getImage());
                                }
                        });
                }

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

                mapRequestToEntity(request, existingProduct);

                Category category = categoryRepository.findById(request.getCategoryId())
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
                Brand brand = brandRepository.findById(request.getBrandId())
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

                existingProduct.setCategory(category);
                existingProduct.setBrand(brand);

                if (existingProduct.getImages() != null) {
                        existingProduct.getImages().clear();
                }

                productRepository.saveAndFlush(existingProduct);

                // Cập nhật biến thể thông minh và chỉ lưu lại ảnh chung của sản phẩm
                updateProductVariantsSmart(request, existingProduct);
                saveOnlyImages(request, existingProduct);

                return getProductResponse(existingProduct);
        }

        @Override
        @Transactional
        public void deleteProduct(Long id) {
                Product product = productRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

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
        @Transactional(readOnly = true)
        public ProductResponse getProductById(Long id) {
                Product product = productRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
                return getProductResponse(product);
        }

        // --- LOGIC MỚI: CẬP NHẬT BIẾN THỂ THÔNG MINH ---
        private void updateProductVariantsSmart(ProductRequest request, Product product) {
                if (request.getVariants() == null)
                        return;

                // 1. Tạo Map tra cứu nhanh các biến thể cũ theo ID
                Map<Long, ProductVariant> existingVariantsMap = product.getVariants().stream()
                                .collect(Collectors.toMap(ProductVariant::getId, Function.identity()));

                Set<Long> incomingVariantIds = new HashSet<>();
                List<ProductVariant> variantsToSave = new ArrayList<>();
                List<ProductVariant> onlyNewVariants = new ArrayList<>(); // Chỉ chứa biến thể mới tinh

                // 2. Xử lý Update biến thể cũ và Insert biến thể mới
                for (var vReq : request.getVariants()) {
                        // Giả định VariantRequest của bạn đã có hàm getId() (kiểu Long)
                        if (vReq.getId() != null && existingVariantsMap.containsKey(vReq.getId())) {
                                ProductVariant existingVariant = existingVariantsMap.get(vReq.getId());
                                incomingVariantIds.add(vReq.getId());
                                
                                boolean isUsedInOrder = orderDetailRepository.existsByProductVariant_Id(existingVariant.getId());
                                
                                // Kiểm tra xem thông số nhận diện (Thuộc tính) hoặc SKU có bị thay đổi không
                                boolean isAttributeChanged = !java.util.Objects.equals(existingVariant.getAttributes(), vReq.getAttributes());
                                boolean isSkuChanged = !java.util.Objects.equals(existingVariant.getSku(), vReq.getSku());

                                if (isUsedInOrder && (isAttributeChanged || isSkuChanged)) {
                                        // TH2: Biến thể đã có người mua VÀ bị thay đổi thông số/SKU
                                        // 1. Giữ nguyên thông số cũ, chuyển stock = 0 để làm lịch sử
                                        existingVariant.setStock(0);
                                        variantsToSave.add(existingVariant);
                                        
                                        // 2. Tạo một biến thể mới hoàn toàn với thông số mới
                                        ProductVariant newVariant = ProductVariant.builder()
                                                        .sku(vReq.getSku())
                                                        .price(vReq.getPrice())
                                                        .compareAtPrice(vReq.getCompareAtPrice())
                                                        .stock(vReq.getStock())
                                                        .attributes(vReq.getAttributes())
                                                        .image(vReq.getImage())
                                                        .product(product)
                                                        .build();
                                        variantsToSave.add(newVariant);
                                        onlyNewVariants.add(newVariant);
                                } else {
                                        // TH1 & TH3: Chỉ thay đổi giá, kho, hình ảnh HOẶC chưa từng có người mua
                                        // -> Cập nhật trực tiếp đè lên biến thể cũ
                                        existingVariant.setSku(vReq.getSku());
                                        existingVariant.setPrice(vReq.getPrice());
                                        existingVariant.setCompareAtPrice(vReq.getCompareAtPrice());
                                        existingVariant.setStock(vReq.getStock());
                                        existingVariant.setAttributes(vReq.getAttributes());
                                        existingVariant.setImage(vReq.getImage());
                                        variantsToSave.add(existingVariant);
                                }
                        } else {
                                // INSERT MỚI
                                ProductVariant newVariant = ProductVariant.builder()
                                                .sku(vReq.getSku())
                                                .price(vReq.getPrice())
                                                .compareAtPrice(vReq.getCompareAtPrice())
                                                .stock(vReq.getStock())
                                                .attributes(vReq.getAttributes())
                                                .image(vReq.getImage())
                                                .product(product)
                                                .build();
                                variantsToSave.add(newVariant);
                                onlyNewVariants.add(newVariant); // Đánh dấu đây là biến thể mới
                        }
                }

                // 3. Xử lý XÓA / VÔ HIỆU HÓA các biến thể bị bỏ đi trên UI
                List<ProductVariant> variantsToRemove = new ArrayList<>();
                for (ProductVariant existingVariant : product.getVariants()) {
                        if (!incomingVariantIds.contains(existingVariant.getId())) {
                                boolean isUsedInOrder = orderDetailRepository
                                                .existsByProductVariant_Id(existingVariant.getId());
                                if (isUsedInOrder) {
                                        // Có đơn hàng -> Chuyển tồn kho = 0 (Hoặc nếu có trường isActive thì isActive =
                                        // false)
                                        existingVariant.setStock(0);
                                        variantsToSave.add(existingVariant);
                                } else {
                                        // Chưa ai mua -> Xóa hoàn toàn
                                        variantsToRemove.add(existingVariant);
                                }
                        }
                }

                product.getVariants().removeAll(variantsToRemove);
                variantRepository.saveAll(variantsToSave);

                if (product.getVariants() == null) {
                        product.setVariants(new HashSet<>(onlyNewVariants));
                } else {
                        // CHỈ add thêm các biến thể mới vào Product (tránh lỗi duplicate entity của
                        // Hibernate)
                        product.getVariants().addAll(onlyNewVariants);
                }
        }

        // Hàm phụ trợ để lưu ảnh khi Update (tách ra từ saveVariantsAndImages cũ)
        private void saveOnlyImages(ProductRequest request, Product product) {
                if (request.getImages() != null) {
                        List<ProductImage> images = request.getImages().stream()
                                        .map(url -> ProductImage.builder().imageUrl(url).product(product).build())
                                        .collect(Collectors.toList());
                        images = imageRepository.saveAll(images);
                        if (product.getImages() == null) {
                                product.setImages(new HashSet<>(images));
                        } else {
                                product.getImages().addAll(images);
                        }
                }
        }

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
                        List<ProductImage> images = request.getImages().stream()
                                        .map(url -> ProductImage.builder()
                                                        .imageUrl(url)
                                                        .product(product)
                                                        .build())
                                        .collect(Collectors.toList());
                        images = imageRepository.saveAll(images);

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

        private String extractPublicId(String url) {
                if (url == null || !url.contains("cloudinary.com") || !url.contains("upload/")) {
                        return null;
                }
                try {
                        String[] parts = url.split("upload/");
                        if (parts.length < 2) {
                                return null;
                        }
                        String afterUpload = parts[1];

                        if (afterUpload.matches("^v\\d+/.*")) {
                                afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
                        }

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
                        if (id != null) {
                                publicIdsToDelete.add(id);
                        }
                }
                if (product.getImages() != null) {
                        for (ProductImage img : product.getImages()) {
                                String id = extractPublicId(img.getImageUrl());
                                if (id != null) {
                                        publicIdsToDelete.add(id);
                                }
                        }
                }
                if (product.getVariants() != null) {
                        for (ProductVariant var : product.getVariants()) {
                                String id = extractPublicId(var.getImage());
                                if (id != null) {
                                        publicIdsToDelete.add(id);
                                }
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
                if (product == null) {
                        return null;
                }

                try {
                        Category category = product.getCategory();
                        Brand brand = product.getBrand();
                        List<ProductVariant> variants = new ArrayList<>(
                                        product.getVariants() != null ? product.getVariants() : new HashSet<>());
                        List<ProductImage> images = new ArrayList<>(
                                        product.getImages() != null ? product.getImages() : new HashSet<>());

                        List<ProductReview> reviews = productReviewRepository
                                        .findByProductIdAndIsVisibleTrueOrderByCreatedAtDesc(product.getId());
                        double averageRating = reviews.isEmpty()
                                        ? 0.0
                                        : reviews.stream().mapToInt(ProductReview::getRating).average().orElse(0.0);
                        long reviewCount = reviews.size();

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
                                        .rating(Math.round(averageRating * 10.0) / 10.0)
                                        .reviewCount(reviewCount)
                                        .category(category != null
                                                        ? CategoryResponse.builder()
                                                                        .id(category.getId())
                                                                        .name(category.getName())
                                                                        .build()
                                                        : null)
                                        .brand(brand != null
                                                        ? BrandResponse.builder()
                                                                        .id(brand.getId())
                                                                        .name(brand.getName())
                                                                        .build()
                                                        : null)
                                        .variants(variants.stream()
                                                        .map(v -> VariantResponse.builder()
                                                                        .id(v.getId())
                                                                        .sku(v.getSku())
                                                                        .price(v.getPrice())
                                                                        .compareAtPrice(v.getCompareAtPrice())
                                                                        .stock(v.getStock())
                                                                        .attributes(v.getAttributes())
                                                                        .image(v.getImage())
                                                                        .hasOrders(orderDetailRepository.existsByProductVariant_Id(v.getId()))
                                                                        .build())
                                                        .collect(Collectors.toList()))
                                        .images(images.stream()
                                                        .map(ProductImage::getImageUrl)
                                                        .collect(Collectors.toList()))
                                        .build();

                } catch (Exception e) {
                        System.err.println("LỖI XẢY RA TẠI GETPRODUCTRESPONSE: " + e.getMessage());
                        e.printStackTrace();
                        throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
                }
        }
}