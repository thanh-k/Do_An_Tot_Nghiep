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

📅 Ngày: 08/05/2026
🧩 Nội dung công việc:

1 FE:
- Hoàn thiện giao diện voucher VIP cho người dùng
- Hiển thị voucher VIP cho cả user thường nhưng ở trạng thái bị khóa
- Thêm thông báo “Hãy đăng ký thành viên VIP để được nhận voucher này”
- Điều chỉnh luồng hiển thị voucher để user VIP mới được nhận và sử dụng
- Kiểm tra và sửa lỗi trang quản lý chủ đề tin tức và bài viết tin tức sau khi tách service
- Rà soát lại phần gọi service admin news để đồng bộ tên hàm

2 BE:
- Hoàn thiện membership và voucher VIP
- Xử lý rule chỉ user VIP mới được nhận và sử dụng voucher VIP
- Bổ sung logic reset quota voucher VIP theo tháng
- Bổ sung logic thu hồi voucher VIP khi user hết hạn thành viên
- Kiểm tra và sửa lỗi trong VoucherServiceImpl
- Hoàn thiện luồng tính giảm giá và trừ số lượng voucher VIP theo user

✍️ Người thực hiện: Thanh

📅 Ngày: 09/05/2026
🧩 Nội dung công việc:

1 FE:
- Làm trang quản lý đánh giá bên admin
- Thêm tìm kiếm và bộ lọc đánh giá theo số sao, trạng thái hiển thị, đã mua hàng, đã phản hồi
- Thêm modal xem chi tiết đánh giá
- Thêm chức năng ẩn/hiện đánh giá
- Thêm chức năng xóa đánh giá
- Thêm giao diện phản hồi đánh giá từ shop
- Hiển thị phản hồi của shop ở phía user
- Điều chỉnh hiển thị rating và số lượng đánh giá ở trang chủ

2 BE:
- Làm API admin quản lý đánh giá
- Thêm API lấy danh sách và chi tiết đánh giá
- Thêm API ẩn/hiện đánh giá
- Thêm API xóa đánh giá
- Thêm API phản hồi đánh giá từ shop
- Bổ sung dữ liệu rating và reviewCount vào sản phẩm để FE hiển thị
- Cập nhật logic chỉ tính rating theo các đánh giá đang hiển thị

✍️ Người thực hiện: Thanh

📅 Ngày: 12/05/2026
🧩 Nội dung công việc:

1. FE:
- Hoàn thiện giao diện Xu thưởng cho phía user
- Thêm trang Xu thưởng gồm: tổng xu hiện có, nhiệm vụ nhận xu, đổi quà
- Sửa giao diện và luồng nhận xu hằng ngày
- Bổ sung bộ đếm cho nhiệm vụ online đủ 5 phút
- Sửa modal quản lý nhiệm vụ xu ở trang admin để hiển thị đúng giao diện và cuộn tốt trên màn hình nhỏ
- Hoàn thiện trang admin quản lý nhiệm vụ nhận xu: thêm, sửa, xóa, lọc theo loại nhiệm vụ

2. BE:
- Làm API cho phần Xu thưởng
- Thêm xử lý lấy tổng quan ví xu
- Thêm xử lý nhận xu nhiệm vụ hằng ngày
- Thêm xử lý cộng xu khi đánh giá sản phẩm
- Sửa lỗi overview bị 500 do transaction read-only nhưng lại tạo ví xu

✍️ Người thực hiện: Thanh

📅 Ngày: 13/05/2026
🧩 Nội dung công việc:

1. FE:
- Sửa form cập nhật sản phẩm ở trang admin
- Sửa hiển thị phần Thông số (Tên: Giá trị) về đúng dạng nhiều dòng
- Sửa validate khiến nút Lưu bị khóa sai
- Sửa logic giữ SKU cũ cho variant cũ, chỉ tạo SKU mới cho variant mới hoặc variant tách lịch sử
- Sửa trang chi tiết sản phẩm để ưu tiên chọn variant còn hàng
- Sửa hiển thị các option biến thể như màu sắc, dung lượng, RAM

2. BE:
- Sửa logic cập nhật variant sản phẩm
- Giữ đúng nghiệp vụ:
  + chỉ sửa hình -> cập nhật trực tiếp
  + chỉ sửa giá -> cập nhật trực tiếp
  + sửa thông số nhận diện variant đã có người mua -> giữ bản cũ stock = 0, tạo bản mới
- Sửa lỗi trùng SKU khi tạo variant mới từ variant cũ đã có đơn hàng
- Chuẩn hóa so sánh attributes để tránh tạo duplicate variant sai

✍️ Người thực hiện: Thanh

📅 Ngày: 14/05/2026
🧩 Nội dung công việc:

1. FE:
- Hoàn thiện chức năng theo dõi hành vi người dùng phục vụ đề xuất sản phẩm
- Gắn tracking hành vi vào các thao tác chính của người dùng:
    + Xem chi tiết sản phẩm
    + Tìm kiếm sản phẩm
    + Thêm sản phẩm vào giỏ hàng
    + Mua ngay
    + Bắt đầu thanh toán
    + Bỏ dở thanh toán
    + Đặt hàng thành công
- Thêm hiển thị sản phẩm đề xuất cá nhân hóa ở phía người dùng
- Thêm component hiển thị sản phẩm đề xuất dùng lại cho trang chủ và trang chi tiết sản phẩm
- Hoàn thiện trang quản lý hành vi người dùng bên admin
- Thêm giao diện xem thống kê hành vi:
    + Tổng lượt xem sản phẩm
    + Tổng lượt tìm kiếm
    + Tổng lượt thêm giỏ hàng
    + Tổng lượt bỏ dở thanh toán
    + Tổng lượt đặt hàng thành công
- Thêm bảng lịch sử hành vi và bảng điểm quan tâm sản phẩm
- Sửa lỗi hiển thị voucher khi có category mới `COIN_REWARD`
- Sửa lỗi trang hồ sơ user bị crash khi voucher không có cấu hình màu/icon
- Sửa logic hiển thị voucher trong hồ sơ và thanh toán:
    + Mã thường như DISCOUNT, SHIPPING, CASHBACK chỉ hiện khi user bấm lưu mã
    + Mã VIP tự hiện khi user có quyền VIP
    + Mã đổi xu COIN_REWARD tự hiện khi user đã đổi bằng xu
- Cập nhật giao diện trang Xu thưởng để hỗ trợ đổi voucher bằng xu
- Bổ sung dòng chữ chạy đầu trang giống các website thương mại điện tử
- Thêm component hiển thị thông báo chạy phía trên Header
- Thêm trang admin quản lý thông báo chạy:
    + Thêm thông báo
    + Sửa nội dung
    + Bật / tắt hiển thị
    + Đổi màu nền
    + Đổi màu chữ
    + Chỉnh tốc độ chạy
    + Xóa thông báo

2. BE:
- Thêm module theo dõi hành vi người dùng
- Thiết kế bảng lưu lịch sử hành vi người dùng `user_behavior_events`
- Thiết kế bảng lưu điểm quan tâm sản phẩm `user_product_interests`
- Xây dựng API ghi nhận hành vi:
    + POST /api/v1/behaviors/track
- Xây dựng module đề xuất sản phẩm cá nhân hóa
- Thêm API đề xuất sản phẩm:
    + GET /api/v1/recommendations/me
    + GET /api/v1/recommendations/similar/{productId}
- Xây dựng logic tính điểm quan tâm sản phẩm dựa trên hành vi:
    + VIEW_PRODUCT
    + SEARCH_PRODUCT
    + ADD_TO_CART
    + BUY_NOW
    + START_CHECKOUT
    + ABANDON_CHECKOUT
    + PLACE_ORDER
- Thêm API admin quản lý hành vi người dùng:
    + GET /api/v1/admin/behaviors/summary
    + GET /api/v1/admin/behaviors
    + GET /api/v1/admin/behaviors/interests
- Thêm permission quản lý hành vi:
    + BEHAVIOR_VIEW
- Sửa logic voucher đổi bằng xu
- Thêm category voucher `COIN_REWARD` dùng riêng cho voucher đổi bằng xu
- Thêm field `coinCost` để admin có thể chỉnh số xu cần dùng để đổi voucher
- Bổ sung seed sẵn 3 voucher đổi xu:
    + COIN20K
    + COIN50K
    + COIN10P
- Sửa logic đồng bộ voucher VIP để không xóa nhầm voucher đổi bằng xu của user
- Sửa logic cashback đơn hàng
- Chỉ cộng 15 xu khi đơn hàng có áp voucher thuộc category `CASHBACK`
- Không cộng xu cho đơn hàng nếu user không áp mã cashback
- Đảm bảo mỗi đơn hàng chỉ được cộng xu cashback một lần
- Thêm module thông báo chạy đầu trang
- Thiết kế bảng `announcement_bars`
- Xây dựng API client lấy thông báo đang bật:
    + GET /api/v1/announcement-bar/active
- Xây dựng API admin quản lý thông báo chạy:
    + GET /api/v1/admin/announcement-bars
    + POST /api/v1/admin/announcement-bars
    + PUT /api/v1/admin/announcement-bars/{id}
    + PATCH /api/v1/admin/announcement-bars/{id}/toggle
    + DELETE /api/v1/admin/announcement-bars/{id}
- Thêm permission:
    + ANNOUNCEMENT_VIEW
    + ANNOUNCEMENT_MANAGE
- Seed sẵn dữ liệu thông báo chạy mặc định cho website

3. Fix lỗi phát sinh:
- Fix lỗi API `/api/v1/behaviors/track` trả 500 làm đỏ console phía frontend
- Fix lỗi thiếu biến môi trường `JWT_SECRET` khiến backend không khởi động được
- Fix lỗi `VoucherPage.jsx` đọc category không có icon
- Fix lỗi `UserDashboard.jsx` đọc category không có màu nền `bg`
- Fix lỗi voucher đổi bằng xu không hiện trong hồ sơ và thanh toán
- Fix lỗi checkout chỉ lấy voucher đã lưu trong localStorage mà không lấy voucher VIP và voucher đổi xu
- Fix logic hiển thị voucher để tránh toàn bộ user đều thấy tất cả mã
- Fix logic cashback để chỉ áp dụng khi user dùng mã voucher thuộc loại hoàn xu
- Kiểm tra lại luồng hiển thị voucher ở:
    + Trang Voucher
    + Trang hồ sơ user
    + Trang thanh toán
    + Trang Xu thưởng

✍️ Người thực hiện: Thanh

📅 Ngày: 15/05/2026
🧩 Nội dung công việc:

1. FE:
- Tối ưu giao diện Header trên mobile
- Chỉnh lại bố cục Header mobile theo hướng gọn hơn:
    + Logo bên trái
    + Thanh tìm kiếm nằm ngoài menu 3 gạch
    + Nút menu 3 gạch bên phải
- Bổ sung icon tìm kiếm bằng hình ảnh vào trong thanh tìm kiếm
- Sửa `SearchBar.jsx` để hỗ trợ:
    + Tìm kiếm sản phẩm bằng từ khóa
    + Điều hướng sang trang tìm kiếm bằng hình ảnh
- Tối ưu menu 3 gạch trên mobile
- Rút gọn menu 3 gạch chỉ còn các mục thông tin phụ:
    + Tin tức
    + Liên hệ
    + Xu thưởng
    + Giới thiệu
    + So sánh sản phẩm
- Không đưa các mục Trang chủ, Sản phẩm, Giỏ hàng, Tài khoản vào menu 3 gạch vì đã có thanh điều hướng mobile riêng
- Thêm và tinh chỉnh thanh điều hướng dưới màn hình trên mobile/tablet
- Cập nhật `MobileBottomNav.jsx` gồm các mục:
    + Trang chủ
    + Cửa hàng
    + Giỏ hàng
    + Tài khoản
- Bỏ mục Thông báo trong thanh điều hướng mobile vì hệ thống chưa làm chức năng thông báo
- Điều chỉnh kích thước icon và chữ tự thích ứng theo màn hình:
    + Điện thoại nhỏ
    + Điện thoại lớn
    + Tablet/iPad
- Tối ưu drawer Danh mục và Tài khoản trên mobile
- Bổ sung các liên kết nhanh trong tài khoản mobile:
    + Hồ sơ
    + Đơn hàng
    + Yêu thích
    + Giỏ hàng
    + Ví voucher
    + Xu thưởng
    + Trang quản trị nếu user có quyền admin
- Cập nhật `MainLayout.jsx` để gắn `MobileBottomNav`
- Thêm padding bottom cho layout mobile để nội dung không bị thanh điều hướng dưới che mất

2. Fix lỗi / tinh chỉnh giao diện:
- Fix lỗi mobile menu hiển thị quá nhiều thông tin gây rối giao diện
- Fix lỗi thanh điều hướng mobile bị lệch khi bỏ chức năng Thông báo
- Fix icon tìm kiếm hình ảnh chưa hiển thị trong thanh tìm kiếm
- Tối ưu Header mobile để giống giao diện các website thương mại điện tử hơn
- Kiểm tra lại hiển thị trên giao diện mobile sau khi deploy web

✍️ Người thực hiện: Thanh

📅 Ngày: 24/05/2026
🧩 Nội dung công việc:
1. FE:

- Hoàn thiện chức năng yêu cầu hủy tài khoản cho người dùng
- Thêm nút "Yêu cầu hủy tài khoản" trong trang hồ sơ cá nhân
- Xây dựng giao diện gửi yêu cầu hủy tài khoản
- Thêm trang quản lý yêu cầu hủy tài khoản cho quản trị viên
- Hiển thị danh sách yêu cầu hủy tài khoản và trạng thái xử lý
- Hiển thị thông tin người dùng gửi yêu cầu hủy tài khoản
- Bổ sung cảnh báo khi người dùng còn đơn hàng chưa hoàn thành
- Ẩn nút duyệt yêu cầu hủy tài khoản nếu khách hàng còn đơn hàng đang xử lý
- Loại bỏ chức năng ngưng hoạt động trực tiếp khỏi trang quản lý khách hàng
- Chỉ cho phép ngưng hoạt động tài khoản thông qua luồng yêu cầu hủy tài khoản

- Hoàn thiện giao diện trang Xu thưởng
- Tối ưu lại bố cục hiển thị tổng xu hiện có
- Tách riêng khu vực nhiệm vụ nhận xu theo từng nhóm nghiệp vụ
- Bổ sung nút "Đổi quà" trực tiếp trong khu vực ví xu
- Xây dựng modal đổi voucher bằng xu
- Hoàn thiện giao diện đổi voucher theo số dư xu hiện có
- Điều chỉnh giao diện nhiệm vụ nhận xu theo hướng trực quan và dễ sử dụng hơn

- Chuẩn hóa hiển thị dữ liệu quản trị theo thời gian tạo mới nhất
- Áp dụng sắp xếp mới nhất → cũ nhất cho:
    + Quản lý khách hàng
    + Yêu cầu hủy tài khoản
    + Quản lý nhân sự
    + Vai trò & quyền
    + Đầu số điện thoại
    + Gói VIP
    + Nhiệm vụ nhận xu
    + Đánh giá
    + Chủ đề tin tức
    + Bài viết tin tức
    + Liên hệ
    + Theo dõi hành vi người dùng

- Rà soát và sửa lỗi theo dõi hành vi người dùng trên môi trường deploy
- Kiểm tra cấu hình service tracking giữa môi trường local và production
- Chuẩn hóa cách gọi API ghi nhận hành vi theo cấu trúc service chung của hệ thống
- Loại bỏ cấu hình localhost cố định gây lỗi khi deploy
- Kiểm tra lại các hành vi:
    + Xem sản phẩm
    + Tìm kiếm sản phẩm
    + Thêm vào giỏ hàng
    + Mua ngay
    + Bắt đầu thanh toán
    + Bỏ dở thanh toán
    + Đặt hàng thành công
- Kiểm tra lại hiển thị dữ liệu trong trang quản lý hành vi người dùng

2. BE:

- Hoàn thiện chức năng ngưng hoạt động tài khoản theo cơ chế Soft Delete
- Không xóa vật lý dữ liệu người dùng khỏi cơ sở dữ liệu
- Bảo toàn:
    + Đơn hàng
    + Đánh giá sản phẩm
    + Lịch sử giao dịch
    + Dữ liệu hành vi người dùng
- Chặn đăng nhập đối với tài khoản đã ngưng hoạt động
- Chuẩn hóa hiển thị đánh giá của tài khoản đã ngưng hoạt động với tên:
    + "Tài khoản đã ngưng hoạt động"

- Xây dựng luồng xử lý yêu cầu hủy tài khoản
- Thêm API gửi yêu cầu hủy tài khoản
- Thêm API quản lý yêu cầu hủy tài khoản cho admin
- Kiểm tra điều kiện duyệt yêu cầu:
    + Không cho phép ngưng hoạt động nếu còn đơn hàng chưa hoàn thành
- Trả về trạng thái kiểm tra đơn hàng để frontend hiển thị cảnh báo

- Hoàn thiện hệ thống nhiệm vụ nhận xu
- Tách nhiệm vụ thành các nhóm độc lập:
    + DAILY_LOGIN
    + ONLINE_DURATION
    + REVIEW_NO_IMAGE
    + REVIEW_WITH_IMAGE
- Bổ sung cấu hình thời gian hoạt động cho nhiệm vụ ONLINE_DURATION
- Hoàn thiện xử lý chỉ nhận nhiệm vụ hoạt động đủ thời gian một lần mỗi ngày
- Hoàn thiện xử lý nhận xu cho đánh giá sản phẩm có hình ảnh
- Hoàn thiện xử lý nhận xu cho đánh giá sản phẩm không có hình ảnh
- Đảm bảo đánh giá có hình không nhận trùng phần thưởng của đánh giá không hình

3. Fix lỗi phát sinh:

- Fix lỗi chức năng theo dõi hành vi người dùng không hoạt động trên môi trường deploy
- Fix lỗi service tracking sử dụng localhost cố định
- Fix lỗi đồng bộ dữ liệu hành vi giữa frontend và backend
- Fix lỗi hiển thị nhiệm vụ nhận xu chưa phân loại đúng nhóm
- Fix lỗi giao diện đổi voucher bằng xu trên màn hình nhỏ
- Fix lỗi hiển thị danh sách quản trị chưa sắp xếp theo thời gian tạo mới nhất
- Kiểm tra và tối ưu lại trải nghiệm người dùng trên các chức năng mới

✍️ Người thực hiện: Thanh

📅 Ngày: 25/05/2026
🧩 Nội dung công việc:
1. FE:

- Hoàn thiện chức năng quản lý địa chỉ giao hàng cho người dùng
- Cho phép người dùng lưu nhiều địa chỉ giao hàng trong hồ sơ cá nhân
- Bổ sung trường Người nhận độc lập với tên tài khoản đăng nhập
- Cho phép người dùng đặt tên người nhận tùy ý cho từng địa chỉ
- Hỗ trợ thiết lập địa chỉ mặc định

- Tối ưu quy trình thanh toán (Checkout)
- Loại bỏ yêu cầu nhập lại toàn bộ thông tin giao hàng khi thanh toán
- Tự động lấy thông tin địa chỉ đã lưu từ hồ sơ người dùng
- Hiển thị địa chỉ mặc định trong trang thanh toán
- Bổ sung chức năng chọn địa chỉ giao hàng đã lưu
- Cho phép thêm địa chỉ mới trực tiếp tại trang thanh toán
- Đồng bộ dữ liệu địa chỉ giữa hồ sơ cá nhân và trang thanh toán
- Thiết kế giao diện lựa chọn địa chỉ theo hướng tương tự các sàn thương mại điện tử

- Hoàn thiện component AddressSelector
- Tích hợp API địa giới hành chính Việt Nam
- Tự động tải:
    + Tỉnh/Thành phố
    + Quận/Huyện
    + Phường/Xã
- Tự động ghép địa chỉ đầy đủ từ dữ liệu đã chọn

- Khắc phục lỗi vòng lặp render React
- Sửa lỗi:
    Maximum update depth exceeded
- Tối ưu useEffect và callback xử lý địa chỉ
- Ngăn component AddressSelector cập nhật state lặp vô hạn
- Tối ưu hiệu năng cập nhật địa chỉ giao hàng

2. BE:

- Kiểm tra và đồng bộ API địa chỉ giao hàng
- Kiểm tra luồng lưu địa chỉ mặc định
- Kiểm tra luồng lấy danh sách địa chỉ người dùng
- Kiểm tra dữ liệu checkout sử dụng địa chỉ đã lưu
- Đảm bảo tương thích với chức năng nhiều địa chỉ giao hàng

3. Fix lỗi phát sinh:

- Fix lỗi AddressSelector gây render vô hạn
- Fix lỗi cập nhật địa chỉ giao hàng lặp liên tục
- Fix lỗi đồng bộ dữ liệu địa chỉ giữa Profile và Checkout
- Fix lỗi callback địa chỉ gây re-render nhiều lần
- Kiểm tra và tối ưu lại trải nghiệm nhập địa chỉ giao hàng

✍️ Người thực hiện: Thanh

📅 Ngày: 27/05/2026
🧩 Nội dung công việc:

1. FE:

- Hoàn thiện module tin tức công nghệ tự động trên website
- Tích hợp luồng lấy dữ liệu tin tức từ nguồn bên ngoài thông qua RSS Feed
- Kết nối dữ liệu tin tức vào trang danh sách tin tức phía người dùng
- Hoàn thiện trang chi tiết tin tức từ dữ liệu đồng bộ bên ngoài
- Hiển thị nguồn bài viết và thời gian đăng tương ứng

- Tối ưu trải nghiệm xem tin tức
- Cho phép người dùng nhấn vào bất kỳ vị trí nào trên thẻ bài viết để xem chi tiết
- Giữ lại nút "Xem chi tiết" để tăng khả năng nhận biết thao tác
- Điều chỉnh hiệu ứng hover cho toàn bộ card bài viết

- Tối ưu giao diện tin tức trên thiết bị di động
- Chuyển bố cục hiển thị bài viết từ:
    + 1 bài viết / hàng
  thành:
    + 2 bài viết / hàng
- Điều chỉnh kích thước ảnh và nội dung hiển thị phù hợp màn hình nhỏ
- Tối ưu khoảng cách và chiều cao card tin tức

- Hoàn thiện giao diện trang đăng nhập và xác thực tài khoản
- Đồng bộ màu sắc giao diện Auth với bộ nhận diện InsightShop
- Đồng bộ logo trang xác thực với Header hệ thống
- Loại bỏ các thành phần điều hướng không cần thiết gây rối giao diện
- Tinh chỉnh bố cục giữa khung giới thiệu và khung đăng nhập
- Rút gọn nội dung giới thiệu để người dùng dễ tiếp cận hơn
- Thay đổi thông điệp chào mừng phù hợp với trải nghiệm mua sắm

- Tối ưu giao diện Home
- Tách khu vực:
    + Thông tin thị trường
    + Tin mới cập nhật
- Hiển thị danh sách tin mới theo thời gian xuất bản mới nhất
- Đồng bộ giao diện danh sách tin tức với dữ liệu đồng bộ tự động

2. BE:

- Hoàn thiện module đồng bộ tin tức công nghệ từ nguồn bên ngoài
- Bổ sung hỗ trợ lưu bài viết nguồn ngoài vào hệ thống
- Thêm các trường dữ liệu:
    + sourceType
    + sourceName
    + sourceUrl
    + originalUrl
    + syncedAt
- Hoàn thiện cơ chế kiểm tra dữ liệu trùng lặp khi đồng bộ
- Tối ưu xử lý dữ liệu RSS trước khi lưu vào cơ sở dữ liệu

- Kiểm tra và sửa lỗi API đồng bộ tin tức
- Xử lý lỗi 500 tại:
    + /api/v1/admin/external-news/sync
- Kiểm tra Entity, Repository và Service liên quan
- Hoàn thiện cơ chế ghi nhận và trả về kết quả đồng bộ chính xác

3. Fix lỗi phát sinh:

- Fix lỗi đồng bộ tin tức trả về 500 Internal Server Error
- Fix lỗi kiểm tra dữ liệu bài viết nguồn ngoài
- Fix lỗi không hiển thị bài viết mới sau khi đồng bộ
- Fix lỗi danh sách tin mới cập nhật không thay đổi theo dữ liệu mới
- Fix lỗi hiển thị card tin tức trên thiết bị di động
- Kiểm tra và tối ưu lại trải nghiệm người dùng trên module tin tức

✍️ Người thực hiện: Thanh

📅 Ngày: 01/06/2026
🧩 Nội dung công việc:

1. FE:
- Hoàn thiện và đồng bộ giao diện xác thực người dùng (Authentication)
- Thiết kế lại giao diện:
    + Đăng nhập
    + Đăng ký
    + Quên mật khẩu
- Đồng bộ màu sắc, logo và bố cục với giao diện InsightShop
- Tối ưu hiển thị trên Desktop, Laptop và Mobile
- Điều chỉnh kích thước các khung hiển thị để phù hợp nhiều độ phân giải màn hình
- Tối ưu giao diện trang chủ (Home)
- Thiết kế lại khu vực Banner chính theo hướng hiện đại và trực quan hơn
- Bổ sung các khối thông tin khuyến mãi và ưu đãi bên dưới Banner
- Điều chỉnh kích thước và bố cục Banner nhằm tối ưu không gian hiển thị
- Thêm khu vực quảng bá chương trình thành viên và ưu đãi dành cho khách hàng
- Tối ưu hiển thị sản phẩm đề xuất ở trang chủ
- Khắc phục lỗi thanh cuộn phát sinh trên giao diện Home
- Kiểm tra Header, Banner và các Product Card
- Fix lỗi xuất hiện nhiều thanh cuộn gây ảnh hưởng trải nghiệm người dùng
- Xử lý hiện tượng tràn kích thước ngoài vùng hiển thị
- Tối ưu lại bố cục Banner để tương thích trên Desktop và Mobile
- Loại bỏ các hiệu ứng gây phát sinh vùng cuộn không cần thiết
- Hoàn thiện chức năng đề xuất sản phẩm theo hành vi người dùng
- Chuyển cơ chế theo dõi hành vi sang sử dụng Cookie và Session Storage
- Ghi nhận các thao tác:
    + Xem sản phẩm
    + Tìm kiếm sản phẩm
    + Thêm sản phẩm vào giỏ hàng
    + Bỏ dở thanh toán
    + Đặt hàng thành công
    + Sản phẩm có điểm quan tâm cao
- Đồng bộ dữ liệu hành vi với hệ thống AI tư vấn sản phẩm
- Hiển thị khu vực "Gợi ý dành riêng cho bạn" dựa trên hành vi người dùng
- Tăng khả năng đề xuất sản phẩm liên quan đến sản phẩm đã xem hoặc đã tìm kiếm

2. BE:
- Nâng cấp hệ thống AI Chat hỗ trợ khách hàng
- Bổ sung khả năng tư vấn sản phẩm theo thương hiệu
- AI có thể nhận diện các thương hiệu:
    + Apple
    + Samsung
    + ASUS
    + Logitech
    + Xiaomi
    + MSI
    + Acer
    + Dell
- Tìm kiếm và đề xuất sản phẩm theo thương hiệu người dùng yêu cầu
- Bổ sung khả năng tư vấn sản phẩm theo danh mục
- AI có thể nhận diện các nhóm sản phẩm:
    + Điện thoại
    + Laptop
    + Máy tính bảng
    + Đồng hồ thông minh
    + Âm thanh
    + Phụ kiện
- Kết hợp dữ liệu Category để đưa ra gợi ý chính xác hơn
- Hoàn thiện chức năng so sánh sản phẩm
- Hỗ trợ so sánh từ 2 đến 3 sản phẩm cùng danh mục
- So sánh dựa trên:
    + Giá bán
    + Thông số kỹ thuật
    + Thương hiệu
    + Mô tả sản phẩm
    + Điểm mạnh nổi bật
- Điều chỉnh luồng xử lý:
    + So sánh 2 sản phẩm → chỉ trả về 2 sản phẩm
    + So sánh 3 sản phẩm → chỉ trả về 3 sản phẩm
- Loại bỏ hiện tượng AI tự động thêm sản phẩm ngoài yêu cầu người dùng
- Tối ưu dữ liệu phản hồi để người dùng dễ đưa ra quyết định mua hàng hơn
- Bổ sung chức năng tư vấn sản phẩm theo ngân sách
- AI có thể nhận diện mức ngân sách người dùng cung cấp
- Tự động đề xuất các sản phẩm phù hợp trong khoảng giá tương ứng
- Ưu tiên hiển thị các sản phẩm có hiệu năng tốt nhất trong tầm giá
- Bổ sung nội dung tư vấn và gợi ý nâng cấp sản phẩm khi mức chênh lệch không quá lớn
- Tăng khả năng chuyển đổi đơn hàng thông qua tư vấn sản phẩm phù hợp nhu cầu và ngân sách

3. Fix lỗi phát sinh:

- Fix lỗi giao diện Authentication chưa đồng bộ với giao diện trang chủ
- Fix lỗi Banner gây xuất hiện nhiều thanh cuộn trên trình duyệt
- Fix lỗi tràn kích thước vùng hiển thị sản phẩm nổi bật
- Fix lỗi AI tự động thêm sản phẩm ngoài yêu cầu khi thực hiện so sánh
- Fix lỗi đọc dữ liệu hành vi người dùng chưa chính xác trong quá trình đề xuất sản phẩm
- Kiểm tra và tối ưu lại luồng tư vấn sản phẩm theo thương hiệu, danh mục và ngân sách

✍️ Người thực hiện: Thanh

📅 07/06/2026
Nội dung thực hiện:
1  FE:
- Tối ưu giao diện trang AuthLayout
    + Giảm tông màu nền khu vực giới thiệu
    + Chuyển nền sang gradient nhạt dần
    + Điều chỉnh độ nổi của các thẻ chức năng
    + Đồng bộ giao diện với chủ đề InsightShop
- Tối ưu giao diện quản lý hành vi người dùng
    + Sắp xếp lại các khối thống kê
    + Hiển thị sản phẩm được quan tâm nhiều nhất
    + Hiển thị sản phẩm được xem nhiều nhất
    + Hiển thị sản phẩm được thêm giỏ hàng nhiều nhất
    + Hiển thị sản phẩm bị bỏ dở thanh toán nhiều nhất
    + Hiển thị sản phẩm được mua nhiều nhất
    + Thêm chức năng xuất file Excel thống kê top sản phẩm
- Tái cấu trúc module Chat AI
    + Tách ChatWidget thành nhiều file theo chức năng
    + Tách phần giao diện chat
    + Tách phần xử lý tin nhắn
    + Tách phần xử lý hành động AI
    + Tách phần xử lý thêm sản phẩm vào giỏ hàng
    + Thêm comment mô tả chức năng và luồng gọi
    + Chuẩn hóa import phục vụ tự động deploy

2  BE:
- Tối ưu AI Chat hỗ trợ khách hàng
    + Thêm xử lý câu chào hỏi cơ bản
    + Thêm lời chào mặc định cho người dùng
    + Thêm gợi ý thao tác nhanh
- Tối ưu nhận diện từ khóa người dùng
    + Hỗ trợ từ khóa không dấu
    + Hỗ trợ từ khóa nhập sai
    + Hỗ trợ từ khóa đồng nghĩa
    + Tự động nhận diện category theo dữ liệu hệ thống
- Tối ưu tìm kiếm sản phẩm theo ngân sách
    + Hỗ trợ tìm kiếm theo khoảng giá
    + Hỗ trợ tìm kiếm theo category
    + Hỗ trợ tìm kiếm theo thương hiệu
    + Chỉ trả về sản phẩm đúng danh mục yêu cầu
- Bổ sung trả lời thông tin sản phẩm
    + Trả lời thông số sản phẩm
    + Trả lời cấu hình sản phẩm
    + Trả lời mô tả sản phẩm
    + Trả lời thông tin chi tiết sản phẩm
    + Trả lời giá sản phẩm
- Sửa lỗi hệ thống AI
    + Fix AI hiểu nhầm câu chào thành tìm kiếm sản phẩm
    + Fix trả về sai danh mục khi tìm sản phẩm theo giá
    + Fix truy vấn laptop dưới 20 triệu không tìm thấy dữ liệu
    + Fix AI trả lời chưa đầy đủ khi hỏi thông số sản phẩm
    + Tối ưu cấu trúc module AI phục vụ mở rộng sau này

📅 Ngày: 11/06/2026
🧩 Nội dung công việc:
1. FE:
- Tối ưu lại cấu trúc trang Home
- Tách trang Home thành nhiều component nhỏ để dễ bảo trì và mở rộng
- Điều chỉnh lại các khu vực hiển thị trên trang chủ:
    + Banner
    + Sản phẩm nổi bật
    + Sản phẩm đề xuất
    + Tin tức
    + Các khu vực khuyến mãi
- Sửa hiển thị đánh giá sản phẩm trên trang chủ
- Không hiển thị sao giả khi sản phẩm chưa có đánh giá
- Tối ưu giao diện trang Livestream phía người dùng
- Điều chỉnh bố cục khung live theo hướng giống các nền tảng bán hàng realtime
- Thêm icon giỏ hàng và bình luận trực tiếp trong màn hình live
- Tối ưu hiển thị sản phẩm đang ghim, deal live và danh sách sản phẩm trong live
- Sửa nút “Mua ngay” trong live để chuyển đúng sang luồng thanh toán
- Tối ưu giao diện quản lý Livestream bên admin
- Tách giao diện quản lý livestream thành từng form:
    + Form tạo phiên live
    + Danh sách livestream
    + Form thêm / xóa sản phẩm trong live
    + Form tạo deal nhanh
    + Form bình luận realtime
- Bổ sung nút bỏ ghim sản phẩm đang giới thiệu
- Sửa lỗi xóa sản phẩm khỏi live nhưng giao diện vẫn còn hiển thị

2. BE:
- Hoàn thiện module Livestream realtime
- Tích hợp MongoDB phục vụ dữ liệu realtime cho livestream
- Bổ sung cấu hình MongoDB trong `application.yml` để hỗ trợ deploy
- Xây dựng xử lý chat realtime theo từng phiên livestream
- Đảm bảo live mới không hiển thị lại tin nhắn của phiên live cũ
- Hoàn thiện xử lý deal live:
    + Tạo deal theo thời gian 1-5 phút
    + Tự động hết hiệu lực khi hết thời gian
    + Tự động hết hiệu lực khi hết số lượng deal
    + Khi deal hết hạn, giá sản phẩm trở về giá gốc
- Bổ sung xử lý khóa đồng thời khi nhiều người đặt hàng cùng lúc trong live
- Đảm bảo khi số lượng deal còn 1, chỉ một đơn hàng được áp dụng giá giảm
- Sửa logic thanh toán sản phẩm live không ảnh hưởng đến luồng mua hàng thường
- Bổ sung xử lý xóa sản phẩm khỏi livestream và đồng bộ lại danh sách sản phẩm live
- Bổ sung xử lý bỏ ghim sản phẩm trong livestream

3. Fix lỗi phát sinh:
- Fix lỗi tạo deal live trả về 500 do thiếu giá trị `updated_at`
- Fix lỗi tạo deal live chưa đúng dữ liệu giảm giá
- Fix lỗi sản phẩm live thiếu `variantId` khiến thanh toán bị lỗi
- Fix lỗi mua sản phẩm trong live chỉ thêm giỏ hàng nhưng chưa đi thẳng đến thanh toán
- Fix lỗi bỏ ghim sản phẩm bị lỗi 500
- Fix lỗi xóa sản phẩm live báo thành công nhưng chưa mất khỏi giao diện
- Fix lỗi hiển thị trạng thái WebSocket vừa báo đã kết nối vừa báo không kết nối
- Fix lỗi giao diện trang live chưa cân xứng
- Fix lỗi trùng khung bình luận khi đã có icon chat trong màn live
- Kiểm tra lại luồng:
    + Tạo livestream
    + Thêm sản phẩm vào live
    + Ghim / bỏ ghim sản phẩm
    + Tạo deal live
    + Chat realtime
    + Mua ngay trong live
    + Thanh toán sản phẩm live
    + Hết hạn deal và hết số lượng deal
    
✍️ Người thực hiện: Thanh

📅 Ngày: 17/06/2026
🧩 Nội dung công việc:

1. FE:
- Xây dựng giao diện quản lý Video mô tả sản phẩm cho admin
- Thêm form tạo và cập nhật video mô tả sản phẩm
- Cho phép admin nhập:
    + Tiêu đề video
    + Mô tả ngắn
    + Video mô tả sản phẩm
    + Ảnh đại diện video
    + Sản phẩm liên kết
- Tối ưu phần chọn sản phẩm liên kết bằng ô tìm kiếm realtime
- Hỗ trợ tìm kiếm sản phẩm theo:
    + Tên sản phẩm
    + Thương hiệu
    + Danh mục
- Tách trang quản lý video mô tả sản phẩm thành nhiều component nhỏ để dễ bảo trì
- Hiển thị video mô tả sản phẩm trong khung gallery của trang chi tiết sản phẩm
- Kết hợp hình ảnh sản phẩm và video mô tả trong cùng khu vực hiển thị

2. BE:
- Xây dựng module Video mô tả sản phẩm
- Thiết kế API quản lý video mô tả sản phẩm cho admin
- Cho phép thêm, sửa, xóa và ẩn/hiện video mô tả sản phẩm
- Liên kết mỗi video với một sản phẩm chính
- Bổ sung API lấy video theo sản phẩm
- Bổ sung API thống kê video mô tả sản phẩm
- Sử dụng `LocalStorageService` để lưu trữ video và ảnh đại diện video trên local

3. Fix lỗi phát sinh:
- Fix lỗi video mô tả sản phẩm không phát được
- Fix lỗi không hiển thị ảnh đại diện video
- Fix lỗi video chưa hiển thị đúng vị trí trong trang chi tiết sản phẩm
- Fix lỗi thống kê video trả về 500 do thiếu dữ liệu sản phẩm liên kết
- Fix lỗi giao diện chọn sản phẩm liên kết khó sử dụng
- Kiểm tra lại luồng:
    + Tạo video mô tả sản phẩm
    + Cập nhật video mô tả sản phẩm
    + Xóa video mô tả sản phẩm
    + Chọn sản phẩm liên kết
    + Upload video
    + Upload ảnh đại diện
    + Hiển thị video trong gallery sản phẩm

✍️ Người thực hiện: Thanh

📅 Ngày: 23/06/2026
🧩 Nội dung công việc:

1. FE:
- Hoàn thiện và tối ưu chức năng mua sản phẩm trong Livestream
- Bổ sung popup chọn biến thể khi người dùng bấm "Mua ngay" trong phiên livestream
- Hiển thị danh sách biến thể còn hàng để người dùng lựa chọn chính xác trước khi thanh toán
- Loại bỏ các biến thể đã hết hàng khỏi danh sách lựa chọn
- Tối ưu giao diện popup chọn biến thể:
    + Responsive trên Desktop
    + Responsive trên Tablet
    + Responsive trên Mobile
- Hiển thị tồn kho theo tổng số lượng của toàn bộ biến thể sản phẩm
- Hiển thị chi tiết số lượng còn lại của từng biến thể trong trang quản lý livestream
- Tối ưu giao diện quản lý deal livestream:
    + Hiển thị tổng tồn kho sản phẩm
    + Hiển thị chi tiết tồn kho theo từng biến thể
    + Hỗ trợ theo dõi trạng thái deal trực quan hơn
- Hoàn thiện chức năng ghim bình luận livestream
- Cho phép ghim tối đa 3 bình luận cùng lúc
- Ẩn hiển thị thời gian đếm ngược của bình luận ghim để giao diện gọn gàng hơn
- Hiển thị tên người dùng thật trong bình luận nếu đã đăng nhập
- Tự động cập nhật trạng thái bình luận ghim theo thời gian thực
- Khi livestream kết thúc:
    + Tự động chuyển người xem khỏi phiên livestream
    + Hiển thị thông báo livestream đã kết thúc
    + Đồng bộ trạng thái giao diện cho toàn bộ người xem

2. BE:
- Sửa lỗi chức năng mua sản phẩm trong Livestream
- Bổ sung xử lý bắt buộc chọn biến thể trước khi tạo đơn hàng từ livestream
- Đồng bộ luồng thanh toán sản phẩm livestream với hệ thống biến thể sản phẩm
- Xử lý deal livestream áp dụng theo sản phẩm thay vì theo từng biến thể riêng lẻ
- Tính tổng tồn kho sản phẩm dựa trên toàn bộ biến thể
- Kiểm tra giới hạn số lượng deal dựa trên tổng tồn kho thực tế
- Bổ sung xử lý tự động hủy deal khi:
    + Hết thời gian deal
    + Livestream kết thúc
- Hoàn thiện cơ chế ghim bình luận livestream
- Cho phép ghim tối đa 3 bình luận đồng thời
- Tự động gỡ ghim sau 1 phút
- Hỗ trợ gỡ ghim thủ công từ phía quản trị viên
- Đồng bộ dữ liệu ghim bình luận realtime thông qua MongoDB
- Hoàn thiện xử lý đóng livestream:
    + Ngắt toàn bộ deal đang hoạt động
    + Đồng bộ trạng thái livestream tới người xem
    + Ngăn người dùng tiếp tục mua sản phẩm từ livestream đã kết thúc

3. AI Chat:
- Sửa lỗi chức năng thêm sản phẩm vào giỏ hàng bằng AI Chat
- Cải thiện nhận diện ý định thêm sản phẩm vào giỏ hàng với nhiều cách diễn đạt khác nhau
- Hỗ trợ các câu lệnh:
    + Thêm vào giỏ hàng
    + Mua sản phẩm
    + Cho vào giỏ
    + Đặt mua
    + Chốt đơn
    + Add to cart
    + Buy now
- Bổ sung xử lý sản phẩm có nhiều biến thể
- Không tự động chọn biến thể mặc định
- AI tự động yêu cầu người dùng cung cấp thêm:
    + Màu sắc
    + Dung lượng
    + RAM
    + Phiên bản
- Ghi nhớ ngữ cảnh hội thoại để tiếp tục xử lý ở các tin nhắn tiếp theo
- Hỗ trợ phản hồi theo ngôn ngữ người dùng:
    + Người dùng hỏi tiếng Việt → trả lời tiếng Việt
    + Người dùng hỏi tiếng Anh → trả lời tiếng Anh
- Tối ưu nội dung phản hồi để thân thiện và dễ hiểu hơn
- Tránh hiển thị dữ liệu theo dạng kỹ thuật hoặc JSON

4. Fix lỗi phát sinh:
- Fix lỗi mua sản phẩm livestream không chọn đúng biến thể
- Fix lỗi deal livestream chỉ áp dụng cho một biến thể thay vì toàn bộ sản phẩm
- Fix lỗi hiển thị tồn kho không chính xác khi sản phẩm có nhiều biến thể
- Fix lỗi biến thể hết hàng vẫn hiển thị trong popup mua ngay
- Fix lỗi người xem vẫn ở lại phiên livestream sau khi livestream kết thúc
- Fix lỗi deal vẫn còn hiệu lực sau khi livestream đã đóng
- Fix lỗi AI Chat không nhận diện đúng yêu cầu thêm sản phẩm vào giỏ hàng
- Fix lỗi AI tự động chọn sai biến thể sản phẩm
- Fix lỗi phản hồi AI hiển thị theo dạng kỹ thuật khó hiểu
- Kiểm tra và tối ưu lại toàn bộ luồng:
    + Livestream
    + Deal sản phẩm
    + Bình luận ghim
    + Chọn biến thể
    + AI Chat thêm giỏ hàng

✍️ Người thực hiện: Thanh