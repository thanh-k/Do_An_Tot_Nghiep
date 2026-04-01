import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Truck,
  CreditCard,
  Zap,
  Gift,
  Clock,
  Info,
  CheckCircle2,
  Sparkles,
  X,
  Search,
  Crown,
  Coins,
  ArrowRight,
  MousePointerClick,
} from "lucide-react";
import confetti from "canvas-confetti";

// --- DỮ LIỆU VOUCHER ĐA DẠNG HƠN ---
const VOUCHERS = [
  {
    id: "V1",
    type: "shipping",
    title: "FREESHIP TOÀN QUỐC",
    description: "Áp dụng cho mọi hình thức thanh toán",
    value: "Giảm 30k",
    expiry: "Hết hạn sau 2h",
    progress: 92,
    color: "from-blue-600 to-indigo-500",
    tag: "Sắp cháy hàng",
  },
  {
    id: "V2",
    type: "discount",
    title: "SIÊU SALE LAPTOP",
    description: "Giảm trực tiếp cho dòng MacBook & Gaming",
    value: "Giảm 2Tr",
    expiry: "Hạn dùng: 05/04",
    progress: 45,
    color: "from-rose-600 to-orange-500",
    tag: "Hot Deal",
  },
  {
    id: "V3",
    type: "payment",
    title: "HOÀN XU MOMO",
    description: "Hoàn xu Nova vào ví tích điểm",
    value: "Hoàn 100k",
    expiry: "Còn 12 ngày",
    progress: 15,
    color: "from-fuchsia-600 to-pink-500",
    tag: "Hoàn tiền",
  },
  {
    id: "V4",
    type: "vip",
    title: "ƯU ĐÃI ĐỘC QUYỀN VIP",
    description: "Dành riêng cho hạng Kim Cương",
    value: "Giảm 25%",
    expiry: "Hạn dùng 30 ngày",
    progress: 10,
    color: "from-amber-500 to-yellow-600",
    tag: "Premium",
  },
  {
    id: "V5",
    type: "shipping",
    title: "FREESHIP EXTRA+",
    description: "Đơn tối thiểu 0đ cho khu vực Nội thành",
    value: "Free 15k",
    expiry: "Hàng ngày",
    progress: 70,
    color: "from-cyan-500 to-blue-500",
    tag: "Mỗi ngày",
  },
  {
    id: "V6",
    type: "discount",
    title: "VOUCHER KOL CHRIS",
    description: "Mã giảm giá từ đối tác truyền thông",
    value: "Giảm 50k",
    expiry: "Còn 3 ngày",
    progress: 30,
    color: "from-violet-600 to-indigo-600",
    tag: "KOL Choice",
  },
];

export default function VoucherPage() {
  const [savedIds, setSavedIds] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleSave = (id) => {
    if (!savedIds.includes(id)) {
      setSavedIds([...savedIds, id]);

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.7 },
        colors: ["#e11d48", "#fbbf24", "#3b82f6", "#d946ef"],
      });

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const filteredVouchers = VOUCHERS.filter((v) => {
    const matchesFilter = filter === "all" || v.type === filter;
    const matchesSearch = v.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 relative overflow-x-hidden">
      {/* 1. TOAST NOTIFICATION */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 24, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-0 left-1/2 z-[100] flex items-center gap-4 bg-slate-900 text-white px-6 py-4 rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 min-w-[320px]"
          >
            <div className="bg-emerald-500 p-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black uppercase tracking-wider">
                Lưu mã thành công!
              </p>
              <p className="text-[11px] text-slate-400 font-medium italic">
                Mã đã sẵn sàng trong ví của bạn.
              </p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. HERO SECTION - RỰC RỠ & CÔNG NGHỆ */}
      <section className="bg-slate-950 pt-20 pb-40 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-600/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />

        <div className="container-padded relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-8"
            >
              <Crown className="text-yellow-400" size={16} />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">
                NovaShop Rewards Center
              </span>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-8 leading-[0.9]"
            >
              KHO VOUCHER <br />{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-400 to-yellow-300">
                SIÊU CẤP 2026
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl font-medium leading-relaxed"
            >
              Săn ngay các mã giảm giá khủng nhất tháng này. Lưu vào ví và sử
              dụng khi thanh toán để hưởng ưu đãi lên đến 70%.
            </motion.p>
          </div>
        </div>
      </section>

      {/* 3. SEARCH & MY WALLET BAR */}
      <div className="container-padded -mt-16 relative z-30">
        <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-6 md:p-8 border border-slate-100 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 w-full relative">
            <input
              type="text"
              placeholder="Tìm mã giảm giá (ví dụ: Apple, Freeship...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-14 py-4 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 transition-all font-medium"
            />
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
          </div>

          <div className="h-10 w-px bg-slate-200 hidden lg:block" />

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Ví của tôi
              </p>
              <p className="text-lg font-black text-slate-900">
                {savedIds.length} Voucher đã lưu
              </p>
            </div>
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full border-4 border-white bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm"
                >
                  <Ticket size={20} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. FILTER TABS */}
      <div className="container-padded mt-12 overflow-x-auto no-scrollbar py-2">
        <div className="flex justify-start md:justify-center gap-4 min-w-max">
          {[
            { id: "all", label: "Tất cả mã", icon: Ticket },
            { id: "shipping", label: "Vận chuyển", icon: Truck },
            { id: "discount", label: "Giảm giá", icon: Zap },
            { id: "payment", label: "Hoàn xu", icon: Coins },
            { id: "vip", label: "Đặc quyền VIP", icon: Crown },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-sm font-black transition-all border ${
                filter === tab.id
                  ? "bg-rose-600 text-white border-rose-600 shadow-xl shadow-rose-200 scale-105"
                  : "bg-white text-slate-500 border-slate-100 hover:border-rose-200 hover:text-rose-600 shadow-sm"
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. VOUCHER GRID */}
      <section className="container-padded py-12">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredVouchers.map((v) => (
              <motion.div
                key={v.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -8 }}
                className="relative bg-white rounded-[2.5rem] shadow-xl flex overflow-hidden group border border-slate-100 min-h-[220px]"
              >
                {/* Ribbon Tag */}
                <div
                  className={`absolute top-0 right-0 px-6 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-tighter text-white bg-gradient-to-r ${v.color} z-10 shadow-md`}
                >
                  {v.tag}
                </div>

                {/* Left Side (The Ticket Stub) */}
                <div
                  className={`w-36 md:w-48 bg-gradient-to-br ${v.color} p-8 flex flex-col items-center justify-center text-white relative shadow-inner`}
                >
                  <div className="absolute top-0 bottom-0 -right-3 flex flex-col justify-around py-4 z-20">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 bg-[#f8fafc] rounded-full -mr-3"
                      />
                    ))}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="p-4 bg-white/20 rounded-[2rem] backdrop-blur-md mb-4"
                  >
                    {v.type === "shipping" && (
                      <Truck size={44} strokeWidth={2.5} />
                    )}
                    {v.type === "discount" && (
                      <Zap size={44} strokeWidth={2.5} />
                    )}
                    {v.type === "payment" && (
                      <Coins size={44} strokeWidth={2.5} />
                    )}
                    {v.type === "vip" && <Crown size={44} strokeWidth={2.5} />}
                  </motion.div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">
                    Nova Exclusive
                  </span>
                </div>

                {/* Right Side (Information) */}
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-rose-600 transition-colors">
                        {v.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 font-bold mb-6 italic leading-relaxed">
                      {v.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                        <span className="text-slate-400">
                          Số lượng có hạn: {v.progress}%
                        </span>
                        <span className="text-rose-600 flex items-center gap-1.5">
                          <Clock size={14} className="animate-pulse" />{" "}
                          {v.expiry}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${v.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full bg-gradient-to-r ${v.color}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-6 pt-6 border-t border-dashed border-slate-200">
                    <div className="text-3xl font-black text-rose-600 italic tracking-tighter uppercase drop-shadow-sm">
                      {v.value}
                    </div>
                    <button
                      onClick={() => handleSave(v.id)}
                      disabled={savedIds.includes(v.id)}
                      className={`relative overflow-hidden group/btn px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                        savedIds.includes(v.id)
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-not-allowed"
                          : "bg-slate-950 text-white hover:bg-rose-600 shadow-2xl hover:shadow-rose-300"
                      }`}
                    >
                      {savedIds.includes(v.id) ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 size={16} /> Đã có trong ví
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Lưu mã ngay{" "}
                          <MousePointerClick
                            size={16}
                            className="animate-bounce"
                          />
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* 6. VIP PROMOTION BANNER */}
      <section className="container-padded py-10">
        <motion.div
          whileHover={{ y: -10 }}
          className="bg-gradient-to-r from-slate-950 via-rose-950 to-rose-700 rounded-[4rem] p-16 text-center text-white relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:24px_24px] opacity-30" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mb-8 backdrop-blur-md border border-white/20">
              <Crown className="text-yellow-400" size={40} />
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-6 uppercase italic tracking-tighter">
              BẠN LÀ HỘI VIÊN VIP?
            </h2>
            <p className="mb-12 text-rose-100 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
              Nâng cấp gói hội viên Diamond để nhận thêm đặc quyền Freeship 0đ
              không giới hạn và mã hoàn tiền 50% cho mọi mặt hàng công nghệ.
            </p>
            <button className="bg-white text-rose-600 px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-yellow-300 hover:text-rose-700 transition-all shadow-2xl flex items-center gap-3 group">
              Nâng cấp tài khoản ngay{" "}
              <ArrowRight
                size={20}
                className="group-hover:translate-x-2 transition-transform"
              />
            </button>
          </div>

          <Gift
            className="absolute -right-16 -bottom-16 text-white/5 rotate-12"
            size={300}
          />
          <Sparkles
            className="absolute left-10 top-10 text-yellow-300/20 animate-pulse"
            size={60}
          />
        </motion.div>
      </section>
    </div>
  );
}
