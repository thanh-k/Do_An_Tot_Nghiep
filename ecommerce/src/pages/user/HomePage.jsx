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
  Speaker,
  Keyboard,
  Mouse,
  Monitor,
  BatteryCharging,
  Shield,
  Tv,
  Box,
  Wind,
  Fan,
  Briefcase,
  Shirt,
  Footprints,
  LayoutGrid,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeader from "@/components/common/SectionHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProductGrid from "@/components/product/ProductGrid";
import RecommendedProducts from "@/components/product/RecommendedProducts";
import { categoryService } from "@/services/admin/categoryService";
import { brandService } from "@/services/admin/brandService";
import productService from "@/services/admin/productService";
import newsService from "@/services/user/newsService";

// Cấu hình chiều rộng khung hiển thị rộng lớn chuẩn các sàn TMĐT lớn (như Shopee, Lazada)
const containerClass = "mx-auto w-full max-w-7xl xl:max-w-[1400px] px-4 sm:px-6 lg:px-8";

// Hàm tự động lấy Icon theo tên danh mục
const getCategoryIcon = (categoryName) => {
  if (!categoryName) return <LayoutGrid size={20} />;
  const name = categoryName.toLowerCase();

  if (name.includes("điện thoại")) return <Smartphone size={20} />;
  if (name.includes("macbook") || name.includes("laptop")) return <Laptop size={20} />;
  if (name.includes("máy tính bảng") || name.includes("tablet")) return <TabletSmartphone size={20} />;
  if (name.includes("đồng hồ")) return <Watch size={20} />;
  if (name.includes("tai nghe")) return <Headphones size={20} />;
  if (name.includes("loa")) return <Speaker size={20} />;
  if (name.includes("bàn phím")) return <Keyboard size={20} />;
  if (name.includes("chuột")) return <Mouse size={20} />;
  if (name.includes("màn hình")) return <Monitor size={20} />;
  if (name.includes("máy ảnh") || name.includes("camera")) return <Camera size={20} />;
  if (name.includes("sạc") || name.includes("dự phòng")) return <BatteryCharging size={20} />;
  if (name.includes("ốp lưng")) return <Shield size={20} />;
  if (name.includes("tivi") || name.includes("tv")) return <Tv size={20} />;
  if (name.includes("tủ lạnh") || name.includes("máy giặt")) return <Box size={20} />;
  if (name.includes("điều hòa")) return <Wind size={20} />;
  if (name.includes("quạt")) return <Fan size={20} />;
  if (name.includes("balo") || name.includes("túi xách")) return <Briefcase size={20} />;
  if (name.includes("quần áo")) return <Shirt size={20} />;
  if (name.includes("giày dép")) return <Footprints size={20} />;

  return <LayoutGrid size={20} />;
};

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
  const [brands, setBrands] = useState([]);
  const [news, setNews] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8 * 60); // 8 phút

  useEffect(() => {
    Promise.all([
      productService.getHomeCollections(),
      categoryService.getCategories(),
      brandService.getBrands(),
      newsService.getPosts({ page: 0, size: 6 }),
      newsService.getTrendingPosts(),
    ])
      .then(([homeCollections, categoriesData, brandsData, newsData, trendingData]) => {
        setCollections(
          homeCollections || {
            banners: [],
            featured: [],
            latest: [],
            deals: [],
          }
        );

        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setBrands(Array.isArray(brandsData) ? brandsData : []);

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

  const normalizeProductsWithReview = (products = []) => {
    return products.map((product) => {
      const firstVariant = Array.isArray(product.variants)
        ? product.variants[0]
        : null;

      return {
        ...product,
        image:
          product.thumbnail ||
          firstVariant?.images?.[0] ||
          firstVariant?.image ||
          "",
        rating: Number(product.rating || product.averageRating || 0),
        reviewCount: Number(product.reviewCount || product.totalReviews || 0),
      };
    });
  };

  const featuredProducts = useMemo(() => {
    return normalizeProductsWithReview(collections.featured || []);
  }, [collections.featured]);

  const latestProducts = useMemo(() => {
    return normalizeProductsWithReview(collections.latest || []);
  }, [collections.latest]);

  const discountedProducts = useMemo(() => {
    // Gộp sản phẩm từ tất cả danh sách có sẵn để tối đa nguồn hàng giảm giá trên trang chủ
    const merged = [
      ...(featuredProducts || []),
      ...(latestProducts || []),
      ...normalizeProductsWithReview(collections.deals || [])
    ];

    // Lọc trùng lặp sản phẩm theo ID
    const unique = [];
    const seen = new Set();
    for (const p of merged) {
      if (p && p.id && !seen.has(p.id)) {
        seen.add(p.id);
        unique.push(p);
      }
    }

    return unique
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
          image: bestVariant.images?.[0] || bestVariant.image || product.thumbnail,
          reviewCount: Number(product.reviewCount || 0),
          rating: Number(product.rating || 0),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.id - a.id) // Đảm bảo hiển thị sản phẩm giảm giá MỚI NHẤT
      .slice(0, 8); // Tăng giới hạn lên lấy tối đa 8 sản phẩm
  }, [featuredProducts, latestProducts, collections.deals]);

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

  // Logic đếm ngược 8 phút cho Deal Sốc
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 8 * 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return { m, s };
  };

  const { m, s } = formatTime(timeLeft);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + " ₫";

  if (loading) {
    return <LoadingSpinner label="Đang tải trang chủ NovaShop..." />;
  }

  return (
    <div className="bg-[#f4f4f4] min-h-screen overflow-x-hidden">
      <motion.section
        className={`${containerClass} py-6 overflow-hidden`}
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
                      {getCategoryIcon(cat.name)}
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
                          <div className="mt-4 flex items-center gap-2 min-h-[28px]">
                            <div className="flex items-center gap-0.5 text-[16px] leading-none">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const roundedRating = Math.round(Number(highlightProduct?.rating || 0));

                                return (
                                  <span
                                    key={star}
                                    className={star <= roundedRating ? "text-amber-400" : "text-slate-300"}
                                  >
                                    ★
                                  </span>
                                );
                              })}
                            </div>

                            <span className="text-slate-500 text-sm font-medium">
                              {Number(highlightProduct?.rating || 0).toFixed(1)} (
                              {Number(highlightProduct?.reviewCount || 0)} đánh giá)
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

      <motion.section className={`${containerClass} py-8`} {...fadeInUp}>
        <RecommendedProducts
          title="Gợi ý dành riêng cho bạn"
          description="Dựa trên sản phẩm bạn đã xem, tìm kiếm, thêm vào giỏ hàng hoặc bỏ dở thanh toán."
          limit={8}
        />
      </motion.section>

      <motion.section className={`${containerClass} py-4`} {...fadeInUp}>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-rose-600 via-pink-500 to-amber-500 p-6 sm:p-8 shadow-[0_20px_50px_rgba(225,29,72,0.35)] border border-white/20">
          
          {/* Lớp phủ sáng tạo chiều sâu (Abstract Background glow) */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-yellow-400/20 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-rose-400/20 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-wrap items-center justify-between mb-8 gap-4 border-b border-white/10 pb-6">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white flex items-center gap-2 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                <Zap className="text-yellow-300 fill-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.8)] animate-bounce" size={28} />
                Deal sốc mỗi ngày
              </h2>

              {/* Countdown Timer Luxury Glassmorphism */}
              <div className="flex items-center gap-2 bg-black/35 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/15 shadow-inner">
                <span className="text-[10px] sm:text-xs text-rose-200 font-bold uppercase tracking-wider">Hết hạn sau</span>
                <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-base sm:text-lg text-yellow-300 font-black">
                  <span className="bg-white/10 px-2 py-0.5 rounded-lg border border-white/5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">00</span>
                  <span className="animate-pulse text-white/70">:</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded-lg border border-white/5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">{m}</span>
                  <span className="animate-pulse text-white/70">:</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded-lg border border-white/5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">{s}</span>
                </div>
              </div>
            </div>

            <Link
              to="/products?sort=sale"
              className="text-xs sm:text-sm font-black uppercase tracking-wider text-white bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/10 hover:bg-white hover:text-rose-600 hover:shadow-lg transition-all duration-300"
            >
              Xem tất cả &gt;
            </Link>
          </div>

          <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-[2rem] p-5 sm:p-8 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_10px_40px_rgba(0,0,0,0.06)] border border-white/40">
            <ProductGrid products={discountedProducts.length > 0 ? discountedProducts.slice(0, 8) : featuredProducts.slice(0, 8)} />
            
            {discountedProducts.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Link
                  to="/products?sort=sale"
                  className="relative overflow-hidden inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all duration-300 hover:from-rose-600 hover:to-orange-600 hover:shadow-[0_10px_25px_rgba(244,63,94,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  Xem thêm sản phẩm giảm giá
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section className={`${containerClass} py-4`} {...fadeInUp}>
        <div className="space-y-10 my-4">
          {/* DANH MỤC - 1 DÒNG SCROLL NGANG */}
          <div>
            <div className="flex items-center justify-between mb-5 px-2">
              <h3 className="text-xl font-black italic uppercase text-slate-900 ">
               🔥 Khám Phá Danh Mục
              </h3>
              <Link to="/products" className="text-sm font-bold text-rose-600 hover:underline">
                Xem tất cả &gt;
              </Link>
            </div>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2">
              {categories.slice(0, 20).map((cat) => (
                <Link key={cat.id} to={`/products?category=${cat.id}`} className="group flex flex-col items-center gap-2 snap-start min-w-[85px] sm:min-w-[110px]">
                  <div className="flex h-[85px] w-full sm:h-[110px] items-center justify-center rounded-[1.25rem] sm:rounded-[1.5rem] bg-white shadow-sm border border-slate-100 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-rose-300 overflow-hidden relative">
                    <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {cat.icon ? (
                      <img src={cat.icon} alt={cat.name} className="h-full w-full object-cover p-2.5 sm:p-3 relative z-10 transition-transform duration-300 group-hover:scale-110 mix-blend-multiply" />
                    ) : (
                      <div className="text-slate-400 group-hover:text-rose-600 transition-colors relative z-10">
                        {getCategoryIcon(cat.name)}
                      </div>
                    )}
                  </div>
                  <span className="text-center text-[11px] sm:text-xs font-bold text-slate-700 line-clamp-2 leading-tight px-1 group-hover:text-rose-600 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* THƯƠNG HIỆU - 1 DÒNG SCROLL NGANG */}
          {brands.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5 px-2">
                <h3 className="text-xl font-black italic uppercase text-slate-900 ">
                  🌟 Thương Hiệu Nổi Bật
                </h3>
              </div>
              <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2">
                {brands.slice(0, 20).map((brand) => (
                  <Link key={brand.id} to={`/products?brands=${brand.name}`} className="group flex flex-col items-center justify-center snap-start min-w-[110px] sm:min-w-[150px]">
                    <div className="flex h-16 sm:h-20 w-full px-4 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-blue-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} className="max-h-10 sm:max-h-12 max-w-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 mix-blend-multiply" />
                      ) : (
                        <span className="text-xs font-black uppercase text-slate-400 group-hover:text-blue-600 relative z-10 transition-colors">{brand.name}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.section>

      <motion.section className={`${containerClass} py-8`} {...fadeInUp}>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader
            title="Sản Phẩm Bán Chạy"
            actionLink="/products"
            actionLabel="Xem thêm"
          />
          <div className="mt-6">
            <ProductGrid products={latestProducts.slice(0, 8)} />
          </div>
        </div>
      </motion.section>

      <motion.section className={`${containerClass} py-8`} {...fadeInUp}>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader
            title="Sản Phẩm Mới Nhất"
            actionLink="/products"
            actionLabel="Xem thêm"
          />
          <div className="mt-6">
            <ProductGrid products={featuredProducts.slice(0, 8)} />
          </div>
        </div>
      </motion.section>

      <motion.section className={`${containerClass} py-10`} {...fadeInUp}>
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

      <motion.section className={`${containerClass} py-10`} {...fadeInUp}>
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