import { useEffect, useMemo, useState } from "react";
import {
  Zap,
  ChevronRight,
  Percent,
  Smartphone,
  Laptop,
  TabletSmartphone,
  Headphones,
  Watch,
  Camera,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeader from "@/components/common/SectionHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProductGrid from "@/components/product/ProductGrid";
import { categoryService } from "@/services/admin/categoryService";
import productService from "@/services/admin/productService";
import newsService from "@/services/newsService";

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
  const [news, setNews] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(0);

  useEffect(() => {
    Promise.all([
      productService.getHomeCollections(),
      categoryService.getCategories(),
      newsService.getPosts({ page: 0, size: 6 }),
      newsService.getTrendingPosts(),
    ])
      .then(([homeCollections, categoriesData, newsData, trendingData]) => {
        setCollections(
          homeCollections || {
            banners: [],
            featured: [],
            latest: [],
            deals: [],
          },
        );

        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

        const posts = Array.isArray(newsData?.content)
          ? newsData.content
          : Array.isArray(newsData)
            ? newsData
            : [];

        setNews(posts);
        setTrendingNews(Array.isArray(trendingData) ? trendingData : []);
      })
      .catch((err) => {
        console.error("Lỗi load trang chủ:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const discountedProducts = useMemo(() => {
    return (collections.featured || [])
      .map((product) => {
        const bestVariant = (product.variants || [])
          .filter((variant) => {
            const original = Number(variant.compareAtPrice || 0);
            const sale = Number(variant.price || 0);
            return original > sale;
          })
          .sort((a, b) => {
            const discountA =
              Number(a.compareAtPrice || 0) - Number(a.price || 0);
            const discountB =
              Number(b.compareAtPrice || 0) - Number(b.price || 0);
            return discountB - discountA;
          })[0];

        if (!bestVariant) return null;

        const original = Number(bestVariant.compareAtPrice || 0);
        const sale = Number(bestVariant.price || 0);
        const discountPercent =
          original > 0 ? Math.round(((original - sale) / original) * 100) : 0;

        return {
          ...product,
          original,
          sale,
          discountPercent,
          image: bestVariant.images?.[0] || product.thumbnail,
          reviewCount: product.reviewCount || 0,
          rating: product.rating || 4.8,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 5);
  }, [collections.featured]);

  const highlightProduct =
    discountedProducts.length > 0
      ? discountedProducts[highlightIndex % discountedProducts.length]
      : null;

  useEffect(() => {
    if (discountedProducts.length <= 1) return;

    const interval = setInterval(() => {
      setHighlightIndex((prev) => (prev + 1) % discountedProducts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [discountedProducts.length]);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + " ₫";

  if (loading) {
    return <LoadingSpinner label="Đang tải trang chủ NovaShop..." />;
  }

  return (
    <div className="bg-[#f4f4f4] min-h-screen overflow-x-hidden">
      <motion.section
        className="container-padded py-6 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[230px_minmax(0,1fr)_330px] gap-4 items-stretch overflow-hidden">
          <aside className="bg-white rounded-[22px] shadow-md overflow-hidden border border-slate-200 min-w-0">
            <div className="bg-rose-600 px-4 py-4">
              <h2 className="text-white font-black text-sm uppercase tracking-wider">
                Danh mục sản phẩm
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="flex items-center justify-between px-4 py-4 hover:bg-rose-50 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-slate-400 group-hover:text-rose-600 transition-colors shrink-0">
                      {cat.name?.includes("Điện thoại") && <Smartphone size={18} />}
                      {cat.name?.includes("Laptop") && <Laptop size={18} />}
                      {cat.name?.includes("Tablet") && (
                        <TabletSmartphone size={18} />
                      )}
                      {cat.name?.includes("Phụ kiện") && (
                        <Headphones size={18} />
                      )}
                      {cat.name?.includes("Đồng hồ") && <Watch size={18} />}
                      {cat.name?.includes("Máy ảnh") && <Camera size={18} />}
                    </div>

                    <span className="text-sm font-semibold text-slate-700 group-hover:text-rose-600 transition-colors truncate">
                      {cat.name}
                    </span>
                  </div>

                  <ChevronRight
                    size={14}
                    className="text-slate-300 group-hover:text-rose-600 group-hover:translate-x-1 transition-all shrink-0"
                  />
                </Link>
              ))}
            </div>
          </aside>

          <div className="grid grid-rows-[1fr_auto] gap-4 min-w-0">
            <div className="relative min-h-[360px] rounded-[28px] overflow-hidden shadow-lg group">
              <img
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1400&q=80"
                alt="banner-hoi-vien"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent" />

              <div className="relative z-10 h-full flex flex-col justify-center px-10 py-10 text-white">
                <p className="mb-4 inline-flex w-fit rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-rose-200 ring-1 ring-white/20">
                  Gói thành viên ưu đãi
                </p>

                <h2 className="text-4xl xl:text-5xl font-black italic uppercase leading-tight tracking-tight max-w-[420px]">
                  Đổi gói hội viên VIP
                </h2>

                <p className="mt-4 text-yellow-300 text-2xl font-black uppercase">
                  Mua sắm lời hơn X15 lần
                </p>

                <Link
                  to="/membership"
                  className="mt-8 w-fit rounded-full bg-rose-600 px-8 py-4 text-sm font-black uppercase tracking-wider text-white transition-all duration-300 hover:bg-yellow-400 hover:text-slate-950 hover:shadow-[0_12px_30px_rgba(250,204,21,0.35)]"
                >
                  Tham gia ngay
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-4 min-w-0">
              <Link
                to="/vouchers"
                className="group relative min-h-[132px] rounded-[22px] overflow-hidden shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500 transition-all duration-300 group-hover:from-rose-500 group-hover:to-orange-400" />
                <div className="relative z-10 h-full flex flex-col justify-center px-8 py-6 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/80">
                    Nova exclusive
                  </p>
                  <h3 className="mt-2 text-2xl font-black uppercase">
                    Freeship toàn quốc
                  </h3>
                  <p className="mt-2 text-sm text-white/85">
                    Áp dụng cho mọi hình thức thanh toán
                  </p>
                </div>
              </Link>

              <Link
                to="/vouchers"
                className="group relative min-h-[132px] rounded-[22px] overflow-hidden shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-indigo-950 transition-all duration-300 group-hover:from-rose-600 group-hover:to-pink-500" />
                <div className="relative z-10 h-full flex flex-col justify-center px-8 py-6 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/80">
                    Ưu đãi nhanh
                  </p>
                  <h3 className="mt-2 text-xl font-black uppercase">
                    Nhận mã hoạt động tốt
                  </h3>
                  <p className="mt-2 text-sm text-white/80">
                    Số lượng có hạn mỗi ngày
                  </p>
                </div>
              </Link>
            </div>
          </div>

          <div className="min-w-0">
            <div className="bg-white rounded-[28px] border border-slate-300 shadow-[0_12px_30px_rgba(15,23,42,0.12)] p-4 h-[520px] flex flex-col overflow-hidden">
              {highlightProduct ? (
                <Link
                  to={`/products/${highlightProduct.slug || highlightProduct.id}`}
                  className="group flex h-full flex-col"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={highlightProduct.id}
                      initial={{ opacity: 0.45, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0.45, scale: 0.98 }}
                      transition={{ duration: 0.35 }}
                      className="flex h-full flex-col"
                    >
                      <div className="rounded-[22px] border border-slate-300 bg-slate-50 h-[230px] overflow-hidden flex items-center justify-center p-4">
                        <img
                          src={highlightProduct.image || highlightProduct.thumbnail}
                          alt={highlightProduct.name}
                          className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      <div className="px-2 pt-4 flex-1 flex flex-col justify-between min-h-0">
                        <div>
                          <h3 className="text-[28px] leading-tight font-black text-slate-900 mb-3 line-clamp-2 min-h-[68px]">
                            {highlightProduct.name}
                          </h3>

                          <p className="text-xl italic line-through text-slate-500 font-medium min-h-[32px]">
                            {formatCurrency(highlightProduct.original)}
                          </p>

                          <div className="mt-1 flex items-end gap-3 flex-wrap min-h-[64px]">
                            <p className="text-[34px] leading-none font-black text-slate-900">
                              {formatCurrency(highlightProduct.sale)}
                            </p>

                            <span className="rounded-full bg-rose-600 px-3 py-1 text-sm font-black text-white shadow-sm">
                              -{highlightProduct.discountPercent}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="mt-4 flex items-center gap-2 text-amber-400 min-h-[28px]">
                            <span className="text-lg">★ ★ ★ ★ ★</span>
                            <span className="text-slate-500 text-sm font-semibold">
                              {highlightProduct.rating} ({highlightProduct.reviewCount} đánh giá)
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </Link>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-semibold">
                  Chưa có sản phẩm giảm giá
                </div>
              )}

              {discountedProducts.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {discountedProducts.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHighlightIndex(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        idx === highlightIndex ? "w-8 bg-rose-600" : "w-2.5 bg-rose-200"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section className="container-padded py-4" {...fadeInUp}>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black italic uppercase text-rose-600 flex items-center gap-2">
                <Zap className="animate-pulse fill-rose-600" /> Deal sốc mỗi ngày
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

          <ProductGrid products={collections.featured?.slice(0, 5) || []} />
        </div>
      </motion.section>

      <motion.section className="container-padded py-4" {...fadeInUp}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { color: "bg-indigo-500", label: "Giảm 50%", desc: "Đơn tối thiểu 100k" },
            { color: "bg-blue-500", label: "Giảm 10k", desc: "Đơn tối thiểu 100k" },
            { color: "bg-green-500", label: "Freeship", desc: "Đơn tối thiểu 100k" },
            { color: "bg-rose-500", label: "Giảm 2k", desc: "Đơn tối thiểu 100k" },
            { color: "bg-amber-500", label: "Giảm 200k", desc: "Đơn tối thiểu 100k" },
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

      <motion.section className="container-padded py-8" {...fadeInUp}>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader
            title="Sản Phẩm Bán Chạy"
            actionLink="/products"
            actionLabel="Xem thêm"
          />
          <div className="mt-6">
            <ProductGrid products={collections.latest?.slice(0, 6) || []} />
          </div>
        </div>
      </motion.section>

      <motion.section className="container-padded py-8" {...fadeInUp}>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader
            title="Sản Phẩm Mới Nhất"
            actionLink="/products"
            actionLabel="Xem thêm"
          />
          <div className="mt-6">
            <ProductGrid products={collections.featured?.slice(2, 8) || []} />
          </div>
        </div>
      </motion.section>

      <motion.section className="container-padded py-10" {...fadeInUp}>
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase border-l-4 border-rose-600 pl-4">
                Thông tin thị trường
              </h2>

              <Link
                to="/news"
                className="text-sm font-bold text-rose-600 hover:underline"
              >
                Xem tất cả
              </Link>
            </div>

            {news.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có bài viết nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {news.slice(0, 2).map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.slug}`}
                    className="group cursor-pointer"
                  >
                    <div className="overflow-hidden rounded-xl mb-3">
                      <img
                        src={
                          item.thumbnail ||
                          "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=60"
                        }
                        alt={item.title}
                        className="w-full h-48 object-cover transition duration-500 group-hover:scale-110"
                      />
                    </div>

                    <h3 className="font-bold text-slate-800 line-clamp-2 hover:text-rose-600 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {item.summary || "Bài viết đang được cập nhật nội dung..."}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="w-full xl:w-96 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase border-l-4 border-rose-600 pl-4">
                Tin mới cập nhật
              </h2>

              <Link
                to="/news"
                className="text-sm font-bold text-rose-600 hover:underline"
              >
                Xem thêm
              </Link>
            </div>

            {trendingNews.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có bài viết nổi bật.</p>
            ) : (
              <div className="space-y-4">
                {trendingNews.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.slug}`}
                    className="flex gap-4 group cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={
                          item.thumbnail ||
                          "https://picsum.photos/200/200?random=1"
                        }
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110"
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-rose-600 transition">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {item.summary || "Bài viết đang được cập nhật nội dung..."}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.section>

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
                alt={`banner-${i}`}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

export default HomePage;