import { Link } from "react-router-dom";
import { APP_META } from "@/constants";
import {
  Facebook,
  Youtube,
  Instagram,
  Phone,
  Mail,
  MapPin,
  Truck,
  ShieldCheck,
  Clock,
  RotateCcw,
} from "lucide-react";

function Footer() {
  return (
    <footer className="mt-16 bg-[#1a202c] text-slate-300">
      {/* PHẦN 1: CÁC TIỆN ÍCH DỊCH VỤ (Dòng trên cùng) */}
      <div className="border-b border-slate-700 bg-[#111827]">
        <div className="container-padded grid grid-cols-1 gap-6 py-8 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-4">
            <Truck className="h-10 w-10 text-rose-500" />
            <div>
              <p className="font-bold text-white">Miễn phí vận chuyển</p>
              <p className="text-xs">Cho đơn hàng trên 500k</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-10 w-10 text-rose-500" />
            <div>
              <p className="font-bold text-white">Thanh toán an toàn</p>
              <p className="text-xs">100% thanh toán bảo mật</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Clock className="h-10 w-10 text-rose-500" />
            <div>
              <p className="font-bold text-white">Hỗ trợ khách hàng 24/7</p>
              <p className="text-xs">Liên hệ với chúng tôi ngay</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <RotateCcw className="h-10 w-10 text-rose-500" />
            <div>
              <p className="font-bold text-white">Miễn phí hoàn hàng</p>
              <p className="text-xs">Nếu sản phẩm có lỗi</p>
            </div>
          </div>
        </div>
      </div>

      {/* PHẦN 2: THÔNG TIN CHI TIẾT */}
      <div className="container-padded grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Cột 1: Thông tin thương hiệu */}
        <div className="space-y-4 xl:col-span-1">
          <h3 className="text-2xl font-black italic text-white tracking-tighter">
            {APP_META.name.toUpperCase()}
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <MapPin className="shrink-0 h-5 w-5 text-rose-500" />
              <p>{APP_META.address}</p>
            </div>
            <div className="flex gap-3">
              <Phone className="shrink-0 h-5 w-5 text-rose-500" />
              <p>{APP_META.supportPhone}</p>
            </div>
            <div className="flex gap-3">
              <Mail className="shrink-0 h-5 w-5 text-rose-500" />
              <p>{APP_META.supportEmail}</p>
            </div>
          </div>
          <Link
            to="/stores"
            className="inline-block rounded bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 transition-colors"
          >
            Xem hệ thống cửa hàng
          </Link>
        </div>

        {/* Cột 2: Thông tin (Theo ảnh mẫu) */}
        <div>
          <h4 className="mb-6 text-base font-bold text-white uppercase">
            Thông tin
          </h4>
          <div className="grid gap-3 text-sm">
            <Link to="/sale" className="hover:text-rose-500 transition">
              Siêu sale 8/3
            </Link>
            <Link to="/best-price" className="hover:text-rose-500 transition">
              Giá tốt mỗi ngày
            </Link>
            <Link to="/under-100k" className="hover:text-rose-500 transition">
              Hot dưới 100k
            </Link>
            <Link to="/coupons" className="hover:text-rose-500 transition">
              Mã giảm giá
            </Link>
            <Link to="/contact" className="hover:text-rose-500 transition">
              Liên hệ với chúng tôi
            </Link>
          </div>
        </div>

        {/* Cột 3: Khách hàng (Theo ảnh mẫu) */}
        <div>
          <h4 className="mb-6 text-base font-bold text-white uppercase">
            Khách hàng
          </h4>
          <div className="grid gap-3 text-sm">
            <Link
              to="/policy/buying"
              className="hover:text-rose-500 transition"
            >
              Chính sách mua hàng
            </Link>
            <Link
              to="/policy/return"
              className="hover:text-rose-500 transition"
            >
              Chính sách đổi trả
            </Link>
            <Link
              to="/policy/shipping"
              className="hover:text-rose-500 transition"
            >
              Chính sách vận chuyển
            </Link>
            <Link
              to="/policy/privacy"
              className="hover:text-rose-500 transition"
            >
              Chính sách bảo mật
            </Link>
            <Link to="/commitment" className="hover:text-rose-500 transition">
              Cam kết cửa hàng
            </Link>
          </div>
        </div>

        {/* Cột 4: Hướng dẫn (Theo ảnh mẫu) */}
        <div>
          <h4 className="mb-6 text-base font-bold text-white uppercase">
            Hướng dẫn
          </h4>
          <div className="grid gap-3 text-sm">
            <Link to="/guide/buying" className="hover:text-rose-500 transition">
              Hướng dẫn mua hàng
            </Link>
            <Link to="/guide/return" className="hover:text-rose-500 transition">
              Hướng dẫn đổi trả
            </Link>
            <Link
              to="/guide/payment"
              className="hover:text-rose-500 transition"
            >
              Hướng dẫn chuyển khoản
            </Link>
            <Link
              to="/guide/installment"
              className="hover:text-rose-500 transition"
            >
              Hướng dẫn trả góp
            </Link>
            <Link to="/guide/refund" className="hover:text-rose-500 transition">
              Hướng dẫn hoàn hàng
            </Link>
          </div>
        </div>

        {/* Cột 5: Thanh toán & MXH */}
        <div className="space-y-6">
          <div>
            <h4 className="mb-4 text-base font-bold text-white uppercase">
              Chấp nhận thanh toán
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-1 rounded h-10 flex items-center justify-center font-bold text-blue-800 italic">
                VISA
              </div>
              <div className="bg-white p-1 rounded h-10 flex items-center justify-center font-bold text-red-600 italic">
                MasterCard
              </div>
              <div className="bg-white p-2 rounded h-10 flex items-center justify-center text-[10px] text-slate-800 font-bold leading-tight uppercase">
                Tiền mặt
              </div>
              <div className="bg-white p-1 rounded h-10 flex items-center justify-center text-[10px] text-blue-600 font-bold leading-tight uppercase">
                Chuyển khoản
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-base font-bold text-white uppercase">
              Theo dõi chúng tôi
            </h4>
            <div className="flex gap-3">
              <a
                href="#"
                className="p-2 bg-blue-600 rounded-full text-white hover:scale-110 transition"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="p-2 bg-red-600 rounded-full text-white hover:scale-110 transition"
              >
                <Youtube size={18} />
              </a>
              <a
                href="#"
                className="p-2 bg-pink-600 rounded-full text-white hover:scale-110 transition"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* PHẦN 3: BẢN QUYỀN */}
      <div className="border-t border-slate-700 bg-[#111827] py-6 text-xs">
        <div className="container-padded flex flex-col justify-between gap-4 md:flex-row">
          <p>
            Bản quyền thuộc về{" "}
            <span className="font-bold text-white">OH!Team</span>. Cung cấp bởi{" "}
            <span className="font-bold text-white">Sapo</span>
          </p>
          <p>
            Giấy chứng nhận ĐKDN số 0123456789 do Sở kế hoạch và đầu tư thành
            phố Hà Nội cấp ngày 22 tháng 03 năm 2026.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
