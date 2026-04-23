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

