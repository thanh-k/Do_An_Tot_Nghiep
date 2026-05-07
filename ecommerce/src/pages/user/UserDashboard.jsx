import { motion } from "framer-motion";
import {
  User,
  Package,
  Heart,
  Ticket,
  Star,
  History,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  ShieldCheck,
  Zap,
  Gift,
  MapPin,
  Phone,
  Edit3,
  Rocket,
  ArrowRight,
  Smile,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import useWishlist from "@/hooks/useWishlist"; // Import hook wishlist của em
import useVoucherWallet from "@/hooks/useVoucherWallet";
import userVoucherService from "@/services/user/voucherService";
import { orderService } from "@/services/user/orderService";
import { formatCurrency, formatDate, formatOrderStatus } from "@/utils/format";

// Cấu hình UI Icon và Màu sắc cho từng loại Voucher
const CATEGORY_MAP = {
  DISCOUNT: {
    label: "Giảm giá",
    bg: "bg-rose-500",
    text: "text-rose-600",
    hover: "group-hover:text-rose-600",
  },
  SHIPPING: {
    label: "Vận chuyển",
    bg: "bg-blue-500",
    text: "text-blue-600",
    hover: "group-hover:text-blue-600",
  },
  CASHBACK: {
    label: "Hoàn xu",
    bg: "bg-amber-500",
    text: "text-amber-600",
    hover: "group-hover:text-amber-600",
  },
  VIP: {
    label: "Đặc quyền VIP",
    bg: "bg-fuchsia-500",
    text: "text-fuchsia-600",
    hover: "group-hover:text-fuchsia-600",
  },
};

// Hàm helper lấy màu sắc trạng thái
const getStatusColorClass = (status) => {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-700";
    case "PROCESSING":
      return "bg-indigo-100 text-indigo-700";
    case "SHIPPED":
      return "bg-purple-100 text-purple-700";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function UserDashboard() {
  const { currentUser, logout } = useAuth();
  const { wishlistItems } = useWishlist(); // Lấy danh sách sản phẩm yêu thích thật
  const { savedVoucherCodes } = useVoucherWallet();
  const navigate = useNavigate();
  const [myVouchers, setMyVouchers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    userVoucherService
      .getActiveVouchers()
      .then((data) => {
        const saved = data.filter((v) => savedVoucherCodes.includes(v.code));
        setMyVouchers(saved);
      })
      .catch(() => {});
  }, [savedVoucherCodes]);

  useEffect(() => {
    if (currentUser) {
      orderService
        .getMyOrders(currentUser.id)
        .then((data) => {
          // Lấy 3 đơn hàng mới nhất
          setRecentOrders(data.slice(0, 3));
        })
        .catch(() => {});
    }
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 overflow-x-hidden">
      {/* 1. HEADER CHÀO MỪNG */}
      <section className="bg-slate-950 pt-16 pb-32 text-white relative">
        <div className="container-padded relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative"
            >
              <img
                src={
                  currentUser.avatar || "https://i.pravatar.cc/150?u=default"
                }
                className="w-28 h-28 rounded-[2.5rem] border-4 border-rose-600 shadow-2xl object-cover"
                alt="Avatar"
              />
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-xl shadow-lg">
                <Star size={16} className="text-slate-900 fill-current" />
              </div>
            </motion.div>
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">
                Chào bạn, {currentUser.name.split(" ").pop()}!
              </h1>
              <p className="text-slate-400 mt-2 font-medium flex items-center justify-center lg:justify-start gap-2">
                <ShieldCheck size={16} className="text-rose-500" /> Thành viên
                hạng Vàng (Gold Member)
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
            >
              <Edit3 size={16} /> Chỉnh sửa hồ sơ
            </Link>
            <button
              onClick={logout}
              className="p-3 bg-rose-600/10 text-rose-500 border border-rose-600/20 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(225,29,72,0.15)_0%,transparent_50%)] pointer-events-none"></div>
      </section>

      {/* 2. DASHBOARD CONTENT */}
      <div className="container-padded -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* MODULE 1: NOVA POINTS */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/5 relative overflow-hidden"
          >
            <Zap
              className="absolute -right-6 -bottom-6 text-white/5"
              size={150}
            />
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-600/30 w-fit">
                <Gift size={24} />
              </div>
              <div className="mt-8">
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                  Nova Points của tôi
                </p>
                <h2 className="text-6xl font-black italic tracking-tighter mt-1">
                  12,550
                </h2>
              </div>
              <div className="mt-4 flex items-center gap-2 text-rose-400 font-bold text-xs uppercase italic">
                <Rocket size={14} /> Sắp nhận Voucher 500k!
              </div>
            </div>
          </motion.div>

          {/* MODULE 2: TÓM TẮT THÔNG TIN */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5 border border-blue-100 space-y-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 text-blue-500/10 rotate-12">
              <MapPin size={120} />
            </div>
            <h3 className="font-black uppercase italic text-sm border-l-4 border-blue-600 pl-3 text-blue-950 relative z-10">
              Thông tin nhận hàng
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl text-blue-500 shadow-sm border border-blue-50">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase">
                    Địa chỉ mặc định
                  </p>
                  <p className="text-sm font-bold text-blue-900 leading-snug">
                    {currentUser.address || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl text-blue-500 shadow-sm border border-blue-50">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase">
                    Số điện thoại
                  </p>
                  <p className="text-sm font-bold text-blue-900">
                    {currentUser.phone || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            </div>
            <Link
              to="/profile"
              className="relative z-10 block text-center py-3 bg-white border border-blue-100 rounded-xl text-[10px] font-black uppercase text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            >
              Cập nhật ngay
            </Link>
          </div>

          {/* MODULE 3: VÍ VOUCHER */}
          <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-[2.5rem] p-8 shadow-xl shadow-purple-900/5 border border-purple-100 overflow-hidden relative">
            <div className="absolute -right-6 -bottom-6 text-purple-500/10 -rotate-12 pointer-events-none">
              <Ticket size={140} />
            </div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-black uppercase italic text-sm border-l-4 border-purple-600 pl-3 text-purple-950">
                Ví Voucher ({myVouchers.length})
              </h3>
              <Link
                to="/vouchers"
                className="text-[10px] font-bold text-purple-600 hover:text-purple-800 underline"
              >
                Săn thêm mã
              </Link>
            </div>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 no-scrollbar relative z-10">
              {myVouchers.map((v) => {
                const catConfig = CATEGORY_MAP[v.category || "DISCOUNT"];
                return (
                  <motion.div
                    key={v.id}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-purple-100 shadow-sm relative group"
                  >
                    <div
                      className={`w-1 h-full absolute left-0 top-0 ${catConfig.bg}`}
                    ></div>

                    {/* HIỂN THỊ ẢNH VOUCHER TỪ API */}
                    {v.image ? (
                      <img
                        src={v.image}
                        alt={v.code}
                        className="w-12 h-12 object-cover rounded-xl bg-white border border-slate-200 p-0.5"
                      />
                    ) : (
                      <div
                        className={`p-3 bg-white rounded-xl shadow-sm text-slate-400 ${catConfig.hover} transition-colors`}
                      >
                        <Ticket size={20} />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black text-slate-900 leading-none">
                          {v.code}
                        </p>
                        <span
                          className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${catConfig.text} ${catConfig.bg.replace("bg-", "border-").replace("500", "200")} bg-white`}
                        >
                          {catConfig.label}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] font-bold ${catConfig.text} mt-1.5`}
                      >
                        Giảm{" "}
                        {v.discountType === "PERCENT"
                          ? `${v.discountValue}%`
                          : formatCurrency(v.discountValue)}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1 line-clamp-1">
                        Đơn từ {formatCurrency(v.minOrderValue)} • HSD:{" "}
                        {formatDate(v.expiryDate)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              {myVouchers.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4 italic">
                  Ví voucher đang trống.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. WISHLIST & ORDERS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* ĐƠN HÀNG GẦN ĐÂY */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2.5rem] p-8 shadow-xl shadow-emerald-900/5 border border-emerald-100 relative overflow-hidden">
            <div className="absolute -left-10 -bottom-10 text-emerald-500/10 rotate-12 pointer-events-none">
              <Package size={150} />
            </div>
            <div className="flex items-center justify-between mb-8 text-emerald-950 relative z-10">
              <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                <Package className="text-emerald-600" /> Đơn hàng gần đây
              </h3>
              <Link
                to="/orders"
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 underline"
              >
                Tất cả đơn hàng
              </Link>
            </div>
            <div className="space-y-4 relative z-10">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-emerald-100/50 transition-all border border-emerald-50 hover:border-emerald-200 shadow-sm group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-900 font-black text-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors border border-emerald-100">
                        #{order.id}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-950">
                          {formatCurrency(
                            order.totalAmount || order.total || 0,
                          )}
                        </p>
                        <p className="text-[10px] text-emerald-600/70 font-medium">
                          {order.createdAt || order.orderDate
                            ? formatDate(order.createdAt || order.orderDate)
                            : "Đang cập nhật"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm ${getStatusColorClass(order.status)}`}
                    >
                      {formatOrderStatus(order.status)}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-emerald-600/70 text-center py-4 italic">
                  Chưa có đơn hàng nào gần đây.
                </p>
              )}
            </div>
          </div>

          {/* SẢN PHẨM YÊU THÍCH (WISH LIST) */}
          <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl shadow-rose-900/5 border border-rose-100">
            <div className="absolute -right-6 -top-6 text-rose-500/10 -rotate-12 pointer-events-none">
              <Heart size={160} className="fill-current" />
            </div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2 text-rose-950">
                <Heart size={20} className="text-rose-500 fill-rose-500" /> Sản
                phẩm đã thích ({wishlistItems?.length || 0})
              </h3>
              <Link
                to="/wishlist"
                className="text-rose-400 hover:text-rose-600 transition-colors"
              >
                <ChevronRight size={24} />
              </Link>
            </div>

            {/* LOGIC HIỂN THỊ WISHLIST */}
            <div className="relative z-10 min-h-[140px] flex items-center">
              {wishlistItems && wishlistItems.length > 0 ? (
                <div className="grid grid-cols-4 gap-4 w-full">
                  {wishlistItems.slice(0, 4).map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="aspect-square rounded-2xl bg-white border border-rose-100 p-2 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer group shadow-sm"
                      onClick={() => navigate(`/products/${item.slug}`)}
                    >
                      <img
                        src={item.thumbnail || item.image || item.images?.[0]}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        alt={item.name}
                      />
                    </motion.div>
                  ))}
                  {wishlistItems.length > 4 && (
                    <div className="aspect-square rounded-2xl bg-white border border-rose-200 flex items-center justify-center text-rose-600 font-black text-sm shadow-sm">
                      +{wishlistItems.length - 4}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full text-center space-y-4 py-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center animate-bounce border border-rose-100 shadow-sm">
                      <Smile size={32} className="text-rose-400" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <Star
                        size={14}
                        className="text-yellow-400 fill-current"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-rose-950 uppercase tracking-tighter">
                      Bạn chưa có sản phẩm yêu thích nào
                    </p>
                    <p className="text-[10px] text-rose-600/70 mt-1 italic">
                      Thả tim ngay để lưu lại những siêu phẩm nhé!
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/products")}
              className="relative z-10 w-full mt-8 py-4 bg-white text-rose-600 border border-rose-200 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              Khám phá sản phẩm ngay
            </button>
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-600/5 rounded-full blur-3xl pointer-events-none"></div>
          </div>
        </div>

        {/* 4. UPGRADE & MISSION (BỔ SUNG THÊM THÔNG TIN CHO ĐỠ NHÀM CHÁN) */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gradient-to-r from-rose-600 to-orange-500 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden group">
            <div className="relative z-10 space-y-4 text-center md:text-left">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                Nâng cấp hội viên Diamond
              </h3>
              <p className="text-white/80 text-sm font-medium max-w-md">
                Nhận ngay đặc quyền Freeship 0đ không giới hạn và quà tặng sinh
                nhật trị giá 2.000.000đ.
              </p>
              <button className="bg-slate-950 px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-rose-600 transition-all flex items-center gap-2 mx-auto md:mx-0">
                Nâng cấp ngay <ArrowRight size={14} />
              </button>
            </div>
            <div className="relative z-10 mt-8 md:mt-0">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3112/3112946.png"
                className="w-32 h-32 drop-shadow-2xl group-hover:rotate-12 transition-transform"
                alt="diamond"
              />
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col justify-center items-center text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
              <Sparkles size={32} />
            </div>
            <h4 className="text-lg font-black uppercase italic text-slate-900 leading-none">
              Nhiệm vụ hôm nay
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Hoàn thành đánh giá sản phẩm để nhận ngay 200 Nova Points.
            </p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-2/3"></div>
            </div>
          </div>
        </section>

        {/* 5. FOOTER LINKS */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 border-t border-slate-200 pt-10">
          <Link
            to="/contact"
            className="flex items-center gap-2 text-slate-400 hover:text-rose-600 font-black uppercase text-[10px] transition-all tracking-widest"
          >
            <Bell size={16} /> Thông báo hệ thống
          </Link>
          <span className="text-slate-200 hidden md:inline">|</span>
          <Link
            to="/news"
            className="flex items-center gap-2 text-slate-400 hover:text-rose-600 font-black uppercase text-[10px] transition-all tracking-widest"
          >
            <Zap size={16} /> Đặc quyền hội viên
          </Link>
          <span className="text-slate-200 hidden md:inline">|</span>
          <button
            onClick={() => navigate("/contact")}
            className="flex items-center gap-2 text-slate-400 hover:text-rose-600 font-black uppercase text-[10px] transition-all tracking-widest"
          >
            <Settings size={16} /> Bảo mật & Quyền riêng tư
          </button>
        </div>
      </div>
    </div>
  );
}
