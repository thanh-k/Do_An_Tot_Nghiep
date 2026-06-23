package com.ecommerce.modules.product.service.excel;

import com.ecommerce.entity.Brand;
import com.ecommerce.entity.Category;
import com.ecommerce.modules.brand.repository.BrandRepository;
import com.ecommerce.modules.category.repository.CategoryRepository;
import com.ecommerce.modules.product.dto.request.ProductRequest;
import com.ecommerce.modules.product.dto.request.VariantRequest;
import com.ecommerce.modules.product.dto.response.ProductResponse;
import com.ecommerce.modules.product.dto.response.VariantResponse;
import com.ecommerce.modules.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.ClientAnchor.AnchorType;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.util.Units;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class ProductExcelService {
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductService productService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 1. TẠO TEMPLATE CÓ DROPDOWN
    public ByteArrayInputStream generateTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Sản phẩm");
            Sheet hiddenSheet = workbook.createSheet("HiddenData");
            Row headerRow = sheet.createRow(0);
            String[] columns = { "Tên sản phẩm", "Danh mục", "Thương hiệu", "Mô tả ngắn", "SKU Biến thể", "Giá bán",
                    "Giá gốc", "Tồn kho", "Thông số (JSON)" };
            for (int i = 0; i < columns.length; i++) {
                headerRow.createCell(i).setCellValue(columns[i]);
            }
            List<Category> categories = categoryRepository.findAll();
            List<Brand> brands = brandRepository.findAll();
            for (int i = 0; i < Math.max(categories.size(), brands.size()); i++) {
                Row row = hiddenSheet.createRow(i);
                if (i < categories.size()) {
                    row.createCell(0).setCellValue(categories.get(i).getName());
                }
                if (i < brands.size()) {
                    row.createCell(1).setCellValue(brands.get(i).getName());
                }
            }
            workbook.setSheetHidden(1, true);
            DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            // Validation Danh mục
            String catFormula = "HiddenData!$A$1:$A$" + categories.size();
            DataValidationConstraint catConstraint = validationHelper.createFormulaListConstraint(catFormula);
            CellRangeAddressList catAddressList = new CellRangeAddressList(1, 1000, 1, 1);
            DataValidation catValidation = validationHelper.createValidation(catConstraint, catAddressList);
            catValidation.setShowErrorBox(true);
            sheet.addValidationData(catValidation);
            // Validation Thương hiệu
            String brandFormula = "HiddenData!$B$1:$B$" + brands.size();
            DataValidationConstraint brandConstraint = validationHelper.createFormulaListConstraint(brandFormula);
            CellRangeAddressList brandAddressList = new CellRangeAddressList(1, 1000, 2, 2);
            DataValidation brandValidation = validationHelper.createValidation(brandConstraint, brandAddressList);
            brandValidation.setShowErrorBox(true);
            sheet.addValidationData(brandValidation);
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    // 2. IMPORT DỮ LIỆU
    @Transactional
    public void importProductsFromExcel(MultipartFile file) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<String, ProductRequest> productMap = new LinkedHashMap<>();
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                String productName = getCellValueAsString(row.getCell(0));
                if (productName.isEmpty())
                    continue;
                ProductRequest request = productMap.getOrDefault(productName, new ProductRequest());
                if (request.getName() == null) {
                    request.setName(productName);

                    String categoryName = getCellValueAsString(row.getCell(1));
                    Category category = categoryRepository.findByName(categoryName)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục: " + categoryName));
                    request.setCategoryId(category.getId());
                    String brandName = getCellValueAsString(row.getCell(2));
                    Brand brand = brandRepository.findByName(brandName)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy thương hiệu: " + brandName));
                    request.setBrandId(brand.getId());
                    request.setShortDescription(getCellValueAsString(row.getCell(3)));
                    request.setSlug(productName.toLowerCase().replace(" ", "-")); // Chỗ này bạn có thể gọi hàm
                                                                                  // convertToSlug của bạn
                    request.setVariants(new ArrayList<>());

                    productMap.put(productName, request);
                }
                VariantRequest variantRequest = new VariantRequest();
                variantRequest.setSku(getCellValueAsString(row.getCell(4)));

                String priceStr = getCellValueAsString(row.getCell(5));
                variantRequest.setPrice(priceStr.isEmpty() ? 0.0 : Double.parseDouble(priceStr));

                String comparePriceStr = getCellValueAsString(row.getCell(6));
                variantRequest.setCompareAtPrice(comparePriceStr.isEmpty() ? 0.0 : Double.parseDouble(comparePriceStr));
                String stockStr = getCellValueAsString(row.getCell(7));
                variantRequest.setStock(stockStr.isEmpty() ? 0 : (int) Double.parseDouble(stockStr));

                String attributesJson = getCellValueAsString(row.getCell(8));
                variantRequest.setAttributes(attributesJson.isEmpty() ? "{}" : attributesJson);
                request.getVariants().add(variantRequest);
            }
            for (ProductRequest req : productMap.values()) {
                productService.createProduct(req);
            }
        }
    }

    // 3. EXPORT DỮ LIỆU
    @Transactional(readOnly = true) // BẮT BUỘC: Giữ session mở trong suốt quá trình
    public ByteArrayInputStream exportProductsToExcel() throws IOException {
        List<ProductResponse> products = productService.getAllProducts();

        try (SXSSFWorkbook workbook = new SXSSFWorkbook()) {
            // Sử dụng SXSSFSheet để có thể dùng trackAllColumnsForAutoSizing
            org.apache.poi.xssf.streaming.SXSSFSheet sheet = workbook.createSheet("Danh sách sản phẩm");
            sheet.trackAllColumnsForAutoSizing(); // Bật tính năng theo dõi độ rộng cột

            // --- 1. TẠO STYLE CHO HEADER ---
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 14);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);
            headerCellStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // --- STYLE CHO CÁC Ô DỮ LIỆU ---
            // Style chung cho các ô dữ liệu (có border)
            CellStyle dataCellStyle = workbook.createCellStyle();
            dataCellStyle.setBorderTop(BorderStyle.THIN);
            dataCellStyle.setBorderBottom(BorderStyle.THIN);
            dataCellStyle.setBorderLeft(BorderStyle.THIN);
            dataCellStyle.setBorderRight(BorderStyle.THIN);
            dataCellStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Style cho ô JSON (kế thừa từ dataCellStyle và thêm wrap text)
            CellStyle jsonDataCellStyle = workbook.createCellStyle();
            jsonDataCellStyle.cloneStyleFrom(dataCellStyle);
            jsonDataCellStyle.setWrapText(true);
            jsonDataCellStyle.setVerticalAlignment(VerticalAlignment.TOP);

            Row headerRow = sheet.createRow(0);
            // Yêu cầu 1: Set chiều cao và đóng băng Header
            headerRow.setHeightInPoints(57.20f);
            sheet.createFreezePane(0, 1); // Đóng băng dòng đầu tiên

            String[] columns = { "ID", "Tên sản phẩm", "Ảnh đại diện", "Danh mục", "Thương hiệu", "Mô tả ngắn",
                    "Thông số chung", "SKU biến thể", "Ảnh biến thể", "Thuộc tính biến thể", "Giá bán", "Giá gốc",
                    "Tồn kho" };

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // --- 2. GHI DỮ LIỆU VÀ HÌNH ẢNH ---
            Drawing<?> drawing = sheet.createDrawingPatriarch();
            Map<String, Integer> imageCache = new ConcurrentHashMap<>();

            int rowIdx = 1;
            for (ProductResponse product : products) {
                Row productRow = sheet.createRow(rowIdx);
                productRow.setHeightInPoints(121.80f); // Yêu cầu: 4.26 cm

                productRow.createCell(0).setCellValue(product.getId());
                productRow.createCell(1).setCellValue(product.getName());

                // Chèn ảnh đại diện
                if (product.getThumbnail() != null && !product.getThumbnail().isEmpty()) {
                    insertImage(workbook, drawing, sheet, rowIdx, 2, product.getThumbnail(), imageCache, 2.25, 1.54);
                }

                productRow.createCell(3)
                        .setCellValue(product.getCategory() != null ? product.getCategory().getName() : "");
                productRow.createCell(4).setCellValue(product.getBrand() != null ? product.getBrand().getName() : "");
                productRow.createCell(5)
                        .setCellValue(product.getShortDescription() != null ? product.getShortDescription() : "");

                // Định dạng và chèn thông số chung
                Cell specCell = productRow.createCell(6);
                specCell.setCellValue(formatJsonForExcel(product.getSpecifications()));
                specCell.setCellStyle(jsonDataCellStyle);

                int startRowForVariants = rowIdx;

                if (product.getVariants() != null && !product.getVariants().isEmpty()) {
                    for (VariantResponse variant : product.getVariants()) {
                        // Nếu là biến thể đầu tiên, ghi trên cùng dòng với sản phẩm
                        // Nếu là các biến thể sau, tạo dòng mới
                        Row variantRow = (rowIdx == startRowForVariants) ? productRow : sheet.createRow(rowIdx);
                        variantRow.setHeightInPoints(121.80f); // Đồng bộ chiều cao dòng

                        variantRow.createCell(7).setCellValue(variant.getSku() != null ? variant.getSku() : "");

                        // Chèn ảnh biến thể
                        if (variant.getImage() != null && !variant.getImage().isEmpty()) {
                            insertImage(workbook, drawing, sheet, rowIdx, 8, variant.getImage(), imageCache, 1.79,
                                    1.53);
                        }

                        // Định dạng và chèn thuộc tính biến thể
                        Cell attrCell = variantRow.createCell(9);
                        attrCell.setCellValue(formatJsonForExcel(variant.getAttributes()));
                        attrCell.setCellStyle(jsonDataCellStyle);

                        variantRow.createCell(10).setCellValue(variant.getPrice() != null ? variant.getPrice() : 0.0);
                        variantRow.createCell(11)
                                .setCellValue(variant.getCompareAtPrice() != null ? variant.getCompareAtPrice() : 0.0);
                        variantRow.createCell(12).setCellValue(variant.getStock() != null ? variant.getStock() : 0);

                        rowIdx++;
                    }
                } else {
                    rowIdx++; // Nếu không có biến thể, vẫn tăng row index để sản phẩm tiếp theo không bị đè
                }

                // --- Kẻ khung cho mỗi sản phẩm ---
                for (int r = startRowForVariants; r < rowIdx; r++) {
                    Row currentRow = sheet.getRow(r);
                    if (currentRow == null)
                        continue;
                    for (int c = 0; c < columns.length; c++) {
                        Cell cell = currentRow.getCell(c);
                        if (cell == null)
                            cell = currentRow.createCell(c);

                        // Áp dụng style nhất quán
                        if (c == 6 || c == 9) { // Cột JSON
                            if (cell.getCellStyle() == null || !cell.getCellStyle().getWrapText()) {
                                cell.setCellStyle(jsonDataCellStyle);
                            }
                        } else { // Các cột còn lại
                            cell.setCellStyle(dataCellStyle);
                        }
                    }
                }
                rowIdx++; // Thêm một dòng trống để phân cách
            }

            // Tự động căn chỉnh độ rộng cho từng cột sau khi đã ghi dữ liệu
            for (int i = 0; i < columns.length; i++) {
                // Bỏ qua cột ảnh vì autoSize không hoạt động tốt với ảnh
                if (i == 2 || i == 8) { // Cột ảnh
                    if (i == 2) { // Cột ảnh đại diện: 5.26 cm
                        sheet.setColumnWidth(i, 22 * 256);
                    } else { // Cột ảnh biến thể: 5.80 cm
                        sheet.setColumnWidth(i, 24 * 256);
                    }
                } else if (i == 6 || i == 9) { // Cột JSON
                    sheet.setColumnWidth(i, 50 * 256); // Tăng độ rộng cột JSON
                } else {
                    sheet.autoSizeColumn(i);
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    // --- CÁC HÀM PHỤ TRỢ MỚI ---

    private void insertImage(Workbook workbook, Drawing<?> drawing, Sheet sheet, int rowNum, int colNum,
            String imageUrl, Map<String, Integer> imageCache,
            double widthInches, double heightInches) {
        try {
            Integer imageIndex = imageCache.get(imageUrl);
            if (imageIndex == null) {
                URL url = new URL(imageUrl);
                try (InputStream is = url.openStream(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[1024];
                    int len;
                    while ((len = is.read(buffer)) != -1) {
                        baos.write(buffer, 0, len);
                    }
                    byte[] bytes = baos.toByteArray();
                    imageIndex = workbook.addPicture(bytes, Workbook.PICTURE_TYPE_JPEG);
                    imageCache.put(imageUrl, imageIndex);
                }
            }

            // Yêu cầu 3: Điều chỉnh anchor để ảnh to hơn và căn giữa ô
            CreationHelper helper = workbook.getCreationHelper();
            ClientAnchor anchor = helper.createClientAnchor();
            anchor.setCol1(colNum);
            anchor.setRow1(rowNum);
            anchor.setDx1(Units.toEMU(0.05)); // Căn lề trái một chút
            anchor.setDy1(Units.toEMU(0.05)); // Căn lề trên một chút
            anchor.setAnchorType(AnchorType.MOVE_DONT_RESIZE);

            Picture pict = drawing.createPicture(anchor, imageIndex);
            resizeImage(pict, widthInches, heightInches); // Sử dụng hàm resize mới

        } catch (Exception e) {
            System.err.println("Lỗi khi chèn ảnh từ URL: " + imageUrl + " - " + e.getMessage());
            // Nếu lỗi, ghi URL vào ô thay thế
            sheet.getRow(rowNum).createCell(colNum).setCellValue(imageUrl);
        }
    }

    private void resizeImage(Picture pict, double widthInches, double heightInches) {
        ClientAnchor anchor = pict.getClientAnchor();
        anchor.setCol2(anchor.getCol1() + 1);
        anchor.setRow2(anchor.getRow1() + 1);
        anchor.setDx2(Units.toEMU(widthInches));
        anchor.setDy2(Units.toEMU(heightInches));
    }

    private String formatJsonForExcel(String jsonString) {
        if (jsonString == null || jsonString.isBlank() || "{}".equals(jsonString)) {
            return "";
        }
        try {
            Map<String, String> map = objectMapper.readValue(jsonString, new TypeReference<Map<String, String>>() {
            });
            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, String> entry : map.entrySet()) {
                sb.append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
            }
            return sb.toString().trim();
        } catch (IOException e) {
            return jsonString; // Trả về chuỗi gốc nếu không parse được
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }
}