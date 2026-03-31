import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
  Clock,
  ChevronRight,
  Gift,
  Ticket,
  Percent,
  CreditCard,
  Smartphone,
  Laptop,
  TabletSmartphone,
  Headphones,
  Watch,
  Camera,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion"; // Import Framer Motion
import SectionHeader from "@/components/common/SectionHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProductGrid from "@/components/product/ProductGrid";
import { categoryService } from "@/services/categoryService";
import productService from "@/services/productService";

// Cấu hình hiệu ứng xuất hiện chung cho các section
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: "easeOut" },
};

function HomePage() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState({
    banners: [],
    featured: [],
    latest: [],
    deals: [],
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Promise.all([
      productService.getHomeCollections(),
      categoryService.getCategories(),
    ])
      .then(([homeCollections, categoriesData]) => {
        setCollections(homeCollections);
        setCategories(categoriesData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner label="Đang tải trang chủ NovaShop..." />;
  }

  return (
    <div className="bg-[#f4f4f4] min-h-screen overflow-x-hidden">
      {/* SECTION 1: HERO & SIDEBAR */}
      <motion.section
        className="container-padded py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar Menu Cập Nhật (Trái) */}
          <aside className="hidden lg:block w-72 shrink-0 bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
            <div className="bg-rose-600 px-4 py-3">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">
                Danh mục sản phẩm
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {categories.map((cat, idx) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-rose-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400 group-hover:text-rose-600 transition-colors">
                      {cat.name.includes("Điện thoại") && (
                        <Smartphone size={18} />
                      )}
                      {cat.name.includes("Laptop") && <Laptop size={18} />}
                      {cat.name.includes("Tablet") && (
                        <TabletSmartphone size={18} />
                      )}
                      {cat.name.includes("Phụ kiện") && (
                        <Headphones size={18} />
                      )}
                      {cat.name.includes("Đồng hồ") && <Watch size={18} />}
                      {cat.name.includes("Máy ảnh") && <Camera size={18} />}
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-rose-600 transition-colors">
                      {cat.name}
                    </span>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-slate-300 group-hover:text-rose-600 group-hover:translate-x-1 transition-all"
                  />
                </Link>
              ))}
            </div>
          </aside>

          {/* Banner chính (Giữa) */}
          <div className="flex-1 space-y-4">
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg group">
              <img
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1500&q=80"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Main Banner"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-12 text-white">
                <motion.h2
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-black mb-4 leading-tight uppercase italic tracking-tighter"
                >
                  Đổi gói hội viên VIP
                </motion.h2>
                <motion.p
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl mb-6 font-bold text-yellow-300 uppercase"
                >
                  Mua sắm lời hơn X15 lần
                </motion.p>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Link
                    to="/products"
                    className="w-fit bg-rose-600 hover:bg-rose-700 px-8 py-3 rounded-full font-bold transition-all shadow-xl inline-block"
                  >
                    Tham gia ngay
                  </Link>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-40 rounded-xl overflow-hidden relative shadow-md group">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=60"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-rose-600/20" />
              </div>
              <div className="h-40 rounded-xl overflow-hidden relative shadow-md group">
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=60"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-rose-600/20" />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 2: FLASH SALE */}
      <motion.section className="container-padded py-4" {...fadeInUp}>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black italic uppercase text-rose-600 flex items-center gap-2">
                <Zap className="animate-pulse fill-rose-600" /> Deal sốc mỗi
                ngày
              </h2>
              <div className="flex gap-2 text-white">
                {["08", "51", "45"].map((time, i) => (
                  <span
                    key={i}
                    className="bg-slate-900 px-2 py-1 rounded font-bold"
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>
            <Link
              to="/products"
              className="text-sm font-bold text-rose-600 hover:underline"
            >
              Xem thêm
            </Link>
          </div>
          <ProductGrid products={collections.featured.slice(0, 5)} />
        </div>
      </motion.section>

      {/* SECTION 3: VOUCHERS BLOCK */}
      <motion.section className="container-padded py-4" {...fadeInUp}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              color: "bg-indigo-500",
              label: "Giảm 50%",
              desc: "Đơn tối thiểu 100k",
            },
            {
              color: "bg-blue-500",
              label: "Giảm 10k",
              desc: "Đơn tối thiểu 100k",
            },
            {
              color: "bg-green-500",
              label: "Freeship",
              desc: "Đơn tối thiểu 100k",
            },
            {
              color: "bg-rose-500",
              label: "Giảm 2k",
              desc: "Đơn tối thiểu 100k",
            },
            {
              color: "bg-amber-500",
              label: "Giảm 200k",
              desc: "Đơn tối thiểu 100k",
            },
          ].map((v, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={`${v.color} p-4 rounded-xl text-white shadow-md relative overflow-hidden group cursor-pointer`}
            >
              <p className="text-lg font-black">{v.label}</p>
              <p className="text-xs opacity-80">{v.desc}</p>
              <Percent
                className="absolute -right-2 -bottom-2 opacity-20 rotate-12 transition-transform group-hover:scale-125"
                size={60}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* SECTION 4: Sản Phẩm Bán Chạy */}
      <motion.section className="container-padded py-8" {...fadeInUp}>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader
            title="Sản Phẩm Bán Chạy"
            actionLink="/products"
            actionLabel="Xem thêm"
          />
          <div className="mt-6">
            <ProductGrid products={collections.latest.slice(0, 6)} />
          </div>
        </div>
      </motion.section>

      {/* SECTION 5: Sản Phẩm Mới Nhất */}
      <motion.section className="container-padded py-8" {...fadeInUp}>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader
            title="Sản Phẩm Mới Nhất"
            actionLink="/products"
            actionLabel="Xem thêm"
          />
          <div className="mt-6">
            <ProductGrid products={collections.featured.slice(2, 8)} />
          </div>
        </div>
      </motion.section>

      {/* SECTION 6: TIN TỨC & THỊ TRƯỜNG */}
      <motion.section className="container-padded py-10" {...fadeInUp}>
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-black uppercase mb-6 border-l-4 border-rose-600 pl-4">
              Thông tin thị trường
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  img: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=60",
                  title:
                    "Hàng loạt thiết bị mới của Apple cháy hàng tại Việt Nam",
                },
                {
                  img: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=60",
                  title:
                    "TV Samsung đang giảm giá mạnh, có mẫu giảm tới 15 triệu",
                },
              ].map((news, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="overflow-hidden rounded-xl mb-3">
                    <img
                      src={news.img}
                      className="w-full h-48 object-cover transition duration-500 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="font-bold text-slate-800 line-clamp-2 hover:text-rose-600 transition-colors">
                    {news.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Dữ liệu thị trường cập nhật mới nhất cho dự án...
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full xl:w-96 bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-black uppercase mb-6 border-l-4 border-rose-600 pl-4">
              Tin mới cập nhật
            </h2>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex gap-4 group cursor-pointer">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={`https://picsum.photos/200/200?random=${item}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-rose-600 transition">
                    Xu hướng mua sắm trực tuyến 2026: Trải nghiệm người dùng lên
                    ngôi
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 7: QUẢNG CÁO CUỐI TRANG */}
      <motion.section className="container-padded py-10" {...fadeInUp}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=600&q=60",
            "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=60",
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=60",
          ].map((src, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={src}
                className="rounded-2xl h-48 w-full object-cover shadow-md"
              />
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

export default HomePage;
