import {
  Calendar,
  User,
  ChevronRight,
  Search,
  TrendingUp,
  Sparkles,
  Zap,
  Newspaper,
  Clock,
  Eye,
  Share2,
  Bookmark,
  Play,
  Award,
  ArrowRight,
  MoveRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useRef } from "react";

// --- DỮ LIỆU TĨNH NÂNG CAO ---
const CATEGORIES = [
  "Tất cả",
  "Công nghệ",
  "Đánh giá",
  "Tư vấn",
  "Thủ thuật",
  "Sự kiện",
  "Khuyến mãi",
  "Lifestyle",
];

const FEATURED_NEWS = {
  id: "f1",
  title:
    "Kỷ Nguyên Chip M4: Apple Thiết Lập Tiêu Chuẩn Mới Cho Hiệu Năng Trí Tuệ Nhân Tạo",
  description:
    "Với tiến trình 3nm thế hệ mới, chip M4 không chỉ mang lại tốc độ xử lý kinh ngạc mà còn tối ưu hóa sâu cho các tác vụ AI. Hãy cùng ND MALL khám phá sức mạnh thực sự đằng sau siêu phẩm này...",
  image:"https://picsum.photos/seed/ndmall-opening/1200/600",
  category: "Công nghệ",
  date: "31/03/2026",
  author: "Admin Nova",
  readTime: "8 phút đọc",
};

const NEWS_LIST = [
  {
    id: 1,
    title:
      "Đánh giá ROG Strix SCAR 18 (2026): Quái vật gaming mạnh nhất hành tinh",
    description:
      "Sở hữu card đồ họa RTX 5090 và màn hình Mini-LED 240Hz, đây là chiếc laptop mơ ước của mọi game thủ chuyên nghiệp.",
    image:
      "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?q=80&w=800",
    category: "Review",
    date: "30/03/2026",
    views: "12.5k",
  },
  {
    id: 2,
    title: "Cách tối ưu hóa thời lượng pin trên iPhone 15 Pro Max cực đơn giản",
    description:
      "Những mẹo nhỏ nhưng cực kỳ hiệu quả giúp bạn kéo dài thời gian sử dụng thêm 20% mỗi ngày mà không làm giảm hiệu năng.",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800",
    category: "Thủ thuật",
    date: "29/03/2026",
    views: "8.2k",
  },
  {
    id: 3,
    title: "Xu hướng Setup bàn làm việc Minimalist lên ngôi trong năm 2026",
    description:
      "Không gian làm việc tối giản giúp tăng 40% khả năng tập trung. Khám phá ngay các phụ kiện Decor 'quốc dân' đang cháy hàng.",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800",
    category: "Lifestyle",
    date: "28/03/2026",
    views: "15k",
  },
  {
    id: 4,
    title:
      "ND MALL công bố chương trình Thu cũ đổi mới trợ giá lên đến 5 triệu",
    description:
      "Cơ hội nâng cấp lên các dòng smartphone cao cấp nhất với chi phí thấp nhất từ trước đến nay dành riêng cho thành viên VIP.",
    image:
      "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=800",
    category: "Khuyến mãi",
    date: "27/03/2026",
    views: "22k",
  },
];

const TOP_AUTHORS = [
  {
    name: "Trương Hoa",
    role: "Editor-in-Chief",
    avatar: "https://i.pravatar.cc/150?u=hoa",
  },
  {
    name: "Nguyễn Thanh",
    role: "Tech Reviewer",
    avatar: "https://i.pravatar.cc/150?u=thanh",
  },
  {
    name: "Lê Phúc",
    role: "AI Specialist",
    avatar: "https://i.pravatar.cc/150?u=phuc",
  },
];

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* 1. IMMERSIVE HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
        <div className="container-padded relative z-10">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full bg-rose-600/20 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-rose-400 ring-1 ring-rose-500/30 backdrop-blur-md"
            >
              <Sparkles size={14} className="fill-current text-yellow-400" />
              Tạp chí công nghệ & Đời sống
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-black leading-[1.1] tracking-tighter md:text-8xl"
            >
              KHÁM PHÁ <br />
              <span className="bg-gradient-to-r from-rose-400 via-rose-600 to-orange-500 bg-clip-text text-transparent">
                TRI THỨC MỚI
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 max-w-2xl text-lg font-medium text-slate-400 md:text-xl"
            >
              Nơi cập nhật những bài đánh giá chuyên sâu, tin tức thị trường và
              mẹo công nghệ độc quyền dành riêng cho cộng đồng ND MALL.
            </motion.p>
          </div>
        </div>

        {/* Dynamic Background */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600/10 blur-[150px]"></div>
      </section>

      {/* 2. FEATURED SPOTLIGHT */}
      <section className="container-padded relative z-30 -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="group overflow-hidden rounded-[3.5rem] bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="relative col-span-1 lg:col-span-7 overflow-hidden h-[400px] lg:h-auto">
              <img
                src={FEATURED_NEWS.image}
                alt={FEATURED_NEWS.title}
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute left-8 top-8 rounded-2xl bg-rose-600 px-6 py-2 text-xs font-black text-white shadow-xl shadow-rose-600/30">
                BÀI VIẾT TIÊU ĐIỂM
              </div>
            </div>
            <div className="col-span-1 lg:col-span-5 flex flex-col justify-center p-10 lg:p-16">
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
                <span className="text-rose-600">{FEATURED_NEWS.category}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {FEATURED_NEWS.readTime}
                </span>
              </div>
              <h2 className="mt-6 text-3xl font-black leading-tight text-slate-900 md:text-4xl group-hover:text-rose-600 transition-colors">
                {FEATURED_NEWS.title}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-500 italic font-medium">
                "{FEATURED_NEWS.description}"
              </p>
              <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-rose-100 p-0.5 ring-2 ring-rose-50">
                    <img
                      src={TOP_AUTHORS[0].avatar}
                      className="rounded-full object-cover h-full w-full"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">
                      {FEATURED_NEWS.author}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {FEATURED_NEWS.date}
                    </div>
                  </div>
                </div>
                <Link
                  to={`/news/${FEATURED_NEWS.id}`}
                  className="group/btn flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600"
                >
                  Đọc ngay{" "}
                  <MoveRight
                    size={18}
                    className="group-hover/btn:translate-x-2 transition-transform"
                  />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. CATEGORY & SEARCH BAR */}
      <section className="container-padded mt-24">
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row border-b border-slate-200 pb-8">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 w-full lg:w-auto">
            {CATEGORIES.map((cat, i) => (
              <button
                key={i}
                className={`whitespace-nowrap rounded-2xl px-6 py-3 text-sm font-black transition-all ${
                  i === 0
                    ? "bg-rose-600 text-white shadow-xl shadow-rose-600/20 scale-105"
                    : "bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-96">
            <input
              type="text"
              placeholder="Bạn muốn tìm tin tức gì?..."
              className="w-full rounded-2xl border border-slate-100 bg-white px-6 py-4 pl-14 text-sm font-medium outline-none shadow-sm focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 transition-all"
            />
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
          </div>
        </div>
      </section>

      {/* 4. MAIN CONTENT GRID */}
      <section className="container-padded mt-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Main Feed */}
          <div className="lg:col-span-8">
            <h3 className="text-2xl font-black uppercase italic text-slate-900 mb-8 border-l-4 border-rose-600 pl-4 flex items-center gap-3">
              Mới cập nhật{" "}
              <Zap size={20} className="fill-current text-yellow-500" />
            </h3>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              {NEWS_LIST.map((item, i) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
                >
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute left-6 top-6 rounded-xl bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase text-rose-600 ring-1 ring-rose-100">
                      {item.category}
                    </div>
                  </div>
                  <div className="p-8 flex flex-1 flex-col">
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} /> {item.date}
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-500">
                        <Eye size={12} /> {item.views}
                      </div>
                    </div>
                    <h3 className="mt-4 line-clamp-2 text-xl font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-500 font-medium">
                      {item.description}
                    </p>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                      <Link
                        to={`/news/${item.id}`}
                        className="flex items-center gap-2 text-xs font-black uppercase text-rose-600 tracking-wider hover:gap-3 transition-all"
                      >
                        Xem chi tiết <ChevronRight size={16} />
                      </Link>
                      <div className="flex gap-3 text-slate-300">
                        <button className="hover:text-rose-600 transition-colors">
                          <Bookmark size={16} />
                        </button>
                        <button className="hover:text-rose-600 transition-colors">
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-10">
            {/* Trending Column */}
            <div className="rounded-[2.5rem] bg-white p-8 shadow-sm border border-slate-100">
              <h3 className="flex items-center gap-3 text-lg font-black text-slate-900 uppercase italic">
                <TrendingUp className="text-rose-600" size={24} />
                Đang thịnh hành
              </h3>
              <div className="mt-8 space-y-8">
                {[
                  "Lộ diện thiết kế Galaxy S26 Ultra",
                  "MacBook Pro M4: Bước nhảy vọt về AI",
                  "Review 5 mẫu loa Bluetooth cao cấp",
                  "Cách săn sale ND MALL cực hiệu quả",
                ].map((text, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-5 cursor-pointer"
                  >
                    <span className="text-4xl font-black text-slate-50 transition-colors group-hover:text-rose-100">
                      0{i + 1}
                    </span>
                    <p className="text-sm font-bold leading-snug text-slate-800 transition-colors group-hover:text-rose-600 line-clamp-2 uppercase tracking-tighter">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Review Spotlight */}
            <div className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-2 shadow-2xl">
              <div className="relative aspect-video overflow-hidden rounded-[2rem]">
                <img
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600"
                  className="h-full w-full object-cover opacity-60 transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-[0_0_30px_rgba(225,29,72,0.5)] group-hover:scale-125 transition-transform">
                    <Play size={24} className="fill-current ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-[10px] font-black uppercase text-rose-500 mb-2 tracking-widest">
                  Video nổi bật
                </div>
                <h4 className="text-sm font-black text-white leading-snug uppercase italic">
                  Trên tay siêu phẩm màn hình 8K đầu tiên tại Việt Nam
                </h4>
              </div>
            </div>

            {/* Top Authors */}
            <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white">
              <h3 className="flex items-center gap-3 text-lg font-black uppercase italic mb-8">
                <Award className="text-yellow-400" size={24} />
                Đội ngũ chuyên gia
              </h3>
              <div className="space-y-6">
                {TOP_AUTHORS.map((author, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <img
                      src={author.avatar}
                      className="h-10 w-10 rounded-full border-2 border-rose-600/30"
                    />
                    <div>
                      <div className="text-sm font-black">{author.name}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {author.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tag Cloud */}
            <div className="rounded-[2.5rem] bg-white p-8 border border-slate-100">
              <h3 className="text-lg font-black text-slate-900 uppercase italic mb-6">
                Chủ đề hot
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "#iPhone15",
                  "#ChipM4",
                  "#Gaming",
                  "#Setup",
                  "#Review",
                  "#Sapo",
                  "#Design",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* 5. NEWSLETTER BANNER */}
      <section className="container-padded mt-32">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="relative overflow-hidden rounded-[4rem] bg-rose-600 p-12 text-white md:p-24 shadow-[0_40px_80px_-20px_rgba(225,29,72,0.4)]"
        >
          <div className="relative z-10 grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-6 py-2 text-xs font-black uppercase tracking-widest text-white backdrop-blur-lg">
                <Newspaper size={16} />
                Bản tin NovaShop
              </div>
              <h2 className="text-4xl font-black leading-tight md:text-6xl italic">
                CẬP NHẬT CÔNG NGHỆ <br /> ĐÓN ĐẦU XU THẾ
              </h2>
              <p className="text-lg text-rose-100 font-medium">
                Gia nhập cộng đồng hơn 500,000 người theo dõi để nhận những bản
                tin review chất lượng và mã giảm giá 20% hàng tuần.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="email"
                  placeholder="Nhập email của bạn..."
                  className="flex-1 rounded-[2rem] border-none bg-white/10 px-8 py-5 text-sm font-bold text-white placeholder:text-rose-200 outline-none ring-1 ring-white/20 backdrop-blur-md focus:ring-4 focus:ring-white/40 transition-all"
                />
                <button className="group flex items-center justify-center gap-3 rounded-[2rem] bg-slate-950 px-10 py-5 text-sm font-black transition-all hover:bg-white hover:text-rose-600">
                  Đăng ký ngay
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-2 transition-transform"
                  />
                </button>
              </div>
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-rose-200 opacity-60">
                Chúng tôi tôn trọng quyền riêng tư của bạn. Không bao giờ gửi
                spam.
              </p>
            </div>
          </div>

          {/* Animated Background Orbs */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-[100px]"
          />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-slate-950/20 blur-[100px]"></div>
        </motion.div>
      </section>
    </div>
  );
}
