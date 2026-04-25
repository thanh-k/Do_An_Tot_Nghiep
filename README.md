"# Do_An_Tot_Nghiep" 
📅 Nhật ký làm việc
🗓️ 14/04/2026
Nội dung thực hiện:
1	FE: 
-	Xây dựng UI quản lý user và đầu số điện thoại 
-	Áp dụng component phân trang dùng chung 
-	Xây dựng giao diện đăng ký / đăng nhập 
-	Tích hợp đăng nhập Google (OAuth2) 
-	Xây dựng giao diện quên mật khẩu (Forgot Password) 
-	Thiết kế UI nhập OTP 6 số (auto focus, dạng ô) 
-	Xây dựng flow nhiều bước: 
    +	Nhập email → gửi OTP 
    +	Nhập OTP → xác thực 
    +	Nhập mật khẩu mới 
-	Tối ưu UX: 
    +	Ẩn/hiện form theo từng bước 
    +	Thêm countdown OTP 90s 
    +	Thêm resend OTP + quay lại login 
2	BE: 
-	Xây dựng hệ thống OTP email (đăng ký + quên mật khẩu) 
-	Tích hợp gửi email bằng SMTP Gmail 
-	Xây dựng API: 
    +	Gửi OTP đăng ký 
    +	Đăng ký với OTP 
    +	Gửi OTP quên mật khẩu 
    +	Reset password bằng OTP 
-	Cập nhật validate: 
    +	Email bắt buộc 
    +	Password mạnh (≥6 ký tự, in hoa, số, ký tự đặc biệt) 
-	Tích hợp Google OAuth2: 
+	Login bằng Google 
+	Register bằng Google 
-	Sửa lỗi hệ thống: 
    +	Fix lỗi password_hash null 
    +	Fix lỗi Lazy loading (User.addresses) 
    +	Đồng bộ schema database 
-	Thiết kế thêm bảng: 
    +	email_otps (lưu OTP) 
    +	user_addresses (đa địa chỉ, đa số điện thoại) 
-	Cấu hình thời gian OTP: 90 giây 
3	DB: 
-	Cập nhật lại cấu trúc bảng users 
-	Cho phép password_hash null (user Google) 
-	Seed dữ liệu admin + đầu số điện thoại 
✍️ Người thực hiện: Thanh
🗓️ 18/04/2026
Nội dung thực hiện:
1 FE:
- Tách trang quản lý user thành:
    + Quản lý khách hàng
    + Quản lý nhân sự
- Thêm modal chi tiết user
- Fix lỗi tìm kiếm đầu số điện thoại
- Sửa hiển thị STT và quyền trên giao diện
2 BE:
- Xây dựng phân quyền động
- Hỗ trợ Super Admin tự phân quyền cho user
- Thêm role, permission, gán role cho user, gán quyền cho role
- Đồng bộ API cho quản lý khách hàng, nhân sự và vai trò
✍️ Người thực hiện: Thanh
🗓️ 20/04/2026
Nội dung thực hiện:
1. FE:
- Chuyển hệ thống phân quyền từ role-based → permission-based 
- Cập nhật ProtectedRoute kiểm tra theo permission thay vì role 
- Cập nhật AppRoutes và adminRoutes để gán permission cho từng trang 
- Ẩn/hiện menu Sidebar theo permission (không còn phụ thuộc role cứng) 
- Chặn truy cập trang nếu không đủ quyền, hiển thị thông báo rõ ràng 
- Thêm chức năng hiển thị/ẩn mật khẩu (icon mắt) cho: 
    + Trang đăng nhập 
    + Trang đăng ký 
    + Trang quên mật khẩu 
- Tối ưu UX: chỉ hiển thị các chức năng (nút, menu) đúng quyền được cấp 
2. BE:
- Sửa cấu hình SecurityConfig: 
    + Bỏ chặn cứng /api/v1/admin/** theo role ADMIN, SUPER_ADMIN 
    + Cho phép truy cập nếu đã xác thực, kiểm soát bằng permission 
- Áp dụng @PreAuthorize cho các API admin: 
    + USER_VIEW, CUSTOMER_VIEW, STAFF_VIEW 
    + USER_UPDATE, USER_DELETE, USER_LOCK 
- Fix lỗi 403 Forbidden khi user có permission nhưng không có role ADMIN 
- Hoàn thiện API khóa/mở khóa tài khoản (toggle status user)
✍️ Người thực hiện: Thanh

📅 Ngày: 21/04/2026
🧩 Nội dung công việc:
1. Hoàn thiện module Tin tức (News)
- Xây dựng backend cho: 
    + Quản lý chủ đề tin tức (News Topic) 
    + Quản lý bài viết tin tức (News Post) 
- Thiết kế đầy đủ: 
    + Entity, Repository, Service, Controller theo kiến trúc Spring Boot 
- Tạo API: 
    + Lấy danh sách chủ đề, bài viết 
    + Tạo / sửa / xóa chủ đề và bài viết 
    + Lọc bài viết theo chủ đề 
2. Xử lý upload ảnh cho bài viết
- Áp dụng lại luồng upload giống: 
    + User avatar 
    + Category image 
- Sử dụng: 
    + multipart/form-data 
    + Cloudinary 
3. Cải thiện chức năng quản trị (Admin)
- Thêm: 
    + Hiển thị số lượng bài viết theo topic 
    + Lọc bài viết theo chủ đề 
- Xây dựng: 
    + Chức năng chọn nhiều (checkbox) 
        User 
        Topic 
        Bài viết 
- Thêm thao tác hàng loạt: 
    + User: khóa / xóa 
    + Topic: ẩn / xóa 
    + Bài viết: ẩn / xuất bản / xóa 
4. Hoàn thiện giao diện frontend
- Kết nối API tin tức vào: 
    + Trang quản lý admin 
    + Trang client (hiển thị tin tức) 
- Cập nhật UI: 
    + Form thêm/sửa bài viết (có upload ảnh) 
    + Danh sách bài viết và chủ đề 
- Xử lý: 
    + Confirm khi thao tác nguy hiểm (ẩn/xóa)
✍️ Người thực hiện: Thanh

📅 Ngày: 22/04/2026
🧩 Nội dung công việc:
1. Hoàn thiện module Liên hệ (Contact) – Backend
- Xây dựng đầy đủ: 
    + Entity: ContactMessage, ContactMessageStatus 
    + DTO: request/response cho liên hệ, cập nhật trạng thái, phản hồi 
- Phát triển API: 
    + POST /contacts (khách gửi liên hệ) 
    + GET /admin/contacts (admin xem danh sách) 
    + PATCH /admin/contacts/{id}/status 
    + POST /admin/contacts/{id}/reply 
- Tích hợp gửi email phản hồi bằng MailService 
- Áp dụng phân quyền đúng chuẩn: 
    + CONTACT_VIEW 
    + CONTACT_UPDATE 
    + CONTACT_REPLY 
2. Chuẩn hóa validate dữ liệu đầu vào
- Áp dụng lại InputValidator: 
    + normalizeFullName, validateFullName 
    + normalizePhone, validatePhone 
    + normalizeEmail, validateEmail 
- Tích hợp PhonePrefixService để kiểm tra đầu số hợp lệ 
- Loại bỏ validate thủ công (regex cứng) 
- Đồng bộ validate với module User/Address 
3. Cải thiện thông báo lỗi cho người dùng
- Backend: 
    + Bổ sung ErrorCode rõ ràng cho từng field: tên, số điện thoại, email, nội dung 
- Frontend: 
    + Hiển thị lỗi theo từng input 
    + Highlight input sai (border đỏ) 
    + Không còn hiển thị lỗi chung chung 
4. Hoàn thiện giao diện Trang liên hệ (Client)
- Kết nối API thật với backend 
- Tự động điền: 
    + họ tên 
    + email 
    + số điện thoại (nếu đã đăng nhập) 
- Thêm trạng thái: 
    + loading khi gửi 
    + reset form sau khi gửi thành công 
- Hiển thị thông báo: 
    + gửi thành công 
    + lỗi chi tiết 
5. Hoàn thiện trang quản lý liên hệ (Admin)
- Hiển thị danh sách liên hệ 
- Tìm kiếm theo: 
    + tên 
    + email 
    + số điện thoại 
- Lọc theo trạng thái: 
    + NEW 
    + IN_PROGRESS 
    + REPLIED 
- Chức năng: 
    + cập nhật trạng thái 
    + gửi phản hồi email cho khách 
6. Fix lỗi phát sinh
- Fix lỗi icon lucide-react (MailReply không tồn tại) 
- Fix lỗi validate chưa đồng bộ 
- Fix lỗi hiển thị message không rõ ràng 
- Kiểm tra và đảm bảo API hoạt động đúng với frontend 
✍️ Người thực hiện: Thanh
📅 Ngày: 24/04/2026
🧩 Nội dung công việc:
1. Đồng bộ source code từ nhánh dev sang nhánh cá nhân
- Lấy code mới từ branch dev về branch cá nhân `thanh`
- Kiểm tra các thay đổi sau khi đồng bộ source
- Rà soát lại các module frontend bị ảnh hưởng sau khi merge code nhóm

2. Xử lý lỗi phát sinh ở Frontend sau khi lấy code từ branch dev
- Fix lỗi trùng key trong Sidebar admin:
    + /admin
    + /admin/products
    + /admin/categories
    + /admin/orders
    + /admin/profile
- Kiểm tra và loại bỏ các menu / route bị khai báo trùng
- Đồng bộ lại hiển thị menu theo permission

3. Sửa lỗi chức năng quản lý sản phẩm
- Fix lỗi khi bấm “Sửa sản phẩm” bị crash
- Xử lý trường hợp dữ liệu specifications không đúng định dạng JSON
- Bổ sung parse dữ liệu an toàn cho:
    + specifications
    + variant attributes
- Đảm bảo form chỉnh sửa sản phẩm hoạt động ổn định với dữ liệu cũ

4. Kiểm tra và xử lý lỗi dữ liệu trang chủ
- Rà soát lỗi gọi API sản phẩm cho trang chủ
- Kiểm tra nguyên nhân endpoint `/products/home` bị lỗi khi frontend load dữ liệu
- Điều chỉnh hướng xử lý phía frontend để tránh làm vỡ giao diện trang chủ
- Kiểm tra lại dữ liệu hiển thị:
    + sản phẩm nổi bật
    + sản phẩm mới
    + sản phẩm giảm giá

5. Tối ưu hiển thị sản phẩm ở trang chủ
- Điều chỉnh lại khung hiển thị hình ảnh sản phẩm
- Hạn chế tình trạng ảnh bị cắt mất chi tiết khi render ra card
- Tối ưu giao diện để hình ảnh hiển thị đồng đều, đẹp hơn

6. Hoàn thiện lại source code để chuẩn bị cập nhật lên branch cá nhân
- Rà soát lại các lỗi console phía frontend
- Kiểm tra lại luồng hoạt động sau khi fix
- Hoàn thiện source FE trên branch `thanh` để tiếp tục cập nhật lên Git
✍️ Người thực hiện: Thanh

📅 Ngày: 25/04/2026
🧩 Nội dung công việc:

1 FE:
- Tối ưu giao diện điện thoại
- Chỉnh sửa hiển thị trang sản phẩm theo hướng gọn hơn trên mobile
- Tối ưu bộ lọc, danh sách sản phẩm và khung chat AI trên điện thoại

2 BE:
- Thêm API chat AI
- Kết nối frontend với backend cho chức năng tư vấn sản phẩm 
- Tối ưu phản hồi AI và hỗ trợ ngữ cảnh hội thoại
✍️ Người thực hiện: Thanh