import { useEffect, useMemo, useState } from "react";
import {
  Zap,
  ChevronRight,
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
import SectionHeader from "@/components/common/SectionHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProductGrid from "@/components/product/ProductGrid";
import RecommendedProducts from "@/components/product/RecommendedProducts";
import { categoryService } from "@/services/admin/categoryService";
import { brandService } from "@/services/admin/brandService";
import productService from "@/services/admin/productService";
import newsService from "@/services/user/newsService";

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
  const [latestNews, setLatestNews] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8 * 60); // 8 phút

  useEffect(() => {
    Promise.all([
      productService.getHomeCollections(),
      categoryService.getCategories(),
      brandService.getBrands(),
      newsService.getPosts({ page: 0, size: 12 }),
    ])
      .then(([homeCollections, categoriesData, brandsData, newsData]) => {
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

        const sortedNews = [...posts].sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        setNews(sortedNews);
        setLatestNews(sortedNews);
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
    return (featuredProducts || [])
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
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 8);
  }, [featuredProducts]);

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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f4f4f4]">
        {/* Khối bọc layout chống tràn tầng sâu */}
        <div className="block w-full max-w-full overflow-x-hidden clear-layout-wrapper">
        
        {/* SECTION BANNER TOP - LOCKED LAYOUT */}
        <section className="mx-auto w-full max-w-[1260px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-stretch">
            {/* Sidebar Danh Mục */}
            <aside className="hidden h-[430px] min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm xl:block">
              <div className="bg-rose-600 px-4 py-3.5">
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Danh mục sản phẩm
                </h2>
              </div>

              <div className="divide-y divide-slate-100">
                {categories.slice(0, 8).map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.id}`}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="shrink-0 text-slate-400">
                        {getCategoryIcon(cat.name)}
                      </div>

                      <span className="truncate text-sm font-semibold text-slate-700">
                        {cat.name}
                      </span>
                    </div>

                    <ChevronRight size={14} className="shrink-0 text-slate-300" />
                  </Link>
                ))}
              </div>
            </aside>

            {/* Khối Banner Giữa */}
            <div className="grid h-[430px] min-w-0 grid-rows-[290px_124px] gap-4 overflow-hidden">
              <Link
                to="/membership"
                className="relative min-w-0 overflow-hidden rounded-[26px] shadow-sm"
              >
                <img
                  src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1400&q=80"
                  alt="banner-hoi-vien"
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent" />

                <div className="relative z-10 flex h-full flex-col justify-center px-7 py-7 text-white sm:px-9">
                  <p className="mb-3 inline-flex w-fit rounded-full bg-white/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-rose-200 ring-1 ring-white/20">
                    Gói thành viên ưu đãi
                  </p>

                  <h2 className="max-w-[420px] text-3xl font-black italic uppercase leading-tight tracking-tight xl:text-[38px]">
                    Đổi gói hội viên VIP
                  </h2>

                  <p className="mt-3 text-lg font-black uppercase text-yellow-300 xl:text-xl">
                    Mua sắm lời hơn X15 lần
                  </p>

                  <span className="mt-5 w-fit rounded-full bg-rose-600 px-7 py-3 text-sm font-black uppercase tracking-wider text-white">
                    Tham gia ngay
                  </span>
                </div>
              </Link>

              <div className="grid min-w-0 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[1.2fr_1fr]">
                <Link
                  to="/vouchers"
                  className="relative min-h-0 overflow-hidden rounded-[20px] shadow-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500" />
                  <div className="relative z-10 flex h-full flex-col justify-center px-6 py-5 text-white">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
                      Nova exclusive
                    </p>
                    <h3 className="mt-2 text-lg font-black uppercase">
                      Freeship toàn quốc
                    </h3>
                    <p className="mt-1.5 text-sm text-white/85">
                      Áp dụng cho mọi hình thức thanh toán
                    </p>
                  </div>
                </Link>

                <Link
                  to="/vouchers"
                  className="relative min-h-0 overflow-hidden rounded-[20px] shadow-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-indigo-950" />
                  <div className="relative z-10 flex h-full flex-col justify-center px-6 py-5 text-white">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
                      Ưu đãi nhanh
                    </p>
                    <h3 className="mt-2 text-lg font-black uppercase">
                      Nhận mã hoạt động tốt
                    </h3>
                    <p className="mt-1.5 text-sm text-white/80">
                      Số lượng có hạn mỗi ngày
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION THANH QUẢNG CÁO DƯỚI BANNER */}
        <section className="mx-auto w-full max-w-[1260px] px-4 pb-3 sm:px-6 lg:px-8">
          <Link
            to="/products?sort=sale"
            className="relative block overflow-hidden rounded-[18px] border border-rose-100 bg-white shadow-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-50 via-white to-orange-50" />
            <div className="relative flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-rose-600">
                  Thanh quảng cáo
                </p>
                <h3 className="mt-1 text-xl font-black uppercase text-slate-900">
                  Săn deal công nghệ hôm nay
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Tổng hợp sản phẩm giảm giá, voucher và ưu đãi thành viên đang diễn ra.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-full bg-rose-600 px-5 py-2 text-sm font-black text-white">
                Xem ưu đãi
                <ChevronRight size={16} />
              </div>
            </div>
          </Link>
        </section>

        {/* SECTION SẢN PHẨM NỔI BẬT */}
        {highlightProduct && (
          <section className="container-padded py-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-black uppercase text-rose-600">
                  Sản phẩm nổi bật
                </h2>
                <Link
                  to="/products?sort=sale"
                  className="text-sm font-bold text-rose-600 transition hover:text-slate-900"
                >
                  Xem thêm
                </Link>
              </div>

              <Link
                to={`/products/${highlightProduct.slug || highlightProduct.id}`}
                className="grid gap-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[260px_minmax(0,1fr)] md:items-center"
              >
                <div className="flex h-[180px] items-center justify-center overflow-hidden rounded-2xl bg-white p-4 md:h-[200px]">
                  <img
                    src={highlightProduct.image || highlightProduct.thumbnail}
                    alt={highlightProduct.name}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Deal nổi bật hôm nay
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-tight text-slate-900">
                    {highlightProduct.name}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold italic text-slate-400 line-through">
                      {formatCurrency(highlightProduct.original)}
                    </p>
                    <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white">
                      -{highlightProduct.discountPercent}%
                    </span>
                  </div>

                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {formatCurrency(highlightProduct.sale)}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span className="text-amber-400">★★★★★</span>
                    <span>
                      {Number(highlightProduct?.rating || 0).toFixed(1)} (
                      {Number(highlightProduct?.reviewCount || 0)} đánh giá)
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* SECTION GỢI Ý SẢN PHẨM */}
        <section className="container-padded py-8">
          <RecommendedProducts
            title="Gợi ý dành riêng cho bạn"
            description="Dựa trên sản phẩm bạn đã xem, tìm kiếm, thêm vào giỏ hàng hoặc bỏ dở thanh toán."
            limit={8}
          />
        </section>

        {/* SECTION DEAL SỐC */}
        <section className="container-padded py-4">
          <div className="bg-gradient-to-r from-rose-400 to-orange-400 rounded-2xl p-5 sm:p-6 shadow-lg border border-rose-100">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-black italic uppercase text-white flex items-center gap-2">
                  <Zap className="animate-pulse text-yellow-300 fill-yellow-300" /> Deal sốc mỗi ngày
                </h2>

                <div className="flex gap-1 sm:gap-2 text-white font-mono text-sm sm:text-lg">
                  <span className="bg-slate-900 px-2 py-1 rounded-lg font-bold shadow-inner text-center min-w-[28px]">00</span>
                  <span className="font-bold py-1 text-yellow-300">:</span>
                  <span className="bg-slate-900 px-2 py-1 rounded-lg font-bold shadow-inner text-center min-w-[28px]">{m}</span>
                  <span className="font-bold py-1 text-yellow-300">:</span>
                  <span className="bg-slate-900 px-2 py-1 rounded-lg font-bold shadow-inner text-center min-w-[28px]">{s}</span>
                </div>
              </div>

              <Link
                to="/products?sort=sale"
                className="text-sm font-bold text-white hover:text-yellow-300 hover:underline transition-colors"
              >
                Xem tất cả &gt;
              </Link>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-[1.5rem] p-4 sm:p-6 shadow-inner">
              <ProductGrid
                products={
                  discountedProducts.length > 0
                    ? discountedProducts.slice(0, 8)
                    : featuredProducts.slice(0, 8)
                }
              />
            </div>
          </div>
        </section>

        {/* SECTION KHÁM PHÁ DANH MỤC & THƯƠNG HIỆU */}
        <section className="container-padded py-4">
          <div className="space-y-10 my-4">
            {/* DANH MỤC - SCROLL NGANG */}
            <div>
              <div className="flex items-center justify-between mb-5 px-2">
                <h3 className="text-xl font-black italic uppercase text-slate-900 ">
                 🔥 Khám Phá Danh Mục
                </h3>
                <Link to="/products" className="text-sm font-bold text-rose-600 hover:underline">
                  Xem tất cả &gt;
                </Link>
              </div>
              <div className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2">
                {categories.slice(0, 20).map((cat) => (
                  <Link key={cat.id} to={`/products?category=${cat.id}`} className="group flex flex-col items-center gap-2 snap-start min-w-[85px] sm:min-w-[110px]">
                    <div className="flex h-[85px] w-full sm:h-[110px] items-center justify-center rounded-[1.25rem] sm:rounded-[1.5rem] bg-white shadow-sm border border-slate-100 transition duration-300 group-hover:shadow-md group-hover:border-rose-300 overflow-hidden relative">
                      <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {cat.icon ? (
                        <img src={cat.icon} alt={cat.name} className="h-full w-full object-cover p-2.5 sm:p-3 relative z-10 transition-transform duration-300 mix-blend-multiply" />
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

            {/* THƯƠNG HIỆU - SCROLL NGANG */}
            {brands.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5 px-2">
                  <h3 className="text-xl font-black italic uppercase text-slate-900 ">
                    🌟 Thương Hiệu Nổi Bật
                  </h3>
                </div>
                <div className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2">
                  {brands.slice(0, 20).map((brand) => (
                    <Link key={brand.id} to={`/products?brands=${brand.name}`} className="group flex flex-col items-center justify-center snap-start min-w-[110px] sm:min-w-[150px]">
                      <div className="flex h-16 sm:h-20 w-full px-4 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 transition duration-300 group-hover:shadow-md group-hover:border-blue-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        {brand.logo ? (
                          <img src={brand.logo} alt={brand.name} className="max-h-10 sm:max-h-12 max-w-full object-contain relative z-10 transition-transform duration-300 mix-blend-multiply" />
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
        </section>

        {/* SECTION SẢN PHẨM BÁN CHẠY */}
        <section className="container-padded py-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <SectionHeader
              title="Sản Phẩm Bán Chạy"
              actionLink="/products"
              actionLabel="Xem thêm"
            />
            <div className="mt-6">
              <ProductGrid
                products={
                  latestProducts.length > 0
                    ? latestProducts.slice(0, 8)
                    : featuredProducts.slice(0, 8)
                }
              />
            </div>
          </div>
        </section>

        {/* SECTION SẢN PHẨM MỚI NHẤT */}
        <section className="container-padded py-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <SectionHeader
              title="Sản Phẩm Mới Nhất"
              actionLink="/products"
              actionLabel="Xem thêm"
            />
            <div className="mt-6">
              <ProductGrid
                products={
                  featuredProducts.length > 0
                    ? featuredProducts.slice(0, 8)
                    : latestProducts.slice(0, 8)
                }
              />
            </div>
          </div>
        </section>

        {/* SECTION TIN TỨC THỊ TRƯỜNG */}
        <section className="container-padded py-10">
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
                          className="w-full h-48 object-cover transition duration-500"
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

              {latestNews.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có bài viết mới.</p>
              ) : (
                <div className="space-y-4">
                  {latestNews.slice(0, 4).map((item) => (
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
                          className="w-full h-full object-cover transition-transform duration-500"
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
        </section>

        {/* SECTION BANNER FOOTER */}
        <section className="container-padded py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=600&q=60",
              "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=60",
              "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=60",
            ].map((src, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl"
              >
                <img
                  src={src}
                  className="rounded-2xl h-48 w-full object-cover shadow-md"
                  alt={`banner-${i}`}
                />
              </div>
            ))}
          </div>
        </section>

        </div> {/* Kết thúc khối bọc chống tràn */}
      </div>
    );
  }

export default HomePage;