import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { categoryService } from "@/services/admin/categoryService";
import { brandService } from "@/services/admin/brandService";
import productService from "@/services/admin/productService";
import newsService from "@/services/user/newsService";
import HomeHeroSection from "@/components/home/HomeHeroSection";
import HomeLivestreamSection from "@/components/home/HomeLivestreamSection";
import HomeHighlightProduct from "@/components/home/HomeHighlightProduct";
import HomeRecommendationsSection from "@/components/home/HomeRecommendationsSection";
import HomeCategoriesBrandsSection from "@/components/home/HomeCategoriesBrandsSection";
import HomeProductSection from "@/components/home/HomeProductSection";
import HomeDealSection from "@/components/home/HomeDealSection";
import HomeNewsSection from "@/components/home/HomeNewsSection";
import HomeBottomBanners from "@/components/home/HomeBottomBanners";
import { normalizeProductsWithReview } from "@/components/home/homeUtils";

const EMPTY_COLLECTIONS = {
  banners: [],
  featured: [],
  latest: [],
  deals: [],
};

function HomePage() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState(EMPTY_COLLECTIONS);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [news, setNews] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8 * 60);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      productService.getHomeCollections(),
      categoryService.getCategories(),
      brandService.getBrands(),
      newsService.getPosts({ page: 0, size: 12 }),
    ])
      .then(([homeCollections, categoriesData, brandsData, newsData]) => {
        if (!mounted) return;

        setCollections(homeCollections || EMPTY_COLLECTIONS);
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
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const featuredProducts = useMemo(
    () => normalizeProductsWithReview(collections.featured || []),
    [collections.featured],
  );

  const latestProducts = useMemo(
    () => normalizeProductsWithReview(collections.latest || []),
    [collections.latest],
  );

  const discountedProducts = useMemo(() => {
    const merged = [
      ...(featuredProducts || []),
      ...(latestProducts || []),
      ...normalizeProductsWithReview(collections.deals || []),
    ];

    const unique = [];
    const seen = new Set();
    for (const product of merged) {
      if (product?.id && !seen.has(product.id)) {
        seen.add(product.id);
        unique.push(product);
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
            const discountA = Number(a.compareAtPrice || 0) - Number(a.price || 0);
            const discountB = Number(b.compareAtPrice || 0) - Number(b.price || 0);
            return discountB - discountA;
          })[0];

        if (!bestVariant) return null;

        const original = Number(bestVariant.compareAtPrice || 0);
        const sale = Number(bestVariant.price || 0);
        const discountPercent = original > 0 ? Math.round(((original - sale) / original) * 100) : 0;

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
  }, [collections.deals, featuredProducts, latestProducts]);

  const highlightProduct =
    discountedProducts.length > 0
      ? discountedProducts[highlightIndex % discountedProducts.length]
      : null;

  useEffect(() => {
    if (discountedProducts.length <= 1) return undefined;

    const interval = setInterval(() => {
      setHighlightIndex((prev) => (prev + 1) % discountedProducts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [discountedProducts.length]);


  // Đếm ngược 8 phút cho khối Deal sốc mỗi ngày, giữ đúng giao diện Home cũ.
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 8 * 60 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainSeconds = (seconds % 60).toString().padStart(2, "0");
    return { minutes, seconds: remainSeconds };
  };

  const { minutes, seconds } = formatTime(timeLeft);

  if (loading) {
    return <LoadingSpinner label="Đang tải trang chủ InsightShop..." />;
  }

  const bestSellerProducts = latestProducts.length > 0 ? latestProducts : featuredProducts;
  const newestProducts = featuredProducts.length > 0 ? featuredProducts : latestProducts;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f4f4f4]">
      <div className="block w-full max-w-full overflow-x-hidden clear-layout-wrapper">
        <HomeHeroSection categories={categories} />
        <HomeLivestreamSection />
        <HomeHighlightProduct product={highlightProduct} />
        <HomeRecommendationsSection />
        <HomeDealSection products={discountedProducts} fallbackProducts={featuredProducts} minutes={minutes} seconds={seconds} />
        <HomeCategoriesBrandsSection categories={categories} brands={brands} />
        <HomeProductSection title="Sản Phẩm Bán Chạy" products={bestSellerProducts} />
        <HomeProductSection title="Sản Phẩm Mới Nhất" products={newestProducts} />
        <HomeNewsSection news={news} latestNews={latestNews} />
        <HomeBottomBanners />
      </div>
    </div>
  );
}

export default HomePage;
