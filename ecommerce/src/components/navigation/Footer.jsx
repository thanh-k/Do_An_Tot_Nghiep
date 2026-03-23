import { Link } from "react-router-dom";
import { APP_META } from "@/constants";

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-gradient-to-br from-slate-100 via-white to-sky-50 text-slate-600">
      <div className="container-padded grid gap-10 py-14 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">{APP_META.name}</h3>
          <p className="transition hover:text-sky-700">{APP_META.tagline}</p>
          <div className="transition hover:text-sky-700">
            <p>Hotline: {APP_META.supportPhone}</p>
            <p>Email: {APP_META.supportEmail}</p>
            <p>Địa chỉ: {APP_META.address}</p>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-900">
            Dành cho khách hàng
          </h4>
          <div className="grid gap-3 text-sm">
            <Link to="/products" className="transition hover:text-sky-700">
              Tất cả sản phẩm
            </Link>
            <Link to="/wishlist" className="transition hover:text-sky-700">
              Wishlist
            </Link>
            <Link to="/orders" className="transition hover:text-sky-700">
              Lịch sử đơn hàng
            </Link>
            <Link to="/profile" className="transition hover:text-sky-700">
              Thông tin tài khoản
            </Link>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-900">
            Dịch vụ
          </h4>
          <div className="grid gap-3 text-sm">
            <p>Giao nhanh 2h nội thành</p>
            <p>Đổi trả 15 ngày</p>
            <p>Trả góp 0%</p>
            <p>Bảo hành chính hãng</p>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-900">
            Kết nối & hỗ trợ
          </h4>
          <div className="transition hover:text-sky-700">
            <p>
              NovaShop xây dựng trải nghiệm frontend thương mại điện tử hiện đại,
              tối ưu cho việc mở rộng backend trong tương lai.
            </p>
            <p>
              © 2026 NovaShop. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
