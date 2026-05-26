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
  Wallet,
  Truck,
  PackageOpen,
  Headphones,
  FileQuestion,
  ShieldAlert,
  ArchiveX,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import useWishlist from "@/hooks/useWishlist";
import useVoucherWallet from "@/hooks/useVoucherWallet";
import userVoucherService from "@/services/user/voucherService";
import { orderService } from "@/services/user/orderService";
import membershipService from "@/services/user/membershipService";
import userProductService from "@/services/user/productService";
import { formatCurrency, formatDate, formatOrderStatus } from "@/utils/format";
import ProductGrid from "@/components/product/ProductGrid";
import coinRewardService from "@/services/user/coinRewardService";

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
  COIN_REWARD: {
    label: "Đổi xu",
    bg: "bg-emerald-500",
    text: "text-emerald-600",
    hover: "group-hover:text-emerald-600",
  },
};

const getStatusColorClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-700";
    case "PROCESSING":
      return "bg-indigo-100 text-indigo-700";
    case "SHIPPED":
    case "SHIPPING":
      return "bg-purple-100 text-purple-700";
    case "DELIVERED":
    case "COMPLETED":
    case "PAID":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function UserDashboard() {
  const { currentUser, logout } = useAuth();
  const { wishlistItems } = useWishlist();
  const { savedVoucherCodes } = useVoucherWallet();
  const navigate = useNavigate();
  const [myVouchers, setMyVouchers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [membership, setMembership] = useState({
    vip: false,
    membershipName: "Thành viên thường",
  });
  const [coinBalance, setCoinBalance] = useState(0);

  useEffect(() => {
    userVoucherService
      .getActiveVouchers()
      .then((data) => {
        const codes = savedVoucherCodes || [];

        setMyVouchers(
          (data || []).filter((v) => {
            const category = (v.category || "DISCOUNT").toUpperCase();

            const isActive = v.active !== false;
            const isClaimable = v.claimable !== false;
            const isEligible = v.eligible !== false;
            const hasQuantity =
              Number(v.remainingQuantity ?? v.quantity ?? 1) > 0;

            const isSpecialOwnedVoucher =
              category === "VIP" || category === "COIN_REWARD";

            const isSavedNormalVoucher =
              ["DISCOUNT", "SHIPPING", "CASHBACK"].includes(category) &&
              codes.includes(v.code);

            return (
              isActive &&
              isClaimable &&
              isEligible &&
              hasQuantity &&
              (isSpecialOwnedVoucher || isSavedNormalVoucher)
            );
          }),
        );
      })
      .catch((error) => {
        console.error("Không lấy được voucher hồ sơ:", error);
      });
  }, [savedVoucherCodes]);

  useEffect(() => {
    membershipService
      .getMyMembership()
      .then((data) => {
        setMembership(
          data || { vip: false, membershipName: "Thành viên thường" },
        );
      })
      .catch(() =>
        setMembership({ vip: false, membershipName: "Thành viên thường" }),
      );
  }, []);

  useEffect(() => {
    if (currentUser) {
      orderService
        .getMyOrders(currentUser.id)
        .then((data) => {
          setRecentOrders(data.slice(0, 3));
          setOrderStats({
            pending: data.filter(o => String(o.status || "").toUpperCase() === 'PENDING').length,
            processing: data.filter(o => ['PROCESSING', 'CONFIRMED'].includes(String(o.status || "").toUpperCase())).length,
            shipped: data.filter(o => ['SHIPPED', 'SHIPPING'].includes(String(o.status || "").toUpperCase())).length,
            delivered: data.filter(o => ['DELIVERED', 'COMPLETED', 'PAID'].includes(String(o.status || "").toUpperCase())).length,
            cancelled: data.filter(o => String(o.status || "").toUpperCase() === 'CANCELLED').length,
          });
        })
        .catch(() => {});
    }
  }, [currentUser]);

  useEffect(() => {
    // Lấy sản phẩm mới nhất làm gợi ý mặc định nếu AI chưa có dữ liệu
    userProductService.getProducts({ pageSize: 4, sort: "newest" })
      .then(res => setSuggestedProducts(res.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    coinRewardService.getOverview()
      .then(data => setCoinBalance(data?.balance || 0))
      .catch(() => setCoinBalance(0));
  }, []);

  const handleOrderStatusClick = (e, status, count, label) => {
    e.preventDefault();
    if (count === 0) {
      toast(`Bạn chưa có đơn hàng nào ở trạng thái "${label}"`, { icon: "📦" });
    } else {
      navigate(`/orders?status=${status}`);
    }
  };

  if (!currentUser) return null;
  const membershipLabel = membership?.vip
    ? membership?.membershipName || "Thành viên VIP"
    : "Thành viên thường";

  const calculateMembershipProgress = () => {
    if (!membership?.vip || !membership?.startedAt || !membership?.endedAt) {
      return 0;
    }
    const start = new Date(membership.startedAt).getTime();
    const end = new Date(membership.endedAt).getTime();
    const now = Date.now();

    if (now >= end) return 100;
    if (now <= start) return 0;
    
    return Math.round(((now - start) / (end - start)) * 100);
  };
  const membershipProgress = calculateMembershipProgress();
  const timeRemainingPercent = 100 - membershipProgress;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 overflow-x-hidden">
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
                <ShieldCheck
                  size={16}
                  className={
                    membership?.vip ? "text-rose-500" : "text-slate-500"
                  }
                />{" "}
                {membershipLabel}
              </p>
              <div className="mt-4 max-w-sm mx-auto lg:mx-0">
                {membership?.vip ? (
                  <>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">
                      <span>Thời hạn gói VIP</span>
                      <span>Còn lại {timeRemainingPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all duration-1000" 
                        style={{ width: `${timeRemainingPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 italic">
                      Hết hạn vào: {membership?.endedAt ? new Date(membership.endedAt).toLocaleDateString("vi-VN") : "--"}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">
                      <span>Chưa có gói VIP</span>
                      <span>0%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-600 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                    <Link to="/membership" className="text-[10px] text-rose-400 hover:text-rose-300 mt-2 italic flex items-center gap-1 justify-center lg:justify-start">
                      Đăng ký ngay để nhận đặc quyền <ArrowRight size={10} />
                    </Link>
                  </>
                )}
              </div>
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

      <div className="container-padded -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
                  Ví xu của tôi
                </p>
                <h2 className="text-6xl font-black italic tracking-tighter mt-1">
                  {Number(coinBalance).toLocaleString("vi-VN")}
                </h2>
              </div>
              <Link to="/coin-rewards" className="mt-4 flex items-center gap-2 text-rose-400 font-bold text-xs uppercase italic hover:text-rose-300 transition-colors">
                <Rocket size={14} /> Đổi xu nhận ngay ưu đãi! <ArrowRight size={12} />
              </Link>
            </div>
          </motion.div>

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
                    className="group bg-white/60 backdrop-blur-sm rounded-[1.5rem] p-4 flex items-start gap-4 border-l-4 border-rose-500 shadow-sm hover:bg-white transition-all"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl ${catConfig.bg} flex items-center justify-center text-white shrink-0 shadow-md`}
                    >
                      <Ticket size={20} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <p
                          className={`font-black text-sm text-slate-800 ${catConfig.hover} truncate`}
                        >
                          {v.code}
                        </p>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${catConfig.text} bg-white/70`}
                        >
                          {catConfig.label}
                        </span>
                      </div>
                      <p className="text-rose-600 font-bold text-lg mt-1">
                        {v.discountType === "PERCENT"
                          ? `Giảm ${v.discountValue}%`
                          : `Giảm ${formatCurrency(v.discountValue)}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Đơn từ {formatCurrency(v.minOrderValue)} • HSD:{" "}
                        {formatDate(v.expiryDate)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              {!myVouchers.length && (
                <div className="text-center text-slate-500 py-10 italic">
                  Ví voucher đang trống.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KHU VỰC THỐNG KÊ ĐƠN HÀNG */}
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-slate-100 mb-6 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black uppercase italic text-sm border-l-4 border-rose-600 pl-3 text-slate-900">
              Đơn hàng của tôi
            </h3>
            <Link to="/orders" className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline">
              Lịch sử mua hàng
            </Link>
          </div>
          
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            <a 
              href="#" 
              onClick={(e) => handleOrderStatusClick(e, 'PENDING', orderStats.pending, 'Chờ xác nhận')} 
              className="flex flex-col items-center justify-center gap-2 group relative"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                  <Wallet size={24} />
                </div>
                {orderStats.pending > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm">
                    {orderStats.pending}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600 text-center group-hover:text-amber-600 transition-colors line-clamp-1">Chờ xác nhận</span>
            </a>

            <a 
              href="#" 
              onClick={(e) => handleOrderStatusClick(e, 'PROCESSING', orderStats.processing, 'Đang xử lý')} 
              className="flex flex-col items-center justify-center gap-2 group relative"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <PackageOpen size={24} />
                </div>
                {orderStats.processing > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm">
                    {orderStats.processing}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600 text-center group-hover:text-indigo-600 transition-colors line-clamp-1">Đang xử lý</span>
            </a>

            <a 
              href="#" 
              onClick={(e) => handleOrderStatusClick(e, 'SHIPPED', orderStats.shipped, 'Đang giao')} 
              className="flex flex-col items-center justify-center gap-2 group relative"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                  <Truck size={24} />
                </div>
                {orderStats.shipped > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm">
                    {orderStats.shipped}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600 text-center group-hover:text-purple-600 transition-colors line-clamp-1">Đang giao</span>
            </a>

            <a 
              href="#" 
              onClick={(e) => handleOrderStatusClick(e, 'DELIVERED', orderStats.delivered, 'Đánh giá')} 
              className="flex flex-col items-center justify-center gap-2 group relative"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <Star size={24} />
                </div>
                {orderStats.delivered > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm">
                    {orderStats.delivered}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600 text-center group-hover:text-emerald-600 transition-colors line-clamp-1">Đánh giá</span>
            </a>

            <a 
              href="#" 
              onClick={(e) => handleOrderStatusClick(e, 'CANCELLED', orderStats.cancelled, 'Đã hủy')} 
              className="flex flex-col items-center justify-center gap-2 group relative"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                  <ArchiveX size={24} />
                </div>
                {orderStats.cancelled > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm">{orderStats.cancelled}</span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600 text-center group-hover:text-rose-600 transition-colors line-clamp-1">Đã hủy</span>
            </a>
          </div>
        </div>

        {/* KHU VỰC MỚI: ĐƠN HÀNG GẦN ĐÂY VÀ YÊU THÍCH */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* 1. KHU VỰC ĐƠN HÀNG GẦN ĐÂY */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase italic text-sm border-l-4 border-indigo-600 pl-3 text-slate-900">
                Đơn hàng gần đây
              </h3>
              <Link
                to="/orders"
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-500">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-slate-900 group-hover:text-indigo-700 transition-colors">
                          Đơn hàng #{order.id}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(order.createdAt || order.orderDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-slate-900">
                        {formatCurrency(order.totalAmount || order.total || 0)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${getStatusColorClass(order.status)}`}
                      >
                        {formatOrderStatus(order.status)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-slate-500">
                  <History size={40} className="text-slate-300 mb-3" />
                  <p className="text-sm font-medium">
                    Bạn chưa có đơn hàng nào.
                  </p>
                  <Link
                    to="/products"
                    className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Bắt đầu mua sắm &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 2. KHU VỰC SẢN PHẨM YÊU THÍCH */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase italic text-sm border-l-4 border-rose-600 pl-3 text-slate-900">
                Sản phẩm yêu thích
              </h3>
              <Link
                to="/wishlist"
                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              {wishlistItems?.length > 0 ? (
                <div className="space-y-3">
                  {wishlistItems.slice(0, 4).map((item) => (
                    <Link
                      key={item.id}
                      to={`/products/${item.slug}`}
                      className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl hover:bg-rose-50 transition-colors group border border-slate-100"
                    >
                      <img
                        src={item.thumbnail || item.image || item.images?.[0] || "https://placehold.co/100"}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate group-hover:text-rose-600 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          {formatCurrency(item.price || item.variants?.[0]?.price || 0)}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {wishlistItems.length > 4 && (
                    <p className="text-center text-xs text-slate-500 pt-2 font-medium italic">
                      Và {wishlistItems.length - 4} sản phẩm khác...
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-300 mb-4 shadow-inner">
                    <Heart size={40} className="fill-current drop-shadow-sm" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    Chưa có sản phẩm yêu thích.
                  </p>
                  <Link
                    to="/products"
                    className="mt-6 px-8 py-3.5 bg-slate-900 text-white text-xs font-black uppercase rounded-xl hover:bg-rose-600 transition-colors shadow-lg active:scale-95"
                  >
                    Khám phá ngay
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LIÊN KẾT HỖ TRỢ NHANH */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Link to="/faq" className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col items-center justify-center text-center gap-2 group">
            <FileQuestion size={24} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
            <span className="text-xs font-bold text-slate-700">Câu hỏi thường gặp</span>
          </Link>
          <Link to="/contact" className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col items-center justify-center text-center gap-2 group">
            <Headphones size={24} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
            <span className="text-xs font-bold text-slate-700">Liên hệ CSKH</span>
          </Link>
          <Link to="/faq" className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col items-center justify-center text-center gap-2 group">
            <ShieldAlert size={24} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
            <span className="text-xs font-bold text-slate-700">Bảo hành & Đổi trả</span>
          </Link>
          <Link to="/membership" className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col items-center justify-center text-center gap-2 group">
            <Sparkles size={24} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
            <span className="text-xs font-bold text-slate-700">Đặc quyền VIP</span>
          </Link>
        </div>

        {/* SẢN PHẨM ĐÃ XEM / GỢI Ý */}
        <div className="pb-10 bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black uppercase italic text-sm border-l-4 border-rose-600 pl-3 text-slate-900">
              Gợi ý cho bạn
            </h3>
            <Link to="/products" className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline">
              Xem tất cả
            </Link>
          </div>
          {suggestedProducts.length > 0 ? (
            <ProductGrid products={suggestedProducts} />
          ) : (
            <div className="text-center text-slate-500 py-10 font-medium">
              <p>Hãy xem thêm các sản phẩm để hệ thống gợi ý cho bạn nhé!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
