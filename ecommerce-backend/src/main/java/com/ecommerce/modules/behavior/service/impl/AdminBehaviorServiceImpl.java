package com.ecommerce.modules.behavior.service.impl;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorEventResponse;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorInterestResponse;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorSummaryResponse;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorProductReportItem;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorProductReportResponse;
import com.ecommerce.modules.behavior.dto.admin.EventCountResponse;
import com.ecommerce.modules.behavior.entity.BehaviorEventType;
import com.ecommerce.modules.behavior.entity.UserBehaviorEvent;
import com.ecommerce.modules.behavior.entity.UserProductInterest;
import com.ecommerce.modules.behavior.repository.UserBehaviorEventRepository;
import com.ecommerce.modules.behavior.repository.UserProductInterestRepository;
import com.ecommerce.modules.behavior.service.AdminBehaviorService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.io.ByteArrayOutputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminBehaviorServiceImpl implements AdminBehaviorService {

    private static final int DEFAULT_LIMIT = 100;
    private static final int MAX_LIMIT = 500;

    private final UserBehaviorEventRepository behaviorEventRepository;
    private final UserProductInterestRepository productInterestRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminBehaviorSummaryResponse getSummary() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (EventCountResponse item : behaviorEventRepository.countGroupByEventType()) {
            counts.put(item.getEventType().name(), item.getTotal());
        }

        return AdminBehaviorSummaryResponse.builder()
                .totalEvents(behaviorEventRepository.count())
                .totalInterests(productInterestRepository.count())
                .totalProductViews(counts.getOrDefault(BehaviorEventType.VIEW_PRODUCT.name(), 0L))
                .totalSearches(counts.getOrDefault(BehaviorEventType.SEARCH_PRODUCT.name(), 0L))
                .totalAddToCart(counts.getOrDefault(BehaviorEventType.ADD_TO_CART.name(), 0L))
                .totalWishlist(counts.getOrDefault(BehaviorEventType.ADD_TO_WISHLIST.name(), 0L))
                .totalCheckoutStarts(counts.getOrDefault(BehaviorEventType.START_CHECKOUT.name(), 0L))
                .totalAbandonedCheckouts(counts.getOrDefault(BehaviorEventType.ABANDON_CHECKOUT.name(), 0L))
                .totalPurchases(counts.getOrDefault(BehaviorEventType.PLACE_ORDER.name(), 0L))
                .eventCounts(counts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminBehaviorEventResponse> getEvents(BehaviorEventType eventType,
                                                      String keyword,
                                                      String userKeyword,
                                                      String productKeyword,
                                                      LocalDate fromDate,
                                                      LocalDate toDate,
                                                      int limit) {
        LocalDateTime from = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime to = toDate == null ? null : toDate.plusDays(1).atStartOfDay();
        Pageable pageable = PageRequest.of(0, normalizeLimit(limit));
        return behaviorEventRepository.searchAdminEvents(
                        eventType,
                        normalize(keyword),
                        normalize(userKeyword),
                        normalize(productKeyword),
                        from,
                        to,
                        pageable
                )
                .stream()
                .map(this::toEventResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminBehaviorInterestResponse> getInterests(String keyword,
                                                            String userKeyword,
                                                            String productKeyword,
                                                            int limit) {
        Pageable pageable = PageRequest.of(0, normalizeLimit(limit));
        return productInterestRepository.searchAdminInterests(
                        normalize(keyword),
                        normalize(userKeyword),
                        normalize(productKeyword),
                        pageable
                )
                .stream()
                .map(this::toInterestResponse)
                .toList();
    }


    @Override
    @Transactional(readOnly = true)
    public AdminBehaviorProductReportResponse getProductReport(LocalDate fromDate, LocalDate toDate, int limit) {
        LocalDateTime from = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime to = toDate == null ? null : toDate.plusDays(1).atStartOfDay();
        Pageable pageable = PageRequest.of(0, normalizeReportLimit(limit));

        return AdminBehaviorProductReportResponse.builder()
                .topViewed(mapEventProductRows(behaviorEventRepository.findTopProductsByEventType(BehaviorEventType.VIEW_PRODUCT, from, to, pageable)))
                .topSearched(mapEventProductRows(behaviorEventRepository.findTopProductsByEventType(BehaviorEventType.SEARCH_PRODUCT, from, to, pageable)))
                .topAddedToCart(mapEventProductRows(behaviorEventRepository.findTopProductsByEventType(BehaviorEventType.ADD_TO_CART, from, to, pageable)))
                .topAbandonedCheckout(mapEventProductRows(behaviorEventRepository.findTopProductsByEventType(BehaviorEventType.ABANDON_CHECKOUT, from, to, pageable)))
                .topPurchased(mapEventProductRows(behaviorEventRepository.findTopProductsByEventType(BehaviorEventType.PLACE_ORDER, from, to, pageable)))
                .topInterest(mapInterestProductRows(productInterestRepository.findTopInterestedProducts(from, to, pageable)))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportProductReportExcel(LocalDate fromDate, LocalDate toDate, int limit) {
        AdminBehaviorProductReportResponse report = getProductReport(fromDate, toDate, limit);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            createReportSheet(workbook, headerStyle, "Top xem san pham", report.getTopViewed(), "Lượt xem");
            createReportSheet(workbook, headerStyle, "Top tim kiem", report.getTopSearched(), "Lượt tìm kiếm");
            createReportSheet(workbook, headerStyle, "Top them gio", report.getTopAddedToCart(), "Lượt thêm giỏ");
            createReportSheet(workbook, headerStyle, "Top bo do checkout", report.getTopAbandonedCheckout(), "Lượt bỏ dở");
            createReportSheet(workbook, headerStyle, "Top mua nhieu", report.getTopPurchased(), "Lượt mua");
            createReportSheet(workbook, headerStyle, "Top diem quan tam", report.getTopInterest(), "Số bản ghi");

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Không thể xuất báo cáo hành vi sản phẩm", e);
        }
    }

    private void createReportSheet(Workbook workbook,
                                   CellStyle headerStyle,
                                   String sheetName,
                                   List<AdminBehaviorProductReportItem> items,
                                   String countLabel) {
        Sheet sheet = workbook.createSheet(sheetName);
        String[] headers = {"STT", "ID sản phẩm", "Tên sản phẩm", "Danh mục", "Thương hiệu", countLabel, "Điểm quan tâm"};
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        for (int i = 0; i < items.size(); i++) {
            AdminBehaviorProductReportItem item = items.get(i);
            Row row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(i + 1);
            row.createCell(1).setCellValue(item.getProductId() == null ? 0 : item.getProductId());
            row.createCell(2).setCellValue(nullToEmpty(item.getProductName()));
            row.createCell(3).setCellValue(nullToEmpty(item.getCategoryName()));
            row.createCell(4).setCellValue(nullToEmpty(item.getBrandName()));
            row.createCell(5).setCellValue(item.getTotalCount() == null ? 0 : item.getTotalCount());
            row.createCell(6).setCellValue(item.getTotalScore() == null ? 0D : item.getTotalScore());
        }

        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private List<AdminBehaviorProductReportItem> mapEventProductRows(List<Object[]> rows) {
        return rows.stream()
                .map(row -> AdminBehaviorProductReportItem.builder()
                        .productId(toLong(row[0]))
                        .productName(toStringValue(row[1]))
                        .productThumbnail(toStringValue(row[2]))
                        .categoryName(toStringValue(row[3]))
                        .brandName(toStringValue(row[4]))
                        .totalCount(toLong(row[5]))
                        .totalScore(0D)
                        .build())
                .toList();
    }

    private List<AdminBehaviorProductReportItem> mapInterestProductRows(List<Object[]> rows) {
        return rows.stream()
                .map(row -> AdminBehaviorProductReportItem.builder()
                        .productId(toLong(row[0]))
                        .productName(toStringValue(row[1]))
                        .productThumbnail(toStringValue(row[2]))
                        .categoryName(toStringValue(row[3]))
                        .brandName(toStringValue(row[4]))
                        .totalCount(toLong(row[5]))
                        .totalScore(toDouble(row[6]))
                        .build())
                .toList();
    }

    private Long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number number) return number.longValue();
        return Long.parseLong(value.toString());
    }

    private Double toDouble(Object value) {
        if (value == null) return 0D;
        if (value instanceof Number number) return number.doubleValue();
        return Double.parseDouble(value.toString());
    }

    private String toStringValue(Object value) {
        return value == null ? null : value.toString();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private int normalizeReportLimit(int limit) {
        if (limit <= 0) return 10;
        return Math.min(limit, 50);
    }

    private AdminBehaviorEventResponse toEventResponse(UserBehaviorEvent event) {
        User user = event.getUser();
        Product product = event.getProduct();
        return AdminBehaviorEventResponse.builder()
                .id(event.getId())
                .userId(user == null ? null : user.getId())
                .userFullName(user == null ? null : user.getFullName())
                .userEmail(user == null ? null : user.getEmail())
                .sessionId(event.getSessionId())
                .eventType(event.getEventType())
                .productId(product == null ? null : product.getId())
                .productName(product == null ? null : product.getName())
                .productThumbnail(product == null ? null : product.getThumbnail())
                .categoryId(event.getCategory() == null ? null : event.getCategory().getId())
                .categoryName(event.getCategory() == null ? null : event.getCategory().getName())
                .brandId(event.getBrand() == null ? null : event.getBrand().getId())
                .brandName(event.getBrand() == null ? null : event.getBrand().getName())
                .keyword(event.getKeyword())
                .pageUrl(event.getPageUrl())
                .metadataJson(event.getMetadataJson())
                .createdAt(event.getCreatedAt())
                .build();
    }

    private AdminBehaviorInterestResponse toInterestResponse(UserProductInterest interest) {
        User user = interest.getUser();
        Product product = interest.getProduct();
        return AdminBehaviorInterestResponse.builder()
                .id(interest.getId())
                .userId(user == null ? null : user.getId())
                .userFullName(user == null ? null : user.getFullName())
                .userEmail(user == null ? null : user.getEmail())
                .sessionId(interest.getSessionId())
                .productId(product == null ? null : product.getId())
                .productName(product == null ? null : product.getName())
                .productThumbnail(product == null ? null : product.getThumbnail())
                .categoryName(product == null || product.getCategory() == null ? null : product.getCategory().getName())
                .brandName(product == null || product.getBrand() == null ? null : product.getBrand().getName())
                .score(interest.getScore())
                .viewCount(interest.getViewCount())
                .cartCount(interest.getCartCount())
                .wishlistCount(interest.getWishlistCount())
                .checkoutCount(interest.getCheckoutCount())
                .purchaseCount(interest.getPurchaseCount())
                .lastEventType(interest.getLastEventType())
                .lastInteractedAt(interest.getLastInteractedAt())
                .createdAt(interest.getCreatedAt())
                .updatedAt(interest.getUpdatedAt())
                .build();
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }
}
