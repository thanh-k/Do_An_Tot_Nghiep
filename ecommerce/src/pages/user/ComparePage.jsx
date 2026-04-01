import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  Cpu,
  Battery,
  Smartphone,
  Camera,
  Zap,
  ShieldCheck,
  ShoppingCart,
  X,
  Plus,
  Sparkles,
  Monitor,
  ThumbsUp,
  ThumbsDown,
  Award,
  Layers,
  CheckCircle2,
  Lightbulb,
  Phone,
  MessageCircle,
  Truck,
  RefreshCcw,
  Headphones,
  CreditCard,
} from "lucide-react";

// --- DANH SÁCH SẢN PHẨM THẬT (Mô phỏng dữ liệu từ database) ---
const ALL_PRODUCTS = [
  {
    id: 1,
    name: "iPhone 15 Pro Max 256GB",
    image:
      "https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=400",
    price: 32990000,
    brand: "Apple",
    score: 9.5,
    pros: [
      "Chip A17 Pro siêu mạnh",
      "Khung Titan siêu nhẹ",
      "Hệ điều hành iOS ổn định",
    ],
    cons: [
      "Giá thành cực cao",
      "Tốc độ sạc chưa ấn tượng",
      "Phụ kiện đi kèm hạn chế",
    ],
    specs: {
      design: "Titanium Grade 5",
      display: "6.7 inch, 120Hz",
      performance: "Apple A17 Pro",
      ram: "8GB",
      camera: "48MP | Zoom 5x",
      battery: "4,441 mAh",
      weight: "221g",
      os: "iOS 17",
    },
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    image:
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=400",
    price: 29990000,
    brand: "Samsung",
    score: 9.4,
    pros: [
      "Bút S-Pen đa năng",
      "Màn hình chống chói tốt nhất",
      "Camera Zoom 100x",
    ],
    cons: [
      "Kích thước máy khá lớn",
      "Nhanh mất giá hơn iPhone",
      "One UI đôi khi lag nhẹ",
    ],
    specs: {
      design: "Titanium Frame",
      display: "6.8 inch, 120Hz",
      performance: "Snap 8 Gen 3",
      ram: "12GB",
      camera: "200MP | Zoom 100x",
      battery: "5,000 mAh",
      weight: "232g",
      os: "Android 14",
    },
  },
  {
    id: 3,
    name: "MacBook Pro M3 14 inch",
    image:
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=60",
    price: 39990000,
    brand: "Apple",
    score: 9.6,
    pros: [
      "Pin dùng liên tục 18 tiếng",
      "Màn hình Liquid Retina XDR",
      "Hiệu năng Render cực đỉnh",
    ],
    cons: [
      "Thiếu cổng kết nối",
      "Giá nâng cấp RAM rất đắt",
      "Không chơi được nhiều Game",
    ],
    specs: {
      design: "Nhôm nguyên khối",
      display: "14.2 inch, 120Hz",
      performance: "Apple M3 Chip",
      ram: "8GB/16GB",
      camera: "1080p FaceTime",
      battery: "18 Giờ",
      weight: "1.55kg",
      os: "macOS Sonoma",
    },
  },
  {
    id: 4,
    name: "Dell XPS 15 9530 (2023)",
    image:
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=400",
    price: 45000000,
    brand: "Dell",
    score: 9.0,
    pros: [
      "Thiết kế sang trọng nhất Windows",
      "Màn hình OLED 3.5K",
      "Bàn phím gõ rất sướng",
    ],
    cons: [
      "Máy khá nóng khi làm việc nặng",
      "Giá cao so với cấu hình",
      "Thời lượng pin trung bình",
    ],
    specs: {
      design: "Sợi Carbon & Nhôm",
      display: "15.6 inch, OLED",
      performance: "Core i7-13700H",
      ram: "16GB/32GB",
      camera: "720p HD",
      battery: "86Wh",
      weight: "1.86kg",
      os: "Windows 11 Pro",
    },
  },
];

const CATEGORIES = [
  { key: "design", label: "Thiết kế", icon: Layers },
  { key: "display", label: "Màn hình", icon: Monitor },
  { key: "performance", label: "Hiệu năng", icon: Cpu },
  { key: "ram", label: "Bộ nhớ RAM", icon: Zap },
  { key: "camera", label: "Camera", icon: Camera },
  { key: "battery", label: "Pin & Sạc", icon: Battery },
  { key: "weight", label: "Trọng lượng", icon: Smartphone },
  { key: "os", label: "Hệ điều hành", icon: Sparkles },
];

export default function ComparePage() {
  const [slots, setSlots] = useState([ALL_PRODUCTS[0], ALL_PRODUCTS[1]]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);

  // LOGIC: Tìm index của sản phẩm có điểm cao nhất để gắn nhãn Winner
  const getWinnerIndex = () => {
    let maxScore = -1;
    let winnerIdx = -1;
    slots.forEach((p, idx) => {
      if (p && p.score > maxScore) {
        maxScore = p.score;
        winnerIdx = idx;
      }
    });
    return winnerIdx;
  };

  const winnerIndex = getWinnerIndex();

  const handleRemove = (index) => {
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
  };

  const handleOpenAdd = (index) => {
    setActiveSlotIndex(index);
    setIsModalOpen(true);
  };

  const handleSelectProduct = (product) => {
    // VALIDATE: Kiểm tra xem sản phẩm đã được chọn ở slot khác chưa
    const isAlreadySelected = slots.some((p) => p && p.id === product.id);

    if (isAlreadySelected) {
      alert("Sản phẩm này đã có trong danh sách so sánh rồi nhé!");
      return;
    }

    const newSlots = [...slots];
    newSlots[activeSlotIndex] = product;
    setSlots(newSlots);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white pb-20 overflow-x-hidden relative">
      {/* 1. HERO SECTION */}
      <section className="bg-slate-950 pt-24 pb-48 text-white relative">
        <div className="container-padded relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/30 mb-8"
          >
            <Lightbulb size={14} />{" "}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Hệ thống phân tích độc quyền
            </span>
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-8xl font-black italic uppercase leading-none tracking-tighter"
          >
            SO SÁNH <span className="text-rose-600">ĐỐI KHÁNG</span>
          </motion.h1>
        </div>
      </section>

      {/* 2. BẢNG SO SÁNH */}
      <div className="container-padded -mt-32 relative z-30">
        <div className="bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full border-collapse table-fixed min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="w-[20%] p-10 bg-slate-50/50 text-left align-middle">
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                        <Zap size={24} fill="currentColor" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 uppercase italic leading-none">
                        Thông số <br /> So sánh
                      </h3>
                    </div>
                  </th>

                  {slots.map((product, index) => (
                    <th
                      key={index}
                      className="w-[40%] p-10 border-l border-slate-50 relative group"
                    >
                      {product ? (
                        <div className="flex flex-col items-center gap-6">
                          <button
                            onClick={() => handleRemove(index)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white transition-all z-20 shadow-sm"
                          >
                            <X size={16} />
                          </button>
                          <div className="relative">
                            <motion.img
                              whileHover={{ y: -10 }}
                              src={product.image}
                              className="h-56 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-transform duration-500"
                            />
                            {index === winnerIndex && (
                              <div className="absolute -top-4 -right-4 bg-rose-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-xl border-2 border-white animate-bounce">
                                🏆 LỰA CHỌN TỐT NHẤT
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">
                              {product.brand}
                            </p>
                            <h4 className="text-2xl font-black text-slate-900 leading-tight line-clamp-1">
                              {product.name}
                            </h4>
                            <p className="text-3xl font-black text-slate-950 mt-3 italic">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(product.price)}
                            </p>
                          </div>
                          {/* --- BỔ SUNG 2 NÚT HÀNH ĐỘNG --- */}
                          <div className="w-full space-y-3 pt-2">
                            <button className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 transition-all shadow-lg active:scale-95">
                              <ShoppingCart size={16} />
                              Thêm vào giỏ
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95">
                              <CreditCard size={16} />
                              Mua ngay
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAdd(index)}
                          className="flex flex-col items-center justify-center h-full min-h-[350px] w-full border-4 border-dashed border-slate-100 rounded-[3rem] hover:border-rose-200 hover:bg-rose-50/50 transition-all group"
                        >
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all mb-4">
                            <Plus size={32} />
                          </div>
                          <span className="text-sm font-black text-slate-400 uppercase group-hover:text-rose-600">
                            Chọn sản phẩm so sánh
                          </span>
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* LỜI KHUYÊN DỰA TRÊN LOGIC ĐỘNG */}
                <tr className="bg-rose-50/20">
                  <td className="p-8 text-center">
                    <span className="text-xs font-black uppercase tracking-widest text-rose-600 font-bold">
                      Phân tích AI
                    </span>
                  </td>
                  {slots.map((product, i) => (
                    <td key={i} className="p-8 border-l border-rose-100">
                      {product ? (
                        <div className="p-5 bg-white rounded-3xl border border-rose-200 shadow-sm">
                          <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                            {i === winnerIndex
                              ? `Với điểm số Expert: ${product.score}/10, đây là thiết bị vượt trội nhất về mọi mặt trong danh sách này.`
                              : `Sản phẩm này có cấu hình khá ổn, nhưng điểm số ${product.score} cho thấy nó chưa tối ưu bằng đối thủ.`}
                          </p>
                        </div>
                      ) : (
                        <div className="h-24" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* ƯU & NHƯỢC ĐIỂM CHI TIẾT */}
                <tr>
                  <td className="p-8 border-t border-slate-50 align-middle text-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Ưu điểm
                    </span>
                  </td>
                  {slots.map((p, i) => (
                    <td
                      key={i}
                      className="p-8 border-t border-l border-slate-100 align-top"
                    >
                      {p ? (
                        <div className="space-y-2">
                          {p.pros.map((txt, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 p-2 rounded-xl"
                            >
                              <ThumbsUp size={12} className="shrink-0 mt-0.5" />{" "}
                              {txt}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "---"
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-8 border-t border-slate-50 align-middle text-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Nhược điểm
                    </span>
                  </td>
                  {slots.map((p, i) => (
                    <td
                      key={i}
                      className="p-8 border-t border-l border-slate-100 align-top"
                    >
                      {p ? (
                        <div className="space-y-2">
                          {p.cons.map((txt, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-[11px] font-bold text-rose-500 bg-rose-50 p-2 rounded-xl"
                            >
                              <ThumbsDown
                                size={12}
                                className="shrink-0 mt-0.5"
                              />{" "}
                              {txt}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "---"
                      )}
                    </td>
                  ))}
                </tr>

                {/* CÁC DÒNG THÔNG SỐ KỸ THUẬT */}
                {CATEGORIES.map((cat, idx) => (
                  <tr
                    key={idx}
                    className="group hover:bg-slate-50 transition-colors border-t border-slate-50"
                  >
                    <td className="p-8 align-middle">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                          <cat.icon size={18} />
                        </div>
                        <span className="font-bold text-slate-900 text-sm uppercase tracking-tight">
                          {cat.label}
                        </span>
                      </div>
                    </td>
                    {slots.map((product, i) => (
                      <td
                        key={i}
                        className="p-8 border-l border-slate-50 text-center"
                      >
                        <span
                          className={`text-base font-bold leading-relaxed ${product && i === winnerIndex ? "text-slate-900" : "text-slate-500"}`}
                        >
                          {product ? product.specs[cat.key] : "---"}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. MODAL CHỌN SẢN PHẨM (WITH VALIDATE) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-950/40">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-rose-500" />
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">
                    Chọn thiết bị đối đầu
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 max-h-[550px] overflow-y-auto space-y-4 no-scrollbar">
                {ALL_PRODUCTS.map((p) => {
                  // Check if already in slots
                  const isSelected = slots.some((s) => s && s.id === p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => !isSelected && handleSelectProduct(p)}
                      className={`flex items-center gap-6 p-5 rounded-[2.5rem] border-2 transition-all ${
                        isSelected
                          ? "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                          : "border-slate-50 hover:border-rose-600 hover:bg-rose-50 cursor-pointer group"
                      }`}
                    >
                      <img src={p.image} className="w-24 h-24 object-contain" />
                      <div className="flex-1">
                        <h4 className="font-black text-slate-900 uppercase text-sm leading-tight">
                          {p.name}
                        </h4>
                        <p className="text-rose-600 font-bold mt-1">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(p.price)}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-black">
                            CHIP: {p.specs.performance}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] bg-slate-200 px-3 py-1 rounded-full text-slate-400 font-black">
                              ĐÃ CHỌN
                            </span>
                          )}
                        </div>
                      </div>
                      {!isSelected && (
                        <Plus
                          className="text-slate-300 group-hover:text-rose-600 group-hover:scale-125 transition-all"
                          size={28}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. CHÍNH SÁCH CAM KẾT & LIÊN HỆ ADMIN (RỰC RỠ) */}
      <section className="container-padded pt-40">
        <div className="text-center mb-16">
          <h2 className="text-rose-600 font-black uppercase tracking-[0.4em] text-xs mb-4">
            Support Center
          </h2>
          <h3 className="text-4xl font-black text-slate-900 italic uppercase leading-none">
            Cam kết từ NovaShop
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
          {[
            {
              icon: Truck,
              title: "Giao hỏa tốc 2h",
              desc: "Miễn phí vận chuyển nội thành cho đơn trên 10Tr.",
            },
            {
              icon: RefreshCcw,
              title: "Đổi trả 1-1",
              desc: "Lỗi là đổi mới ngay lập tức trong vòng 30 ngày.",
            },
            {
              icon: ShieldCheck,
              title: "Bảo hành 24th",
              desc: "Hệ thống trung tâm bảo hành toàn quốc 63 tỉnh thành.",
            },
            {
              icon: Headphones,
              title: "Hỗ trợ 24/7",
              desc: "Đội ngũ chuyên gia luôn sẵn sàng giải đáp mọi thắc mắc.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-6 group-hover:bg-rose-600 transition-colors shadow-lg">
                <item.icon size={24} />
              </div>
              <h4 className="font-black text-slate-900 mb-2 uppercase text-sm">
                {item.title}
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-slate-950 rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
                Kết nối với <br />{" "}
                <span className="text-rose-600">Ban Quản Trị</span>
              </h2>
              <p className="text-slate-400 text-lg">
                Mọi phản hồi về chất lượng dịch vụ hoặc cần tư vấn sâu hơn về
                cấu hình sản phẩm, vui lòng liên hệ trực tiếp với đội ngũ Admin
                NovaShop.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="tel:19006750"
                  className="flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-full font-black text-sm hover:bg-rose-600 hover:text-white transition-all"
                >
                  <Phone size={20} /> Hotline: 1900 6750
                </a>
                <button className="flex items-center gap-3 bg-rose-600 text-white px-8 py-4 rounded-full font-black text-sm hover:bg-rose-700 transition-all shadow-[0_0_30px_rgba(225,29,72,0.4)]">
                  <MessageCircle size={20} /> Chat Zalo (Admin)
                </button>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="w-64 h-64 bg-rose-600/20 rounded-full blur-[100px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-md relative z-10 text-center space-y-6">
                <Award className="mx-auto text-yellow-400" size={60} />
                <p className="text-xl font-black italic">
                  "Uy tín tạo nên thương hiệu dẫn đầu trong kỷ nguyên công nghệ
                  số"
                </p>
                <p className="text-rose-600 font-bold uppercase tracking-widest text-xs">
                  - CEO NovaShop Group -
                </p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:32px_32px]"></div>
        </div>
      </section>
    </div>
  );
}
