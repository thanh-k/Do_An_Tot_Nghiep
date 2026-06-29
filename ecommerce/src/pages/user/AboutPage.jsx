import {
  Target,
  Users,
  ShieldCheck,
  Zap,
  Award,
  Globe,
  Rocket,
  Heart,
  Star,
  TrendingUp,
  CheckCircle2,
  Store,
  Eye,
  History,
  MapPin,
  ShieldAlert,
  Headphones,
  Trophy,
  Sparkles,
  MoveRight,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import truonghoaImg from "@/assets/truonghoa.jpg";
import nguyenthanhImg from "@/assets/Nguyenthanh.jpg";
import duphucImg from "@/assets/duphuc.jpg";

export default function AboutPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-white pb-12">
      <section className="relative flex items-center justify-center overflow-hidden bg-slate-950 text-white py-20 pb-28 sm:py-28 sm:pb-36">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="container-padded relative z-20 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-600/20 px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-rose-400 ring-1 ring-rose-500/30"
          >
            <Sparkles size={12} className="fill-current" />
            Hành trình 10 năm phụng sự
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-4xl font-black leading-[1.1] tracking-tighter md:text-6xl"
          >
            KIẾN TẠO <br />
            <span className="bg-gradient-to-r from-rose-400 via-rose-600 to-orange-500 bg-clip-text text-transparent">
              KỶ NGUYÊN MỚI
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mx-auto mt-4 max-w-xl text-sm md:text-lg font-medium text-slate-400"
          >
            ND MALL không chỉ dừng lại ở thương mại điện tử. Chúng tôi xây dựng
            một hệ sinh thái số hiện đại, nơi niềm tin của khách hàng là kim chỉ
            nam cho mọi đổi mới.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 md:mt-8 flex flex-wrap justify-center gap-3"
          >
            <Link
              to="/products"
              className="rounded-full bg-rose-600 px-5 py-3 sm:px-6 sm:py-3.5 text-xs font-black transition-all hover:bg-rose-700 hover:shadow-[0_0_20px_rgba(225,29,72,0.3)]"
            >
              Mua sắm ngay
            </Link>
            <button className="rounded-full border border-white/20 bg-white/5 px-5 py-3 sm:px-6 sm:py-3.5 text-xs font-black backdrop-blur-md transition-all hover:bg-white/10">
              Xem Profile Công Ty
            </button>
          </motion.div>
        </motion.div>

        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(225,29,72,0.1),transparent_70%)]"></div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -right-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-rose-600/10 blur-[100px]"
        ></motion.div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="container-padded relative z-30 -mt-10 md:-mt-16">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {[
            { label: "Khách hàng thân thiết", value: "3.2M+", icon: Users },
            { label: "Trung tâm bảo hành", value: "65+", icon: ShieldCheck },
            { label: "Đối tác chiến lược", value: "200+", icon: Award },
            { label: "Độ phủ tỉnh thành", value: "63/63", icon: Globe },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl transition-all hover:-translate-y-2 hover:border-rose-200"
              >
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="mt-3 sm:mt-4">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {stat.value}
                  </div>
                  <div className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. STORY SECTION */}
      <section className="container-padded py-12 md:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative z-10 overflow-hidden rounded-3xl sm:rounded-[3rem] shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000"
                alt="Office"
                className="aspect-[4/3] sm:aspect-[4/5] object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 -z-10 h-64 w-64 rounded-full bg-rose-100 blur-3xl opacity-50"></div>
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute right-2 sm:-right-8 top-1/4 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-2xl border border-rose-100"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-inner">
                  <Trophy className="h-5 w-5 sm:h-7 sm:w-7" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-slate-900">
                    Top 1 Retail 2025
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500">
                    Bình chọn bởi người dùng
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="space-y-8 md:space-y-12">
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.4em] text-rose-600">
                Về chúng tôi
              </h2>
              <h3 className="text-3xl font-black leading-tight text-slate-900 md:text-6xl italic">
                Chất lượng thật <br />
                <span className="text-rose-600">Giá trị thật</span>
              </h3>
              <p className="text-base sm:text-lg leading-relaxed text-slate-600">
                Ra đời giữa tâm điểm của cuộc cách mạng số, ND MALL đã chọn cho
                mình con đường khó khăn nhất: <b>Tử tế trong kinh doanh</b>.
                Chúng tôi loại bỏ mọi rào cản giữa khách hàng và công nghệ bằng
                hệ thống vận hành thông minh và minh bạch tuyệt đối.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Eye className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h4 className="font-black text-slate-900 text-lg sm:text-xl">Tầm nhìn</h4>
                <p className="text-slate-500 text-sm">
                  Trở thành biểu tượng bán lẻ số 1 khu vực Đông Nam Á vào năm
                  2030.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-rose-600 text-white">
                  <History className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h4 className="font-black text-slate-900 text-lg sm:text-xl">Lịch sử</h4>
                <p className="text-slate-500 text-sm">
                  Phát triển bền vững từ chuỗi cửa hàng truyền thống sang thương
                  mại số.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE VALUES - BENTO GRID */}
      <section className="bg-slate-950 py-12 md:py-20 text-white overflow-hidden relative">
        <div className="container-padded">
          <div className="mb-12 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-rose-500 font-black uppercase tracking-[0.3em] mb-3 text-xs sm:text-sm">
                Giá trị cốt lõi
              </h2>
              <h3 className="text-3xl md:text-5xl font-black italic uppercase leading-tight">
                Bản sắc làm nên thương hiệu
              </h3>
            </div>
            <p className="text-slate-400 max-w-sm text-sm">
              Những nguyên tắc không bao giờ thay đổi tại ND MALL trong suốt
              thập kỷ qua.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-4">
            <motion.div
              whileHover={{ scale: 0.98 }}
              className="md:col-span-2 p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] bg-rose-600 flex flex-col justify-between min-h-[280px] sm:min-h-[350px] relative overflow-hidden group"
            >
              <ShieldCheck
                className="absolute -right-10 -bottom-10 opacity-20 group-hover:scale-110 transition-transform h-24 w-24 sm:h-32 sm:w-32"
              />
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div>
                <h4 className="text-2xl sm:text-3xl font-black mb-3">An Toàn Tuyệt Đối</h4>
                <p className="text-rose-100 text-sm">
                  Bảo mật thông tin khách hàng và chất lượng sản phẩm là ưu tiên
                  số 1 của chúng tôi.
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 0.98 }}
              className="p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] bg-slate-900 border border-slate-800 flex flex-col justify-between min-h-[180px] sm:min-h-[350px]"
            >
              <Zap size={32} className="text-rose-500" />
              <div className="mt-8 md:mt-0">
                <h4 className="text-lg sm:text-xl font-black mb-2 uppercase">Tốc độ</h4>
                <p className="text-slate-500 text-sm">
                  Giao hàng 2h và hỗ trợ kỹ thuật tức thì.
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 0.98 }}
              className="p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] bg-white text-slate-950 flex flex-col justify-between min-h-[180px] sm:min-h-[350px]"
            >
              <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-rose-600 fill-current" />
              <div className="mt-8 md:mt-0">
                <h4 className="text-lg sm:text-xl font-black mb-2 uppercase">Tận tâm</h4>
                <p className="text-slate-500 text-sm">
                  Lắng nghe để hiểu, thấu cảm để phục vụ.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. PROCESS SECTION */}
      <section className="container-padded py-12 md:py-20">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-rose-600 font-black uppercase tracking-[0.4em] mb-3 text-xs sm:text-sm">
            Quy trình làm việc
          </h2>
          <h3 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
            Cách chúng tôi vận hành
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-5 md:gap-8">
          {[
            {
              step: "01",
              title: "Lựa chọn",
              desc: "Tuyển chọn khắt khe nguồn hàng.",
            },
            {
              step: "02",
              title: "Kiểm định",
              desc: "Test kỹ thuật 24 bước chuẩn ISO.",
            },
            {
              step: "03",
              title: "Đóng gói",
              desc: "Quy chuẩn an toàn chống va đập.",
            },
            {
              step: "04",
              title: "Vận chuyển",
              desc: "Đội ngũ Logistics chuyên nghiệp.",
            },
            { step: "05", title: "Hậu mãi", desc: "Bảo hành 1 đổi 1 tận nơi." },
          ].map((item, i) => (
            <div key={i} className="relative text-center group bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none">
              <div className="text-4xl sm:text-6xl font-black text-slate-200 group-hover:text-rose-100 transition-colors mb-2 sm:mb-4">
                {item.step}
              </div>
              <h4 className="font-black text-slate-900 text-base sm:text-lg mb-1 sm:mb-2">
                {item.title}
              </h4>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              {i < 4 && (
                <div className="hidden md:block absolute top-10 -right-4 text-slate-200">
                  <MoveRight />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. FOUNDERS TEAM */}
      <section className="container-padded py-12 md:py-20 bg-slate-50 rounded-3xl sm:rounded-[4rem]">
        <div className="mb-12 md:mb-16 text-center">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-rose-600">
            Thành viên sáng lập
          </h2>
          <h3 className="mt-3 md:mt-4 text-3xl font-black text-slate-900 md:text-5xl italic leading-tight">
            Những người đặt nền móng
          </h3>
        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-10 max-w-4xl mx-auto">
          {[
            {
              name: "Trương Hoa",
              role: "Co-Founder & Frontend Developer",
              img: truonghoaImg,
            },
            {
              name: "Kiều Thanh",
              role: "Co-Founder & Backend Developer",
              img: nguyenthanhImg,
            },
            {
              name: "Duy Phúc",
              role: "Co-Founder & DevOps Engineer",
              img: duphucImg,
            },
          ].map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="w-[150px] sm:w-[260px] shrink-0 group relative"
            >
              <div className="overflow-hidden rounded-2xl sm:rounded-[2.5rem] shadow-lg border-2 sm:border-4 border-white transition-all group-hover:shadow-2xl">
                <img
                  src={member.img}
                  alt={member.name}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="mt-4 text-center">
                <div className="text-base sm:text-xl font-black text-slate-900 leading-tight">
                  {member.name}
                </div>
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-rose-600 mt-1">
                  {member.role}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container-padded py-12 md:py-20">
        <div className="rounded-3xl sm:rounded-[4rem] bg-rose-600 p-6 sm:p-10 md:p-16 text-white flex flex-col lg:flex-row items-center gap-10 lg:gap-16 overflow-hidden relative shadow-[0_30px_100px_rgba(225,29,72,0.3)]">
          <div className="flex-1 space-y-6 sm:space-y-8 z-10 w-full">
            <h3 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter leading-none">
              Hệ thống <br /> Trải nghiệm trực tiếp
            </h3>
            <p className="text-rose-100 text-sm sm:text-lg leading-relaxed">
              Hiện nay ND MALL đã phủ sóng hơn 40 cửa hàng trải nghiệm trên toàn
              quốc. Hãy đến và trực tiếp trải nghiệm những siêu phẩm công nghệ
              mới nhất.
            </p>
            <button className="bg-slate-950 text-white px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-black text-xs sm:text-sm hover:bg-white hover:text-rose-600 transition-colors flex items-center gap-2 justify-center w-full sm:w-auto">
              Tìm cửa hàng gần bạn <MapPin size={16} />
            </button>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-4 z-10 w-full">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400"
              className="rounded-2xl sm:rounded-3xl shadow-2xl rotate-3 w-full"
              alt="Showroom 1"
            />
            <img
              src="https://images.unsplash.com/photo-1534452203294-49c8913721b2?q=80&w=400"
              className="rounded-2xl sm:rounded-3xl shadow-2xl -rotate-3 translate-y-6 sm:translate-y-10 w-full"
              alt="Showroom 2"
            />
          </div>
          {/* Background pattern */}
          <div className="absolute top-0 right-0 h-full w-full opacity-10 pointer-events-none">
            <div className="h-full w-full bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.2)_1px,transparent_0)] bg-[length:40px_40px]"></div>
          </div>
        </div>
      </section>

      <section className="container-padded pb-12 md:pb-16">
        <div className="relative overflow-hidden rounded-3xl sm:rounded-[3.5rem] bg-slate-950 py-12 md:py-16 text-center text-white border border-slate-800">
          <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-black md:text-7xl uppercase italic leading-none">
              Cùng ND MALL <br />{" "}
              <span className="text-rose-600">Vươn xa hơn</span>
            </h2>
            <p className="mt-6 sm:mt-8 text-sm sm:text-lg text-slate-400 font-medium leading-relaxed">
              Bắt đầu hành trình mua sắm đẳng cấp cùng cộng đồng 3 triệu người
              dùng thông thái ngay hôm nay.
            </p>
            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row justify-center gap-4 px-4">
              <Link
                to="/products"
                className="rounded-full bg-rose-600 px-8 py-4 sm:px-12 sm:py-6 text-xs sm:text-sm font-black transition-all hover:bg-rose-700 hover:scale-105 hover:shadow-[0_0_50px_rgba(225,29,72,0.6)]"
              >
                Khám phá sản phẩm
              </Link>
              <button className="rounded-full bg-white/10 px-8 py-4 sm:px-12 sm:py-6 text-xs sm:text-sm font-black backdrop-blur-md hover:bg-white/20 transition-all">
                Trở thành đối tác
              </button>
            </div>
          </div>
          <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600/20 blur-[150px]"></div>
        </div>
      </section>
    </div>
  );
}
