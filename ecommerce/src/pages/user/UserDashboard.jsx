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
import { useEffect, useMemo, useState } from "react";
import useAuth from "@/hooks/useAuth";
import useWishlist from "@/hooks/useWishlist";
import useVoucherWallet from "@/hooks/useVoucherWallet";
import userVoucherService from "@/services/user/voucherService";
import { orderService } from "@/services/user/orderService";
import membershipService from "@/services/user/membershipService";
import { formatCurrency, formatDate, formatOrderStatus } from "@/utils/format";

const CATEGORY_MAP = {
  DISCOUNT: { label: "Giảm giá", bg: "bg-rose-500", text: "text-rose-600", hover: "group-hover:text-rose-600" },
  SHIPPING: { label: "Vận chuyển", bg: "bg-blue-500", text: "text-blue-600", hover: "group-hover:text-blue-600" },
  CASHBACK: { label: "Hoàn xu", bg: "bg-amber-500", text: "text-amber-600", hover: "group-hover:text-amber-600" },
  VIP: { label: "Đặc quyền VIP", bg: "bg-fuchsia-500", text: "text-fuchsia-600", hover: "group-hover:text-fuchsia-600" },
};

const getStatusColorClass = (status) => {
  switch (status) {
    case "PENDING": return "bg-amber-100 text-amber-700";
    case "CONFIRMED": return "bg-blue-100 text-blue-700";
    case "PROCESSING": return "bg-indigo-100 text-indigo-700";
    case "SHIPPED": return "bg-purple-100 text-purple-700";
    case "DELIVERED": return "bg-emerald-100 text-emerald-700";
    case "CANCELLED": return "bg-rose-100 text-rose-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

export default function UserDashboard() {
  const { currentUser, logout } = useAuth();
  const { wishlistItems } = useWishlist();
  const { syncAvailableCodes } = useVoucherWallet();
  const navigate = useNavigate();
  const [myVouchers, setMyVouchers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [membership, setMembership] = useState({ vip: false, membershipName: "Thành viên thường" });

  useEffect(() => {
    userVoucherService
      .getActiveVouchers()
      .then((data) => {
        setMyVouchers(data || []);
        syncAvailableCodes((data || []).map((item) => item.code));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    membershipService.getMyMembership().then((data) => {
      setMembership(data || { vip: false, membershipName: "Thành viên thường" });
    }).catch(() => setMembership({ vip: false, membershipName: "Thành viên thường" }));
  }, []);

  useEffect(() => {
    if (currentUser) {
      orderService.getMyOrders(currentUser.id).then((data) => {
        setRecentOrders(data.slice(0, 3));
      }).catch(() => {});
    }
  }, [currentUser]);

  if (!currentUser) return null;
  const membershipLabel = membership?.vip ? membership?.membershipName || "Thành viên VIP" : "Thành viên thường";

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 overflow-x-hidden">
      <section className="bg-slate-950 pt-16 pb-32 text-white relative">
        <div className="container-padded relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative">
              <img src={currentUser.avatar || "https://i.pravatar.cc/150?u=default"} className="w-28 h-28 rounded-[2.5rem] border-4 border-rose-600 shadow-2xl object-cover" alt="Avatar" />
              {membership?.vip ? (
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-xl shadow-lg">
                  <Star size={16} className="text-slate-900 fill-current" />
                </div>
              ) : null}
            </motion.div>
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">
                Chào bạn, {currentUser.name.split(" ").pop()}!
              </h1>
              <p className="text-slate-400 mt-2 font-medium flex items-center justify-center lg:justify-start gap-2">
                <ShieldCheck size={16} className={membership?.vip ? "text-rose-500" : "text-slate-500"} /> {membershipLabel}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/profile" className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
              <Edit3 size={16} /> Chỉnh sửa hồ sơ
            </Link>
            <button onClick={logout} className="p-3 bg-rose-600/10 text-rose-500 border border-rose-600/20 rounded-2xl hover:bg-rose-600 hover:text-white transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(225,29,72,0.15)_0%,transparent_50%)] pointer-events-none"></div>
      </section>

      <div className="container-padded -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div whileHover={{ y: -5 }} className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/5 relative overflow-hidden">
            <Zap className="absolute -right-6 -bottom-6 text-white/5" size={150} />
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-600/30 w-fit"><Gift size={24} /></div>
              <div className="mt-8">
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Nova Points của tôi</p>
                <h2 className="text-6xl font-black italic tracking-tighter mt-1">12,550</h2>
              </div>
              <div className="mt-4 flex items-center gap-2 text-rose-400 font-bold text-xs uppercase italic"><Rocket size={14} /> Sắp nhận Voucher 500k!</div>
            </div>
          </motion.div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5 border border-blue-100 space-y-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 text-blue-500/10 rotate-12"><MapPin size={120} /></div>
            <h3 className="font-black uppercase italic text-sm border-l-4 border-blue-600 pl-3 text-blue-950 relative z-10">Thông tin nhận hàng</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl text-blue-500 shadow-sm border border-blue-50"><MapPin size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase">Địa chỉ mặc định</p>
                  <p className="text-sm font-bold text-blue-900 leading-snug">{currentUser.address || "Chưa cập nhật"}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl text-blue-500 shadow-sm border border-blue-50"><Phone size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase">Số điện thoại</p>
                  <p className="text-sm font-bold text-blue-900">{currentUser.phone || "Chưa cập nhật"}</p>
                </div>
              </div>
            </div>
            <Link to="/profile" className="relative z-10 block text-center py-3 bg-white border border-blue-100 rounded-xl text-[10px] font-black uppercase text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">Cập nhật ngay</Link>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-[2.5rem] p-8 shadow-xl shadow-purple-900/5 border border-purple-100 overflow-hidden relative">
            <div className="absolute -right-6 -bottom-6 text-purple-500/10 -rotate-12 pointer-events-none"><Ticket size={140} /></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-black uppercase italic text-sm border-l-4 border-purple-600 pl-3 text-purple-950">Ví Voucher ({myVouchers.length})</h3>
              <Link to="/vouchers" className="text-[10px] font-bold text-purple-600 hover:text-purple-800 underline">Săn thêm mã</Link>
            </div>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 no-scrollbar relative z-10">
              {myVouchers.map((v) => {
                const catConfig = CATEGORY_MAP[v.category || "DISCOUNT"];
                return (
                  <motion.div key={v.id} whileHover={{ x: 5 }} className="group bg-white/60 backdrop-blur-sm rounded-[1.5rem] p-4 flex items-start gap-4 border-l-4 border-rose-500 shadow-sm hover:bg-white transition-all">
                    <div className={`w-12 h-12 rounded-2xl ${catConfig.bg} flex items-center justify-center text-white shrink-0 shadow-md`}><Ticket size={20} /></div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <p className={`font-black text-sm text-slate-800 ${catConfig.hover} truncate`}>{v.code}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${catConfig.text} bg-white/70`}>{catConfig.label}</span>
                      </div>
                      <p className="text-rose-600 font-bold text-lg mt-1">
                        {v.discountType === "PERCENT" ? `Giảm ${v.discountValue}%` : `Giảm ${formatCurrency(v.discountValue)}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Đơn từ {formatCurrency(v.minOrderValue)} • HSD: {formatDate(v.expiryDate)}</p>
                    </div>
                  </motion.div>
                );
              })}
              {!myVouchers.length && <div className="text-center text-slate-500 py-10 italic">Ví voucher đang trống.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
