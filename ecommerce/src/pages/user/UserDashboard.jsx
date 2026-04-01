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
import useAuth from "@/hooks/useAuth";
import useWishlist from "@/hooks/useWishlist"; // Import hook wishlist của em

// --- DỮ LIỆU GIẢ LẬP VOUCHER & ĐƠN HÀNG ---
const MY_VOUCHERS = [
  {
    id: 1,
    code: "FREESHIP30",
    value: "30.000đ",
    type: "Vận chuyển",
    color: "bg-blue-500",
  },
  {
    id: 2,
    code: "NOVA100K",
    value: "100.000đ",
    type: "Giảm giá",
    color: "bg-rose-500",
  },
  {
    id: 3,
    code: "VIPMEMBER",
    value: "10%",
    type: "Ưu đãi VIP",
    color: "bg-amber-500",
  },
];

const RECENT_ORDERS = [
  {
    id: "#NS8801",
    date: "01/04/2026",
    status: "Đang giao",
    total: "1.250.000đ",
  },
  {
    id: "#NS8755",
    date: "28/03/2026",
    status: "Hoàn thành",
    total: "450.000đ",
  },
];

export default function UserDashboard() {
  const { currentUser, logout } = useAuth();
  const { wishlist } = useWishlist(); // Lấy danh sách sản phẩm yêu thích thật
  const navigate = useNavigate();

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
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 space-y-6">
            <h3 className="font-black uppercase italic text-sm border-l-4 border-rose-600 pl-3 text-slate-900">
              Thông tin nhận hàng
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    Địa chỉ mặc định
                  </p>
                  <p className="text-sm font-bold text-slate-700 leading-snug">
                    {currentUser.address || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    Số điện thoại
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {currentUser.phone || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            </div>
            <Link
              to="/profile"
              className="block text-center py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-rose-600 transition-all"
            >
              Cập nhật ngay
            </Link>
          </div>

          {/* MODULE 3: VÍ VOUCHER */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase italic text-sm text-slate-900">
                Ví Voucher ({MY_VOUCHERS.length})
              </h3>
              <Link
                to="/vouchers"
                className="text-[10px] font-bold text-rose-600 underline"
              >
                Săn thêm mã
              </Link>
            </div>
            <div className="space-y-3">
              {MY_VOUCHERS.map((v) => (
                <motion.div
                  key={v.id}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 relative group"
                >
                  <div
                    className={`w-1 h-full absolute left-0 top-0 ${v.color}`}
                  ></div>
                  <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-rose-600 transition-colors">
                    <Ticket size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 leading-none">
                      {v.code}
                    </p>
                    <p className="text-[10px] font-bold text-rose-600 mt-1">
                      Giảm {v.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. WISHLIST & ORDERS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* ĐƠN HÀNG GẦN ĐÂY */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-8 text-slate-900">
              <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                <Package className="text-rose-600" /> Đơn hàng gần đây
              </h3>
              <Link
                to="/orders"
                className="text-[10px] font-bold text-rose-600 underline"
              >
                Tất cả đơn hàng
              </Link>
            </div>
            <div className="space-y-4">
              {RECENT_ORDERS.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs">
                      #{order.id.slice(-4)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {order.total}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {order.date}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${order.status === "Đang giao" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}
                  >
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SẢN PHẨM YÊU THÍCH (WISH LIST) */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                <Heart size={20} className="text-rose-500 fill-rose-500" /> Sản
                phẩm đã thích ({wishlist?.length || 0})
              </h3>
              <Link
                to="/wishlist"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight size={24} />
              </Link>
            </div>

            {/* LOGIC HIỂN THỊ WISHLIST */}
            <div className="relative z-10 min-h-[140px] flex items-center">
              {wishlist && wishlist.length > 0 ? (
                <div className="grid grid-cols-4 gap-4 w-full">
                  {wishlist.slice(0, 4).map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="aspect-square rounded-2xl bg-white/5 border border-white/10 p-2 hover:bg-white/10 transition-all cursor-pointer group"
                      onClick={() => navigate(`/product/${item.slug}`)}
                    >
                      <img
                        src={item.images?.[0] || item.image}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        alt={item.name}
                      />
                    </motion.div>
                  ))}
                  {wishlist.length > 4 && (
                    <div className="aspect-square rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 font-black text-sm">
                      +{wishlist.length - 4}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full text-center space-y-4 py-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center animate-bounce">
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
                    <p className="text-sm font-bold text-slate-300 uppercase tracking-tighter">
                      Bạn chưa có sản phẩm yêu thích nào
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 italic">
                      Thả tim ngay để lưu lại những siêu phẩm nhé!
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/products")}
              className="w-full mt-8 py-4 bg-rose-600 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20"
            >
              Khám phá sản phẩm ngay
            </button>
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
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
