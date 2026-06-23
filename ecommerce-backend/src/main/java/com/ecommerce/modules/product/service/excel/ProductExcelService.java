package com.ecommerce.modules.product.service.excel;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
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
    // 1. TẠO TEMPLATE CÓ DROPDOWN CHUẨN XÁC
    public ByteArrayInputStream generateTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Mẫu Nhập Sản Phẩm");

            // Đóng băng dòng header (dòng 0) và 3 cột đầu tiên để dễ cuộn ngang
            sheet.createFreezePane(3, 1);

            Sheet hiddenSheet = workbook.createSheet("HiddenData");
            // --- TẠO STYLE CHO HEADER ---
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            // Style mặc định cho Header
            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);
            headerCellStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerCellStyle.setBorderTop(BorderStyle.MEDIUM);
            headerCellStyle.setBorderBottom(BorderStyle.MEDIUM);
            headerCellStyle.setBorderLeft(BorderStyle.MEDIUM);
            headerCellStyle.setBorderRight(BorderStyle.MEDIUM);
            // Style màu Đỏ cho các trường Bắt buộc (*)
            CellStyle requiredCellStyle = workbook.createCellStyle();
            requiredCellStyle.cloneStyleFrom(headerCellStyle);
            requiredCellStyle.setFillForegroundColor(IndexedColors.RED.getIndex()); // Nền Đỏ cho dễ chú ý
            // Style màu Xanh lá cho nhóm Biến thể
            CellStyle variantCellStyle = workbook.createCellStyle();
            variantCellStyle.cloneStyleFrom(headerCellStyle);
            variantCellStyle.setFillForegroundColor(IndexedColors.SEA_GREEN.getIndex());
            // Style cho ô Ghi chú
            CellStyle noteCellStyle = workbook.createCellStyle();
            Font noteFont = workbook.createFont();
            noteFont.setItalic(true);
            noteFont.setColor(IndexedColors.DARK_RED.getIndex());
            noteCellStyle.setFont(noteFont); // Áp dụng font
            noteCellStyle.setBorderTop(BorderStyle.MEDIUM);
            noteCellStyle.setBorderBottom(BorderStyle.MEDIUM);
            noteCellStyle.setBorderLeft(BorderStyle.MEDIUM);
            noteCellStyle.setBorderRight(BorderStyle.MEDIUM);
            noteCellStyle.setAlignment(HorizontalAlignment.LEFT); // Căn trái để dễ đọc
            noteCellStyle.setVerticalAlignment(VerticalAlignment.TOP); // Căn trên để thấy nội dung từ đầu
            noteCellStyle.setWrapText(true); // Tự động xuống dòng

            // Style cho các ô dữ liệu JSON (wrap text)
            CellStyle jsonDataCellStyle = workbook.createCellStyle();
            jsonDataCellStyle.setBorderTop(BorderStyle.MEDIUM);
            jsonDataCellStyle.setBorderBottom(BorderStyle.MEDIUM);
            jsonDataCellStyle.setBorderLeft(BorderStyle.MEDIUM);
            jsonDataCellStyle.setBorderRight(BorderStyle.MEDIUM);
            jsonDataCellStyle.setAlignment(HorizontalAlignment.CENTER); // Căn giữa
            jsonDataCellStyle.setVerticalAlignment(VerticalAlignment.CENTER); // Căn giữa
            jsonDataCellStyle.setWrapText(true); // Tự động xuống dòng

            // Style cho các ô dữ liệu có dropdown (wrap text)
            CellStyle dropdownDataCellStyle = workbook.createCellStyle();
            // Style này đã được căn giữa ở các lần cập nhật trước
            dropdownDataCellStyle.setBorderTop(BorderStyle.MEDIUM);
            dropdownDataCellStyle.setBorderBottom(BorderStyle.MEDIUM);
            dropdownDataCellStyle.setBorderLeft(BorderStyle.MEDIUM);
            dropdownDataCellStyle.setBorderRight(BorderStyle.MEDIUM);
            dropdownDataCellStyle.setWrapText(true); // Tự động xuống dòng
            dropdownDataCellStyle.setAlignment(HorizontalAlignment.CENTER);
            dropdownDataCellStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            // --- KHỞI TẠO CÁC CỘT ---
            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(30); // Cho Header cao lên cho đẹp
            String[] columns = {
                    // Của Product (0 -> 8)
                    "Tên sản phẩm (*)", "Danh mục (*)", "Thương hiệu (*)",
                    "Ảnh đại diện URL (*)", "Mô tả ngắn", "Mô tả chi tiết (*)",
                    "Thông số KT (JSON) (*)", "Nổi bật (Có/Không)", "Mới (Có/Không)",
                    // Của Variant (9 -> 14)
                    "Ảnh biến thể URL", "Giá bán (*)", "Giá gốc", "Tồn kho (*)",
                    "Thuộc tính biến thể (JSON) (*)", // SKU đã được xóa
                    // Cột hướng dẫn (15)
                    "Ghi chú hướng dẫn (Vui lòng đọc kỹ)"
            };
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                // Set màu cho Header
                if (i == 14) { // Index cột Ghi chú đã thay đổi
                    cell.setCellStyle(headerCellStyle);
                } else if (i >= 9) { // Nhóm Variant
                    cell.setCellStyle(columns[i].contains("(*)") ? requiredCellStyle : variantCellStyle);
                } else { // Nhóm Product
                    cell.setCellStyle(columns[i].contains("(*)") ? requiredCellStyle : headerCellStyle);
                }
            }

            // Style cho các ô dữ liệu trong dòng mẫu (có border)
            CellStyle dataCellStyle = workbook.createCellStyle();
            dataCellStyle.setBorderTop(BorderStyle.MEDIUM);
            dataCellStyle.setBorderBottom(BorderStyle.MEDIUM);
            dataCellStyle.setBorderLeft(BorderStyle.MEDIUM);
            dataCellStyle.setBorderRight(BorderStyle.MEDIUM);
            dataCellStyle.setAlignment(HorizontalAlignment.CENTER); // Căn giữa
            dataCellStyle.setVerticalAlignment(VerticalAlignment.CENTER); // Căn giữa
            dataCellStyle.setWrapText(true); // Chống tràn chữ cho các ô dữ liệu thường
            // --- 1. LẤY DATA VÀ TẠO MẪU ĐỘNG VÀO HIDDENSHEET ---
            List<Category> categories = categoryRepository.findAll();
            List<Brand> brands = brandRepository.findAll();
            int rowIndex = 0;
            for (Category cat : categories) {
                Row row = hiddenSheet.createRow(rowIndex++);

                // Cột A: Tên Danh mục
                row.createCell(0).setCellValue(cat.getName());

                // Cột B: Mẫu Thông số kỹ thuật (JSON)
                String specTemplate = getSpecTemplateForCategory(cat.getId());
                row.createCell(1).setCellValue(specTemplate);

                // Cột C: Mẫu Thuộc tính biến thể (JSON)
                String varTemplate = getVariantTemplateForCategory(cat.getId());
                row.createCell(2).setCellValue(varTemplate);
            }
            // Ghi danh sách Brand vào Cột D (để làm validation cho thương hiệu)
            for (int i = 0; i < brands.size(); i++) {
                Row row = hiddenSheet.getRow(i);
                if (row == null)
                    row = hiddenSheet.createRow(i);
                row.createCell(3).setCellValue(brands.get(i).getName());
            }
            // Ghi danh sách Brand vào Cột D (để làm validation cho thương hiệu)
            for (int i = 0; i < brands.size(); i++) {
                Row row = hiddenSheet.getRow(i);
                if (row == null)
                    row = hiddenSheet.createRow(i);
                row.createCell(3).setCellValue(brands.get(i).getName());
            }
            // Ghi Có/Không vào Cột E
            hiddenSheet.getRow(0).createCell(4).setCellValue("Có");
            hiddenSheet.getRow(1).createCell(4).setCellValue("Không");
            workbook.setSheetHidden(1, true);
            // --- 2. TẠO DATA VALIDATION THÔNG MINH ---
            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            // 1. Validation Danh mục (Cột B - index 1)
            DataValidationConstraint catConstraint = validationHelper
                    .createFormulaListConstraint("HiddenData!$A$1:$A$" + categories.size());
            sheet.addValidationData(
                    validationHelper.createValidation(catConstraint, new CellRangeAddressList(1, 1000, 1, 1)));
            // Validation Thương hiệu (Cột C - index 2) -> Lấy từ Cột D của HiddenData
            DataValidationConstraint brandConstraint = validationHelper
                    .createFormulaListConstraint("HiddenData!$D$1:$D$" + brands.size());
            sheet.addValidationData(
                    validationHelper.createValidation(brandConstraint, new CellRangeAddressList(1, 1000, 2, 2)));
            // Validation Có/Không (Cột H, I - index 7, 8) -> Lấy từ Cột E
            DataValidationConstraint booleanConstraint = validationHelper
                    .createFormulaListConstraint("HiddenData!$E$1:$E$2");
            sheet.addValidationData(
                    validationHelper.createValidation(booleanConstraint, new CellRangeAddressList(1, 1000, 7, 8)));
            // ================== TRỌNG TÂM ================== //

            // Validation Thông số KT (Cột G - index 6) phụ thuộc vào Cột Danh mục (Cột B)
            String specFormula = "OFFSET(HiddenData!$B$1, MATCH($B2, HiddenData!$A$1:$A$1000, 0)-1, 0, 1, 1)";
            DataValidationConstraint specConstraint = validationHelper.createFormulaListConstraint(specFormula);
            DataValidation specValidation = validationHelper.createValidation(specConstraint,
                    new CellRangeAddressList(1, 1000, 6, 6));
            specValidation.setShowErrorBox(false); // CỰC KỲ QUAN TRỌNG: Tắt báo lỗi để user có thể điền text vào mẫu
            sheet.addValidationData(specValidation);
            // Validation Thuộc tính Biến thể (Cột N - index 13) phụ thuộc vào Cột Danh mục
            // (Cột B)
            String varFormula = "OFFSET(HiddenData!$C$1, MATCH($B2, HiddenData!$A$1:$A$1000, 0)-1, 0, 1, 1)";
            DataValidationConstraint varConstraint = validationHelper.createFormulaListConstraint(varFormula);
            DataValidation varValidation = validationHelper.createValidation(varConstraint,
                    new CellRangeAddressList(1, 1000, 13, 13));
            varValidation.setShowErrorBox(false); // Tắt báo lỗi
            sheet.addValidationData(varValidation);
            // --- TẠO DÒNG MẪU (SAMPLE ROW) ---
            Row sampleRow = sheet.createRow(1);
            sampleRow.setHeightInPoints(60); // Dòng mẫu cho cao lên

            // Áp dụng style wrap text cho các ô dropdown trong dòng mẫu
            Cell sampleCategoryCell = sampleRow.createCell(1);
            sampleCategoryCell.setCellValue(categories.isEmpty() ? "Laptop" : categories.get(0).getName());
            sampleCategoryCell.setCellStyle(dropdownDataCellStyle);

            Cell sampleBrandCell = sampleRow.createCell(2);
            sampleBrandCell.setCellValue(brands.isEmpty() ? "Apple" : brands.get(0).getName());
            sampleBrandCell.setCellStyle(dropdownDataCellStyle);

            sampleRow.createCell(0).setCellValue("MacBook Pro M3 2023");
            sampleRow.createCell(3).setCellValue("https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80");
            sampleRow.createCell(4).setCellValue("Siêu phẩm laptop Apple");
            sampleRow.createCell(5).setCellValue(
                    "Trang bị chip M3 cực mạnh mẽ, màn hình Liquid Retina XDR sắc nét, thời lượng pin vượt trội, là lựa chọn hàng đầu cho công việc sáng tạo và giải trí đỉnh cao.");

            // Áp dụng style wrap text cho ô JSON mẫu
            Cell sampleSpecCell = sampleRow.createCell(6);
            sampleSpecCell.setCellValue("{\"CPU\":\"Apple M3\", \"Màn hình\":\"14 inch\"}");
            sampleSpecCell.setCellStyle(jsonDataCellStyle);

            sampleRow.createCell(7).setCellValue("Có");
            sampleRow.createCell(8).setCellValue("Có");
            // Dữ liệu mẫu cho các cột biến thể (đã xóa SKU)
            sampleRow.createCell(9).setCellValue("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80\r\n" + //
                                "");
            sampleRow.createCell(10).setCellValue(39990000);
            sampleRow.createCell(11).setCellValue(41990000);
            sampleRow.createCell(12).setCellValue(100);
            Cell sampleVariantCell = sampleRow.createCell(13);
            sampleVariantCell.setCellValue("{\"color\":\"Bạc\", \"ram\":\"16GB\", \"storage\":\"512GB\"}");
            sampleVariantCell.setCellStyle(jsonDataCellStyle);

            // --- LỜI NHẮN HƯỚNG DẪN ---
            Cell noteCell = sampleRow.createCell(14);
            noteCell.setCellValue(
                    "QUY TẮC NHẬP DỮ LIỆU TỪ EXCEL (Vui lòng đọc kỹ):\n\n" +
                            "1. BẮT BUỘC NHẬP: Các cột có tiêu đề MÀU ĐỎ (*) là bắt buộc. Các cột có tiêu đề MÀU XANH hoặc TRẮNG có thể để trống.\n\n"
                            +
                            "2. CHỌN TỪ DANH SÁCH: Cột [Danh mục], [Thương hiệu] và [Nổi bật/Mới] BẮT BUỘC phải click chọn từ danh sách xổ xuống (Dropdown) để đảm bảo dữ liệu khớp với hệ thống, tránh lỗi sai chính tả.\n\n"
                            +
                            "3. NHẬP JSON THÔNG MINH (Cực kỳ quan trọng):\n" +
                            "   - Bước 1: Bạn bắt buộc phải chọn [Danh mục] trước.\n" +
                            "   - Bước 2: Click vào ô [Thông số KT] hoặc [Thuộc tính biến thể], nhấn vào mũi tên xổ xuống bên cạnh ô để chọn mẫu khung JSON đã được hệ thống tạo sẵn.\n"
                            +
                            "   - Bước 3: Di chuyển con trỏ chuột và chỉ điền giá trị của bạn vào phần trống giữa các dấu ngoặc kép (Ví dụ: \"color\":\"Đen\", \"ram\":\"16GB\").\n"
                            +
                            "   ⚠️ LƯU Ý: Tuyệt đối KHÔNG xóa các dấu ngoặc kép (\"), dấu phẩy (,) hoặc dấu ngoặc nhọn ({}) để tránh gây lỗi hệ thống.\n\n"
                            +
                            "4. NHẬP SẢN PHẨM CÓ NHIỀU BIẾN THỂ (Nhiều màu sắc, RAM, ROM...):\n" +
                            "   - Dòng đầu tiên: Nhập đầy đủ toàn bộ thông tin sản phẩm và biến thể 1.\n" +
                            "   - Các dòng tiếp theo: Chỉ cần gõ lại đúng [Tên sản phẩm] ở cột A. Sau đó bỏ trống các cột chung (Danh mục, Thương hiệu, Mô tả...) và chỉ điền dữ liệu cho các cột thuộc nhóm Biến thể (Từ cột Ảnh biến thể URL đến Thuộc tính biến thể JSON).\n\n"
                            +
                            "5. ĐỊNH DẠNG SỐ: Cột [Giá bán], [Giá gốc] và [Tồn kho] CHỈ được nhập số nguyên (Ví dụ: 3500000), tuyệt đối KHÔNG nhập dấu phẩy, dấu chấm hay chữ (VD: sai -> 3,500,000đ).\n\n"
                            +
                            "6. HÌNH ẢNH: Cột Ảnh đại diện và Ảnh biến thể hiện tại sử dụng đường dẫn URL. Hãy copy link ảnh trực tiếp (Ví dụ: https://domain.com/anh.jpg) dán vào ô.");
            noteCell.setCellStyle(noteCellStyle);
            // Yêu cầu: Thêm viền đậm cho 15 hàng và 14 cột đầu tiên
            for (int r = 1; r <= 15; r++) { // Lặp qua 15 dòng dữ liệu (từ dòng index 1 đến 15)
                Row dataRow = sheet.getRow(r);
                if (dataRow == null)
                    dataRow = sheet.createRow(r);

                for (int c = 0; c < 14; c++) { // Lặp qua 14 cột (từ cột index 0 đến 13)
                    Cell dataCell = dataRow.getCell(c);
                    if (dataCell == null)
                        dataCell = dataRow.createCell(c);

                    // Chỉ áp dụng style nếu ô chưa có style đặc biệt (tránh ghi đè style của dòng
                    // mẫu)
                    if (dataCell.getCellStyle() == null || dataCell.getCellStyle().getIndex() == 0) {
                        if (c == 6 || c == 13) { // Cột Thông số KT và Thuộc tính biến thể
                            dataCell.setCellStyle(jsonDataCellStyle);
                        } else if (c == 1 || c == 2 || c == 7 || c == 8) { // Các cột dropdown
                            dataCell.setCellStyle(dropdownDataCellStyle);
                        } else { // Các cột còn lại
                            dataCell.setCellStyle(dataCellStyle);
                        }
                    }
                }
            }
            // --- CĂN CHỈNH CHIỀU RỘNG CỘT ---
            for (int i = 0; i < columns.length; i++) {
                if (i == 5)
                    sheet.setColumnWidth(i, 30 * 256);
                else if (i == 6 || i == 13) // Cột JSON
                    sheet.setColumnWidth(i, 35 * 256);
                else if (i == 14) { // Cột Ghi chú
                    sheet.setColumnWidth(i, 100 * 256); // Tăng độ rộng cột
                }
                else
                    sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    // Hàm sinh mẫu JSON Thông số kỹ thuật
    // Cần lấy ID từ categoryRepository.findByName() để khớp với dữ liệu thực tế
    // =====================================================================
    // HÀM 1: SINH MẪU JSON CHO CỘT "THÔNG SỐ KT"
    // =====================================================================
    private String getSpecTemplateForCategory(Long categoryId) {
        // Khuyến nghị: Thay vì name, ở CSDL nếu bạn có lưu 'slug' danh mục thì dùng
        // slug sẽ chuẩn nhất.
        // Ở đây giả sử ta tìm kiếm theo tên (chuyển sang chữ thường để dễ so sánh)
        String categoryName = categoryRepository.findById(categoryId)
                .map(c -> c.getName().toLowerCase())
                .orElse("");
        if (categoryName.contains("điện thoại") || categoryName.contains("máy tính bảng")) {
            return "{\"Chip\":\"\", \"Màn hình\":\"\", \"Camera sau\":\"\", \"Camera trước\":\"\", \"Pin\":\"\", \"Sạc nhanh\":\"\"}";
        } else if (categoryName.contains("laptop") || categoryName.contains("macbook")) {
            return "{\"CPU\":\"\", \"Card đồ họa (VGA)\":\"\", \"Màn hình\":\"\", \"Hệ điều hành\":\"\", \"Trọng lượng\":\"\"}";
        } else if (categoryName.contains("đồng hồ")) {
            return "{\"Đường kính mặt\":\"\", \"Chất liệu mặt\":\"\", \"Thời lượng pin\":\"\", \"Chống nước\":\"\"}";
        } else if (categoryName.contains("tai nghe")) {
            return "{\"Cổng sạc\":\"\", \"Công nghệ âm thanh\":\"\", \"Thời gian sử dụng\":\"\", \"Chống ồn\":\"\"}";
        } else if (categoryName.contains("loa")) {
            return "{\"Công suất\":\"\", \"Thời gian sử dụng\":\"\", \"Cổng kết nối\":\"\"}";
        } else if (categoryName.contains("bàn phím") || categoryName.contains("chuột")) {
            return "{\"Tương thích\":\"\", \"Đèn LED\":\"\", \"Độ phân giải (DPI)\":\"\", \"Trọng lượng\":\"\"}";
        } else if (categoryName.contains("màn hình")) {
            return "{\"Độ phân giải\":\"\", \"Tần số quét\":\"\", \"Tấm nền\":\"\", \"Cổng kết nối\":\"\"}";
        } else if (categoryName.contains("máy ảnh")) {
            return "{\"Cảm biến\":\"\", \"Ống kính\":\"\", \"Quay phim\":\"\", \"ISO\":\"\"}";
        } else if (categoryName.contains("tivi")) {
            return "{\"Độ phân giải\":\"\", \"Hệ điều hành\":\"\", \"Công nghệ hình ảnh\":\"\", \"Công nghệ âm thanh\":\"\"}";
        } else if (categoryName.contains("tủ lạnh")) {
            return "{\"Dung tích sử dụng\":\"\", \"Công nghệ tiết kiệm điện\":\"\", \"Kiểu tủ\":\"\"}";
        } else if (categoryName.contains("máy giặt")) {
            return "{\"Khối lượng giặt\":\"\", \"Động cơ\":\"\", \"Tốc độ quay vắt\":\"\", \"Chương trình giặt\":\"\"}";
        } else if (categoryName.contains("điều hòa") || categoryName.contains("quạt")) {
            return "{\"Phạm vi làm lạnh\":\"\", \"Công nghệ Inverter\":\"\", \"Loại Gas\":\"\"}";
        } else if (categoryName.contains("áo") || categoryName.contains("quần") || categoryName.contains("giày")
                || categoryName.contains("balo")) {
            return "{\"Chất liệu\":\"\", \"Nơi sản xuất\":\"\", \"Thương hiệu\":\"\"}";
        }
        // Mặc định cho các danh mục không khớp
        return "{\"Đặc điểm 1\":\"\", \"Đặc điểm 2\":\"\"}";
    }

    // Hàm sinh mẫu JSON Thuộc tính biến thể
    // Cần lấy ID từ categoryRepository.findByName() để khớp với dữ liệu thực tế
    // =====================================================================
    // HÀM 2: SINH MẪU JSON CHO CỘT "THUỘC TÍNH BIẾN THỂ"
    // Dịch chính xác từ file categoryConfig.js bên Frontend
    // =====================================================================
    private String getVariantTemplateForCategory(Long categoryId) {
        String categoryName = categoryRepository.findById(categoryId)
                .map(c -> c.getName().toLowerCase())
                .orElse("");
        // Nhóm: Thiết bị công nghệ
        if (categoryName.contains("điện thoại") || categoryName.contains("máy tính bảng")) {
            // ["color", "storage", "ram"] -> Sửa thành key tiếng Anh
            return "{\"color\":\"\", \"storage\":\"\", \"ram\":\"\"}";
        } else if (categoryName.contains("laptop") || categoryName.contains("macbook")) {
            // ["color", "ram", "ssd"] -> Sửa thành key tiếng Anh
            return "{\"color\":\"\", \"ram\":\"\", \"ssd\":\"\"}";
        } else if (categoryName.contains("đồng hồ")) {
            // ["color", "size", "material"] -> Sửa thành key tiếng Anh
            return "{\"color\":\"\", \"size\":\"\", \"material\":\"\"}";
        }
        // Nhóm: Phụ kiện & Âm thanh
        else if (categoryName.contains("tai nghe") || categoryName.contains("chuột")) {
            // ["color", "connection"] -> Sửa thành key tiếng Anh
            return "{\"color\":\"\", \"connection\":\"\"}";
        } else if (categoryName.contains("loa")) {
            // ["color", "power", "connection"] -> Sửa thành key tiếng Anh
            return "{\"color\":\"\", \"power\":\"\", \"connection\":\"\"}";
        } else if (categoryName.contains("bàn phím")) {
            // ["color", "switchType", "connection"] -> Sửa thành key tiếng Anh
            return "{\"color\":\"\", \"switchType\":\"\", \"connection\":\"\"}";
        } else if (categoryName.contains("màn hình")) {
            // ["color", "screenSize", "resolution"] -> Sửa thành key tiếng Anh
            return "{\"color\":\"\", \"screenSize\":\"\", \"resolution\":\"\"}";
        } else if (categoryName.contains("máy ảnh")) {
            // ["color", "resolution"] -> Sửa thành key tiếng Anh
            return "{\"color\":\"\", \"resolution\":\"\"}";
        } else if (categoryName.contains("sạc dự phòng")) {
            // ["battery", "color"] -> Sửa thành key tiếng Anh
            return "{\"battery\":\"\", \"color\":\"\"}";
        } else if (categoryName.contains("ốp lưng")) {
            // ["color", "material"] -> Sửa thành key tiếng Anh
            return "{\"color\":\"\", \"material\":\"\"}";
        }
        // Nhóm: Điện máy & Gia dụng
        else if (categoryName.contains("tivi")) {
            // ["screenSize", "resolution"] -> Sửa thành key tiếng Anh
            return "{\"screenSize\":\"\", \"resolution\":\"\"}";
        } else if (categoryName.contains("tủ lạnh")) {
            // ["fridgeCapacity", "color"] -> Sửa thành key tiếng Anh
            return "{\"fridgeCapacity\":\"\", \"color\":\"\"}";
        } else if (categoryName.contains("máy giặt")) {
            // ["washingCapacity", "color"] -> Sửa thành key tiếng Anh
            return "{\"washingCapacity\":\"\", \"color\":\"\"}";
        } else if (categoryName.contains("điều hòa")) {
            // ["coolingCapacity"] -> Sửa thành key tiếng Anh
            return "{\"coolingCapacity\":\"\"}";
        } else if (categoryName.contains("quạt điều hòa")) {
            // ["power", "color"] -> Sửa thành key tiếng Anh
            return "{\"power\":\"\", \"color\":\"\"}";
        }
        // Nhóm: Thời trang
        else if (categoryName.contains("balo") || categoryName.contains("túi xách")) {
            // ["color", "size", "material"] -> Sửa thành key tiếng Anh
            return "{\"color\":\"\", \"size\":\"\", \"material\":\"\"}";
        } else if (categoryName.contains("quần áo") || categoryName.contains("giày") || categoryName.contains("dép")) {
            // ["size", "color"] -> Sửa thành key tiếng Anh
            return "{\"size\":\"\", \"color\":\"\"}";
        }
        // Mặc định (default: ["color"])
        return "{\"color\":\"\"}";
    }

    // 2. IMPORT DỮ LIỆU
    // ... (phần này không thay đổi, vì nó đã được cập nhật để đọc đúng các cột) ...

    @Transactional
    public void importProductsFromExcel(MultipartFile file) throws IOException {
        List<String> errors = new ArrayList<>();
        System.out.println("--- Bắt đầu xử lý file Excel ---");

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<String, ProductRequest> productMap = new LinkedHashMap<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row))
                    continue;

                int rowNum = i + 1;
                try {
                    System.out.println("Đang đọc dòng: " + rowNum);

                    String productName = getCellValueAsString(row.getCell(0));
                    if (productName.isEmpty()) {
                        errors.add("Dòng " + rowNum + ": Tên sản phẩm không được để trống.");
                        continue;
                    }

                    ProductRequest request = productMap.getOrDefault(productName, new ProductRequest());
                    if (request.getName() == null) { // Lần đầu gặp sản phẩm này
                        System.out.println("  -> Sản phẩm mới: " + productName);
                        request.setName(productName);

                        String categoryName = getCellValueAsString(row.getCell(1));
                        Category category = categoryRepository.findByName(categoryName)
                                .orElseThrow(() -> new IllegalArgumentException(
                                        "Tên danh mục '" + categoryName + "' không tồn tại."));
                        request.setCategoryId(category.getId());

                        String brandName = getCellValueAsString(row.getCell(2));
                        Brand brand = brandRepository.findByName(brandName)
                                .orElseThrow(() -> new IllegalArgumentException(
                                        "Tên thương hiệu '" + brandName + "' không tồn tại."));
                        request.setBrandId(brand.getId());

                        // Đọc các trường thông tin chung của sản phẩm
                        String thumbnailUrl = getCellValueAsString(row.getCell(3));
                        if (thumbnailUrl.isEmpty()) {
                            throw new IllegalArgumentException("Ảnh đại diện URL không được để trống.");
                        }
                        request.setThumbnail(thumbnailUrl);

                        request.setShortDescription(getCellValueAsString(row.getCell(4)));

                        String description = getCellValueAsString(row.getCell(5));
                        if (description.isEmpty()) {
                            throw new IllegalArgumentException("Mô tả chi tiết không được để trống.");
                        }
                        request.setDescription(description);

                        String specifications = getCellValueAsString(row.getCell(6));
                        if (specifications.isEmpty()) {
                            throw new IllegalArgumentException("Thông số KT không được để trống.");
                        }
                        request.setSpecifications(specifications);

                        request.setThumbnail(getCellValueAsString(row.getCell(3)));
                        request.setShortDescription(getCellValueAsString(row.getCell(4)));
                        request.setDescription(getCellValueAsString(row.getCell(5)));
                        request.setSpecifications(getCellValueAsString(row.getCell(6)));
                        request.setIsFeatured("Có".equalsIgnoreCase(getCellValueAsString(row.getCell(7))));
                        request.setIsNew("Có".equalsIgnoreCase(getCellValueAsString(row.getCell(8))));

                        request.setSlug(productName.toLowerCase().replace(" ", "-"));
                        request.setVariants(new ArrayList<>());
                        productMap.put(productName, request);
                    }

                    VariantRequest variantRequest = new VariantRequest();
                    // SKU sẽ được tạo tự động ở ProductService, không cần đọc từ file
                    variantRequest.setImage(getCellValueAsString(row.getCell(9)));

                    Double price = getCellValueAsDouble(row.getCell(10));
                    if (price <= 0)
                        throw new IllegalArgumentException("Giá bán phải lớn hơn 0.");
                    variantRequest.setPrice(price);

                    variantRequest.setCompareAtPrice(getCellValueAsDouble(row.getCell(11)));

                    Double stock = getCellValueAsDouble(row.getCell(12));
                    if (stock < 0)
                        throw new IllegalArgumentException("Tồn kho không được là số âm.");
                    variantRequest.setStock(stock.intValue());

                    String attributesJson = getCellValueAsString(row.getCell(13));
                    if (attributesJson.isEmpty()) {
                        throw new IllegalArgumentException("Thuộc tính biến thể không được để trống.");
                    }
                    variantRequest.setAttributes(attributesJson);

                    // === FIX & LOGGING: Thêm biến thể vào sản phẩm tương ứng ===
                    request.getVariants().add(variantRequest);
                    System.out.println("  -> Đã thêm 1 biến thể cho sản phẩm '" + productName
                            + "'. Tổng số biến thể hiện tại: " + request.getVariants().size());

                } catch (IllegalArgumentException | NullPointerException e) {
                    System.err.println("Lỗi ở dòng " + rowNum + ": " + e.getMessage());
                    errors.add("Dòng " + rowNum + ": " + e.getMessage());
                }
            }

            if (!errors.isEmpty()) {
                System.err.println("Phát hiện " + errors.size() + " lỗi. Dừng import.");
                throw new AppException(ErrorCode.INVALID_EXCEL_DATA_FORMAT, String.join("\n", errors));
            }

            System.out.println("Đã đọc xong file. Bắt đầu lưu " + productMap.size() + " sản phẩm vào DB.");
            for (ProductRequest req : productMap.values()) {
                try {
                    System.out.println("  -> Đang lưu sản phẩm: " + req.getName());
                    productService.createProduct(req);
                    System.out.println("    -> Lưu thành công!");
                } catch (AppException e) {
                    // Bắt lỗi validation từ ProductValidatorService
                    System.err
                            .println("Lỗi khi lưu sản phẩm '" + req.getName() + "': " + e.getErrorCode().getMessage());
                    errors.add("Sản phẩm '" + req.getName() + "': " + e.getErrorCode().getMessage());
                }
            }
        }

        if (!errors.isEmpty()) {
            System.err.println("Phát hiện lỗi trong quá trình lưu. Dừng import.");
            throw new AppException(ErrorCode.INVALID_EXCEL_DATA_FORMAT, String.join("\n", errors));
        }
        System.out.println("--- Hoàn tất xử lý file Excel thành công ---");
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

    private boolean isRowEmpty(Row row) {
        if (row == null)
            return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK)
                return false;
        }
        return true;
    }

    private Double getCellValueAsDouble(Cell cell) {
        if (cell == null || cell.getCellType() == CellType.BLANK)
            return 0.0;
        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getNumericCellValue();
        }
        if (cell.getCellType() == CellType.STRING) {
            try {
                return Double.parseDouble(cell.getStringCellValue().trim());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Giá trị '" + cell.getStringCellValue() + "' phải là một con số.");
            }
        }
        throw new IllegalArgumentException("Định dạng ô không hợp lệ.");
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