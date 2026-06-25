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
import com.ecommerce.modules.upload.service.LocalStorageService;
import com.ecommerce.service.VisionServiceClient;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

        private final ProductRepository productRepository;
        private final ProductVariantRepository variantRepository;
        private final ProductImageRepository imageRepository;
        private final CategoryRepository categoryRepository;
        private final BrandRepository brandRepository;
        private final ProductValidatorService productValidator;
        private final LocalStorageService localStorageService;
        private final ProductReviewRepository productReviewRepository;
        private final OrderDetailRepository orderDetailRepository;
        private final VisionServiceClient visionServiceClient;
        private final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public Page<ProductResponse> getProductsWithFilter(
                        String keyword, Long categoryId, List<String> brands,
                        Double minPrice, Double maxPrice, Boolean inStock,
                        int page, int size, String sortBy) {

                // 1. Xử lý Sắp xếp (Sort)
                Sort sort = Sort.by(Sort.Direction.DESC, "id"); // Mặc định là mới nhất

                if (sortBy != null) {
                        switch (sortBy) {
                                case "price-asc":
                                        // Lưu ý: Nếu DB của bạn phức tạp, phần sắp xếp theo giá biến thể
                                        // có thể cần xử lý Native Query. Tạm thời map vào field cơ bản
                                        break;
                                case "price-desc":
                                        break;
                                case "newest":
                                        sort = Sort.by(Sort.Direction.DESC, "id");
                                        break;
                        }
                }

                // Spring Data JPA dùng page bắt đầu từ 0
                Pageable pageable = PageRequest.of(page > 0 ? page - 1 : 0, size, sort);

                // 2. Tạo đối tượng Specification từ điều kiện lọc
                Specification<Product> spec = ProductSpecification.filterProducts(
                                keyword, categoryId, brands, minPrice, maxPrice, inStock);

                // 3. Query Database
                Page<Product> productPage = productRepository.findAll(spec, pageable);

                // 4. Map Entity sang DTO / Response
                return productPage.map(this::getProductResponse);
        }

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
                
                // LOGGING: Kiểm tra dữ liệu đầu vào của service
                System.out.println("[ProductService] Bắt đầu tạo sản phẩm: " + request.getName() + " với " + (request.getVariants() != null ? request.getVariants().size() : 0) + " biến thể.");

                Category category = categoryRepository.findById(request.getCategoryId())
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
                Brand brand = brandRepository.findById(request.getBrandId())
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

                Product product = mapRequestToEntity(request, new Product());
                product.setCategory(category);
                product.setBrand(brand);

                Product savedProduct = productRepository.save(product);
                saveVariantsAndImages(request, savedProduct);

                // Gọi Vision Service để trích xuất và lưu vector hình ảnh
                visionServiceClient.indexProduct(savedProduct.getId(), savedProduct.getThumbnail());

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
                                                localStorageService.deleteFile(publicId);
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

                // Gọi Vision Service để cập nhật lại vector ảnh
                visionServiceClient.indexProduct(existingProduct.getId(), existingProduct.getThumbnail());

                return getProductResponse(existingProduct);
        }

        @Override
        @Transactional
        public void deleteProduct(Long id) {
                Product product = productRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

                // KIỂM TRA KHÓA NGOẠI VỚI ĐƠN HÀNG
                if (product.getVariants() != null) {
                        boolean hasOrders = product.getVariants().stream()
                                        .anyMatch(variant -> orderDetailRepository.existsByProductVariant_Id(variant.getId()));

                        if (hasOrders) {
                                throw new AppException(ErrorCode.PRODUCT_IN_ORDER,
                                                "Sản phẩm '" + product.getName() + "' không thể xóa vì đang có đơn hàng liên kết.");
                        }
                }

                cleanOldResources(product);
                productRepository.delete(product);

                // Xóa vector ảnh khỏi hệ thống AI (FAISS)
                visionServiceClient.removeProduct(id);
        }

        @Override
        @Transactional(readOnly = true)
        public List<ProductResponse> getAllProducts() {
                return productRepository.findAll().stream().map(this::getProductResponse).collect(Collectors.toList());
        }

        @Override
        @Transactional(readOnly = true)
        public ProductResponse getProductById(Long id) {
                Product product = productRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
                return getProductResponse(product);
        }

        @Override
        public void syncAllProductsToVision() {
                List<Product> products = productRepository.findAll();
                int count = 0;
                for (Product product : products) {
                        if (product.getThumbnail() != null && !product.getThumbnail().trim().isEmpty()) {
                                visionServiceClient.indexProduct(product.getId(), product.getThumbnail());
                                count++;
                        }
                }
                System.out.println("✅ Đã gửi yêu cầu đồng bộ " + count + " sản phẩm sang Vision Service.");
        }

        @Override
        @Transactional(readOnly = true)
        public List<ProductResponse> getProductsByIds(List<Long> ids) {
                // 1. Lấy dữ liệu từ DB (MySQL sẽ xáo trộn thứ tự)
                List<Product> products = productRepository.findAllById(ids);

                // 2. Chuyển thành Map để tra cứu nhanh
                Map<Long, Product> productMap = products.stream()
                                .collect(Collectors.toMap(Product::getId, Function.identity()));

                // 3. Ép Java phải giữ nguyên thứ tự ID mà AI Python đã trả về
                return ids.stream()
                                .filter(productMap::containsKey)
                                .map(id -> getProductResponse(productMap.get(id)))
                                .collect(Collectors.toList());
        }

        // --- LOGIC MỚI: CẬP NHẬT BIẾN THỂ THÔNG MINH ---
        private void updateProductVariantsSmart(ProductRequest request, Product product) {
                if (request.getVariants() == null) {
                        return;
                }

                List<ProductVariant> existingVariants = product.getVariants() == null
                                ? new ArrayList<>()
                                : new ArrayList<>(product.getVariants());

                Map<Long, ProductVariant> existingVariantsById = existingVariants.stream()
                                .filter(v -> v.getId() != null)
                                .collect(Collectors.toMap(ProductVariant::getId, Function.identity()));

                Map<String, ProductVariant> existingVariantsBySku = existingVariants.stream()
                                .filter(v -> normalizeSku(v.getSku()) != null)
                                .collect(Collectors.toMap(
                                                v -> normalizeSku(v.getSku()),
                                                Function.identity(),
                                                (a, b) -> a));

                Set<Long> incomingVariantIds = new HashSet<>();
                Set<String> requestSkus = new HashSet<>();
                List<ProductVariant> variantsToSave = new ArrayList<>();
                List<ProductVariant> variantsToRemove = new ArrayList<>();
                List<ProductVariant> onlyNewVariants = new ArrayList<>();

                for (var vReq : request.getVariants()) {
                        String reqSku = normalizeSku(vReq.getSku());
                        if (reqSku == null || reqSku.isBlank()) {
                                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
                        }

                        if (!requestSkus.add(reqSku)) {
                                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
                        }

                        ProductVariant targetVariant = null;
                        if (vReq.getId() != null && existingVariantsById.containsKey(vReq.getId())) {
                                targetVariant = existingVariantsById.get(vReq.getId());
                                incomingVariantIds.add(vReq.getId());
                        } else if (existingVariantsBySku.containsKey(reqSku)) {
                                targetVariant = existingVariantsBySku.get(reqSku);
                                if (targetVariant.getId() != null) {
                                        incomingVariantIds.add(targetVariant.getId());
                                }
                        }

                        if (targetVariant != null) {
                                boolean isUsedInOrder = orderDetailRepository
                                                .existsByProductVariant_Id(targetVariant.getId());
                                boolean isAttributeChanged = !areAttributesEquivalent(targetVariant.getAttributes(),
                                                vReq.getAttributes());
                                boolean isSkuChanged = !Objects.equals(normalizeSku(targetVariant.getSku()), reqSku);

                                if (isUsedInOrder && (isAttributeChanged || isSkuChanged)) {
                                        targetVariant.setStock(0);
                                        variantsToSave.add(targetVariant);

                                        String baseSkuForNewVariant = reqSku;
                                        if (Objects.equals(normalizeSku(targetVariant.getSku()), reqSku)) {
                                                baseSkuForNewVariant = reqSku + "-NEW";
                                        }
                                        String newVariantSku = buildUniqueVariantSku(baseSkuForNewVariant);

                                        ProductVariant newVariant = ProductVariant.builder()
                                                        .sku(newVariantSku)
                                                        .price(vReq.getPrice())
                                                        .compareAtPrice(vReq.getCompareAtPrice())
                                                        .stock(vReq.getStock())
                                                        .attributes(normalizeAttributesJson(vReq.getAttributes()))
                                                        .image(vReq.getImage())
                                                        .product(product)
                                                        .build();
                                        variantsToSave.add(newVariant);
                                        onlyNewVariants.add(newVariant);
                                } else {
                                        if (!Objects.equals(normalizeSku(targetVariant.getSku()), reqSku)
                                                        && variantRepository.existsBySkuAndIdNot(reqSku,
                                                                        targetVariant.getId())) {
                                                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
                                        }

                                        targetVariant.setSku(reqSku);
                                        targetVariant.setPrice(vReq.getPrice());
                                        targetVariant.setCompareAtPrice(vReq.getCompareAtPrice());
                                        targetVariant.setStock(vReq.getStock());
                                        targetVariant.setAttributes(normalizeAttributesJson(vReq.getAttributes()));
                                        targetVariant.setImage(vReq.getImage());
                                        variantsToSave.add(targetVariant);
                                }
                        } else {
                                if (variantRepository.existsBySku(reqSku)) {
                                        throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
                                }

                                ProductVariant newVariant = ProductVariant.builder()
                                                .sku(reqSku)
                                                .price(vReq.getPrice())
                                                .compareAtPrice(vReq.getCompareAtPrice())
                                                .stock(vReq.getStock())
                                                .attributes(normalizeAttributesJson(vReq.getAttributes()))
                                                .image(vReq.getImage())
                                                .product(product)
                                                .build();
                                variantsToSave.add(newVariant);
                                onlyNewVariants.add(newVariant);
                        }
                }

                for (ProductVariant existingVariant : existingVariants) {
                        if (existingVariant.getId() == null) {
                                continue;
                        }
                        if (!incomingVariantIds.contains(existingVariant.getId())) {
                                boolean isUsedInOrder = orderDetailRepository
                                                .existsByProductVariant_Id(existingVariant.getId());
                                if (isUsedInOrder) {
                                        existingVariant.setStock(0);
                                        variantsToSave.add(existingVariant);
                                } else {
                                        variantsToRemove.add(existingVariant);
                                }
                        }
                }

                if (!variantsToRemove.isEmpty()) {
                        if (product.getVariants() != null) {
                                product.getVariants().removeAll(variantsToRemove);
                        }
                        variantRepository.deleteAll(variantsToRemove);
                        variantRepository.flush();
                }

                variantRepository.saveAll(variantsToSave);
                variantRepository.flush();

                if (product.getVariants() == null) {
                        product.setVariants(new HashSet<>());
                }
                product.getVariants().addAll(onlyNewVariants);
        }

        private String normalizeSku(String sku) {
                return sku == null ? null : sku.trim().toUpperCase();
        }

        private String buildUniqueVariantSku(String desiredSku) {
                String normalized = normalizeSku(desiredSku);
                if (normalized == null || normalized.isBlank()) {
                        throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
                }

                if (!variantRepository.existsBySku(normalized)) {
                        return normalized;
                }

                int counter = 1;
                String candidate;
                do {
                        candidate = normalized + "-V" + counter;
                        counter++;
                } while (variantRepository.existsBySku(candidate));

                return candidate;
        }

        private boolean areAttributesEquivalent(String oldAttributes, String newAttributes) {
                return normalizeAttributeMap(oldAttributes).equals(normalizeAttributeMap(newAttributes));
        }

        private String normalizeAttributesJson(String rawAttributes) {
                try {
                        Map<String, String> normalized = normalizeAttributeMap(rawAttributes);
                        return objectMapper.writeValueAsString(normalized);
                } catch (Exception e) {
                        return rawAttributes == null ? "{}" : rawAttributes;
                }
        }

        private Map<String, String> normalizeAttributeMap(String rawAttributes) {
                try {
                        if (rawAttributes == null || rawAttributes.isBlank()) {
                                return new LinkedHashMap<>();
                        }
                        Map<String, Object> parsed = objectMapper.readValue(rawAttributes,
                                        new TypeReference<LinkedHashMap<String, Object>>() {
                                        });
                        Map<String, String> normalized = new LinkedHashMap<>();
                        for (Map.Entry<String, Object> entry : parsed.entrySet()) {
                                String key = entry.getKey() == null ? "" : entry.getKey().trim().toLowerCase();
                                String value = entry.getValue() == null ? "" : String.valueOf(entry.getValue()).trim();
                                normalized.put(key, value);
                        }
                        return normalized;
                } catch (Exception e) {
                        Map<String, String> fallback = new LinkedHashMap<>();
                        fallback.put("raw", rawAttributes == null ? "" : rawAttributes.trim());
                        return fallback;
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
                        // LOGGING: Kiểm tra số lượng biến thể trước khi lưu
                        System.out.println("  [ProductService] Chuẩn bị lưu " + request.getVariants().size() + " biến thể cho sản phẩm ID: " + product.getId());

                        List<ProductVariant> variants = request.getVariants().stream()
                                        .map(vReq -> ProductVariant.builder()
                                                        // === FIX: Tự động sinh SKU nếu nó null ===
                                                        .sku(vReq.getSku() != null && !vReq.getSku().isBlank()
                                                                        ? vReq.getSku()
                                                                        : buildUniqueVariantSku(
                                                                                        product.getSlug() + "-"
                                                                                                        + generateSkuFromAttributes(
                                                                                                                        vReq.getAttributes())))
                                                        // =======================================
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
                                localStorageService.deleteFile(publicId);
                        } catch (Exception e) {
                                System.err.println("Lỗi xóa ảnh Local ID " + publicId + ": " + e.getMessage());
                        }
                }
        }

        private String generateSkuFromAttributes(String attributesJson) {
                if (attributesJson == null || attributesJson.isBlank()) {
                        return "DEFAULT";
                }
                try {
                        Map<String, String> attributes = objectMapper.readValue(attributesJson,
                                        new TypeReference<Map<String, String>>() {
                                        });
                        return attributes.values().stream()
                                        .map(value -> normalizeTextForSku(value).toUpperCase())
                                        .collect(Collectors.joining("-"));
                } catch (Exception e) {
                        return "ATTR-ERR";
                }
        }

        private String normalizeTextForSku(String text) {
                return text.replaceAll("\\s+", "-").replaceAll("[^a-zA-Z0-9-]", "");
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
                                                                        .hasOrders(orderDetailRepository
                                                                                        .existsByProductVariant_Id(
                                                                                                        v.getId()))
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