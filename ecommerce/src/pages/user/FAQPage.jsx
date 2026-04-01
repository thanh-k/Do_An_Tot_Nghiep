import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  Zap,
  HelpCircle,
  Search,
  MessageSquare,
  PhoneCall,
  ChevronRight,
  Sparkles,
  UserCheck,
  CreditCard,
  RotateCcw,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

// --- BỘ DỮ LIỆU FAQ KHỔNG LỒ & CHI TIẾT ---
const FAQ_DATA = [
  {
    category: "Giao hàng",
    icon: Truck,
    questions: [
      {
        q: "Thời gian giao hàng mất bao lâu?",
        a: "• Nội thành: Giao hỏa tốc trong 2h.\n• Miền Nam/Bắc: 1-2 ngày làm việc.\n• Khu vực khác: 3-5 ngày làm việc tùy đơn vị vận chuyển.",
      },
      {
        q: "Phí vận chuyển được tính như thế nào?",
        a: "NovaShop miễn phí vận chuyển cho đơn hàng từ 500k. Với đơn hàng dưới 500k, phí ship đồng giá 25.000đ trên toàn quốc.",
      },
      {
        q: "Làm sao để tôi theo dõi đơn hàng của mình?",
        a: "Sau khi đặt hàng, bạn vào mục 'Đơn hàng của tôi' trong Dashboard. Mã vận đơn sẽ được cập nhật liên tục kèm link theo dõi trực tuyến.",
      },
    ],
  },
  {
    category: "Bảo hành",
    icon: ShieldCheck,
    questions: [
      {
        q: "Chính sách bảo hành rơi vỡ có được áp dụng không?",
        a: "Mặc định bảo hành chính hãng chỉ áp dụng cho lỗi nhà sản xuất. Tuy nhiên, nếu bạn mua thêm gói 'Nova Care+', bạn sẽ được hỗ trợ 90% chi phí sửa chữa kể cả lỗi do người dùng (rơi vỡ, vào nước).",
      },
      {
        q: "Tôi cần mang theo giấy tờ gì khi đi bảo hành?",
        a: "Bạn chỉ cần cung cấp Số điện thoại đặt hàng hoặc Số Seri sản phẩm. NovaShop sử dụng hệ thống bảo hành điện tử 100% nên không cần hóa đơn giấy.",
      },
    ],
  },
  {
    category: "Đổi trả",
    icon: RotateCcw,
    questions: [
      {
        q: "Tôi không ưng ý sản phẩm, có được đổi sang mẫu khác không?",
        a: "Trong vòng 7 ngày, nếu sản phẩm còn nguyên seal và chưa kích hoạt, bạn được đổi sang model khác hoàn toàn miễn phí. Nếu đã bóc seal, phí nhập lại sẽ là 10% giá trị máy.",
      },
      {
        q: "Sản phẩm lỗi trong bao lâu thì được đổi mới?",
        a: "NovaShop áp dụng chính sách 1 ĐỔI 1 trong vòng 30 ngày nếu máy có lỗi phần cứng từ nhà sản xuất.",
      },
    ],
  },
  {
    category: "Tài khoản",
    icon: UserCheck,
    questions: [
      {
        q: "Làm thế nào để tích điểm Nova Points?",
        a: "Với mỗi 10.000đ mua sắm, bạn nhận ngay 1 điểm. Ngoài ra, việc đánh giá sản phẩm có hình ảnh cũng giúp bạn nhận thêm 50-100 điểm/lần.",
      },
      {
        q: "Quên mật khẩu thì phải làm sao?",
        a: "Tại trang đăng nhập, chọn 'Quên mật khẩu'. Hệ thống sẽ gửi mã OTP xác nhận về Email hoặc SĐT bạn đã đăng ký để thiết lập lại mật khẩu mới.",
      },
    ],
  },
  {
    category: "Thanh toán",
    icon: CreditCard,
    questions: [
      {
        q: "Cửa hàng có hỗ trợ trả góp qua thẻ tín dụng không?",
        a: "Có, chúng tôi hỗ trợ trả góp 0% lãi suất qua hơn 25 ngân hàng liên kết. Kỳ hạn linh hoạt từ 3 đến 12 tháng, thủ tục duyệt trong 30 giây.",
      },
      {
        q: "Tôi thanh toán chuyển khoản nhưng chưa thấy cập nhật đơn?",
        a: "Hệ thống cần 5-10 phút để đối soát. Nếu sau 15 phút trạng thái chưa đổi sang 'Đã thanh toán', vui lòng gửi ảnh giao dịch qua khung Chat Admin để được hỗ trợ ngay.",
      },
    ],
  },
];

const SUGGESTED_KEYWORDS = [
  "Giao hỏa tốc",
  "Bảo hành iPhone",
  "Trả góp 0%",
  "Đổi trả seal",
  "Tích điểm VIP",
];

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState("Giao hàng");
  const [openIndex, setOpenIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 overflow-x-hidden">
      {/* 1. DYNAMIC HERO SECTION */}
      <section className="bg-slate-950 pt-24 pb-48 relative text-white text-center overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />

        <div className="container-padded relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 mb-8 backdrop-blur-xl"
          >
            <HelpCircle className="text-rose-500" size={18} />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-300">
              Trung tâm trợ giúp thông minh 24/7
            </span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-10 leading-[0.9]"
          >
            BẠN CẦN <br />{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-400 to-yellow-300">
              HỖ TRỢ GÌ?
            </span>
          </motion.h1>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="relative group">
              <input
                type="text"
                placeholder="Tìm kiếm giải pháp cho vấn đề của bạn..."
                className="w-full bg-white rounded-[2.5rem] px-10 py-6 text-slate-900 outline-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] focus:ring-8 focus:ring-rose-600/10 transition-all font-bold text-lg pr-20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 w-14 h-14 bg-rose-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform cursor-pointer">
                <Search size={24} />
              </div>
            </div>

            {/* GỢI Ý TÌM KIẾM */}
            <div className="flex flex-wrap justify-center gap-3">
              <span className="text-xs font-black uppercase text-slate-500 py-2">
                Gợi ý:
              </span>
              {SUGGESTED_KEYWORDS.map((key) => (
                <button
                  key={key}
                  onClick={() => setSearchTerm(key)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold hover:bg-rose-600 hover:border-rose-600 transition-all"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. NAVIGATION CATEGORIES */}
      <div className="container-padded -mt-20 relative z-30">
        <div className="bg-white p-5 rounded-[3rem] shadow-2xl flex flex-wrap justify-center gap-4 border border-slate-100 overflow-hidden">
          {FAQ_DATA.map((item) => (
            <button
              key={item.category}
              onClick={() => {
                setActiveTab(item.category);
                setOpenIndex(0);
              }}
              className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all ${
                activeTab === item.category
                  ? "bg-rose-600 text-white shadow-2xl shadow-rose-200 scale-105"
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
              }`}
            >
              <item.icon size={22} strokeWidth={2.5} />
              {item.category}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CONTENT AREA: ACCORDION & SIDEBAR */}
      <section className="container-padded py-24">
        <div className="grid lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
          {/* Main Accordion List */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-2 h-10 bg-rose-600 rounded-full"></div>
                  <h3 className="text-3xl font-black uppercase italic text-slate-900">
                    Danh mục {activeTab}
                  </h3>
                </div>

                {FAQ_DATA.find((i) => i.category === activeTab).questions.map(
                  (faq, index) => (
                    <div
                      key={index}
                      className={`rounded-[3rem] border-2 transition-all duration-500 overflow-hidden ${
                        openIndex === index
                          ? "bg-white border-rose-100 shadow-2xl"
                          : "bg-white border-slate-50"
                      }`}
                    >
                      <button
                        onClick={() =>
                          setOpenIndex(openIndex === index ? -1 : index)
                        }
                        className="w-full p-10 flex items-center justify-between text-left group"
                      >
                        <div className="flex items-start gap-6">
                          <span
                            className={`text-2xl font-black italic mt-1 transition-colors ${openIndex === index ? "text-rose-600" : "text-slate-200"}`}
                          >
                            {index < 9 ? `0${index + 1}` : index + 1}
                          </span>
                          <span
                            className={`text-xl font-black uppercase tracking-tighter leading-tight ${openIndex === index ? "text-slate-900" : "text-slate-600"}`}
                          >
                            {faq.q}
                          </span>
                        </div>
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${openIndex === index ? "bg-rose-600 text-white rotate-180 shadow-lg shadow-rose-200" : "bg-slate-50 text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600"}`}
                        >
                          {openIndex === index ? (
                            <Minus size={24} />
                          ) : (
                            <Plus size={24} />
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {openIndex === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <div className="px-10 pb-10 ml-16">
                              <div className="p-8 bg-slate-50 rounded-[2rem] text-slate-600 font-bold leading-relaxed whitespace-pre-line border-l-8 border-rose-600 italic">
                                {faq.a}
                              </div>
                              <div className="mt-6 flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span>Thông tin này có hữu ích không?</span>
                                <button className="text-emerald-500 hover:underline">
                                  Có, hữu ích
                                </button>
                                <button className="text-rose-500 hover:underline">
                                  Không
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ),
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar: Hot Topics & Support */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-950 p-10 rounded-[3rem] text-white relative overflow-hidden group">
              <Lightbulb
                className="text-yellow-400 mb-6 group-hover:scale-125 transition-transform"
                size={40}
              />
              <h4 className="text-2xl font-black uppercase italic mb-4">
                Bạn biết chưa?
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Việc quay video khi mở hộp (Unboxing) là bằng chứng tốt nhất để
                chúng tôi hỗ trợ đổi mới sản phẩm ngay lập tức nếu có hư hỏng
                vật lý.
              </p>
              <button className="flex items-center gap-2 text-rose-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">
                Tìm hiểu quy trình đổi trả <ArrowRight size={14} />
              </button>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-600/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
              <h4 className="text-xl font-black uppercase italic border-l-4 border-rose-600 pl-4">
                Hotline hỗ trợ
              </h4>
              <div className="space-y-6">
                <div className="flex items-center gap-5 group cursor-pointer">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                    <PhoneCall size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      Tư vấn bán hàng
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      1900 6750
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-5 group cursor-pointer">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      Kỹ thuật & bảo hành
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      0909 123 456
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CHÍNH SÁCH CAM KẾT VÀNG */}
      <section className="container-padded">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-gradient-to-r from-rose-600 to-orange-500 rounded-[4rem] p-16 md:p-24 text-center text-white relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(225,29,72,0.4)]"
        >
          <div className="relative z-10 space-y-10">
            <Sparkles
              className="mx-auto text-white/50 animate-pulse"
              size={60}
            />
            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
              VẪN CÒN THẮC MẮC?
            </h2>
            <p className="text-rose-100 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Đội ngũ chuyên gia của NovaShop luôn túc trực để giải quyết mọi
              khiếu nại và thắc mắc của bạn nhanh nhất có thể.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button className="bg-slate-950 px-12 py-5 rounded-full font-black uppercase text-sm tracking-widest hover:bg-white hover:text-rose-600 transition-all shadow-2xl">
                Chat trực tuyến ngay
              </button>
              <button className="bg-white/10 border border-white/20 backdrop-blur-md px-12 py-5 rounded-full font-black uppercase text-sm tracking-widest hover:bg-white/20 transition-all">
                Gửi Email yêu cầu
              </button>
            </div>
          </div>
          {/* Decor elements */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:40px_40px] opacity-30 pointer-events-none"></div>
        </motion.div>
      </section>
    </div>
  );
}
