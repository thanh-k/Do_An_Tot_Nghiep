# NovaShop - Ecommerce Frontend

Frontend website thương mại điện tử hoàn chỉnh bằng **React + Vite + React Router + TailwindCSS + Context API**.

## Tính năng chính

- Khu vực người dùng: home, auth, danh sách sản phẩm, chi tiết sản phẩm, search text, search image mock, cart, wishlist, checkout, profile, order history.
- Khu vực admin: dashboard, quản lý sản phẩm, category, đơn hàng, người dùng, profile.
- Mock database bằng `localStorage`, dễ thay thế sang API/backend thật.
- Component tái sử dụng, routes tách riêng, layouts tách riêng.
- Responsive desktop / tablet / mobile.
- Hỗ trợ product variants (màu sắc, dung lượng, RAM, SSD...) ảnh hưởng đến giá, tồn kho và ảnh hiển thị.

## Cài đặt

```bash
npm install
npm run dev
```

## Tài khoản demo

### Admin
- Email: `admin@novashop.vn`
- Password: `Admin@123`

### User
- Email: `linh@novashop.vn`
- Password: `User@123`

## Cấu trúc

- `src/pages`: trang user, admin, auth
- `src/components`: reusable UI components
- `src/layouts`: MainLayout, AuthLayout, AdminLayout
- `src/routes`: route config + router mapping
- `src/data`: mock data seed
- `src/services`: fake API / localStorage database service
- `src/contexts`: auth, cart, wishlist
- `src/hooks`: custom hooks
- `src/utils`: helper và formatter

## Ghi chú

- Dự án chỉ là frontend mock, chưa tích hợp backend thật.
- Bạn có thể thay `services/*.js` bằng API calls thật sau này mà không cần thay đổi quá nhiều UI.
- Nếu muốn reset dữ liệu mock, hãy xoá localStorage của trình duyệt.
