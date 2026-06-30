import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageHeader";
import ProductGrid from "@/components/product/ProductGrid";
import ProductVideoSection from "@/components/productVideo/ProductVideoSection";
import userProductService from "@/services/user/productService";
import behaviorService from "@/services/user/behaviorService";
import productVideoService from "@/services/productVideo/productVideoService";

function SearchResultPage() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState({ items: [], total: 0 });
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    if (!queryParam) {
      setResponse({ items: [], total: 0 });
      setVideos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      userProductService.searchProducts(queryParam, 1, 12),
      productVideoService.searchVideos(queryParam, 6).catch(() => []),
    ])
      .then(([data, videoData]) => {
        setResponse(data);
        setVideos(Array.isArray(videoData) ? videoData : []);
        if (queryParam?.trim()) {
          behaviorService.track({
            eventType: "SEARCH_PRODUCT",
            keyword: queryParam.trim(),
            productIds: (data.items || []).slice(0, 8).map((item) => item.id),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [queryParam]);

  const handleVideoProductClick = (video) => {
    productVideoService.trackProductClick(video.id).catch(() => {});
  };

  const handleVideoView = (video) => {
    productVideoService.trackView(video.id, 0).catch(() => {});
  };

  return (
    <div className="container-padded py-8">
      <PageHeader
        title="Kết quả tìm kiếm"
        description="Kết quả được trả về từ hệ thống tìm kiếm thông minh của chúng tôi."
      />

      <div className="mb-6 text-sm text-slate-500">
        {queryParam ? (
          <p className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">"{queryParam}"</span>
            - Tìm thấy {response.total} sản phẩm.
          </p>
        ) : (
          <p>Nhập từ khoá để bắt đầu tìm kiếm.</p>
        )}
      </div>

      {loading ? (
        <LoadingSpinner label="Đang tìm sản phẩm..." />
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-2xl font-black text-slate-950">
              Sản phẩm phù hợp
            </h2>
            <ProductGrid
              products={response.items}
              emptyTitle="Không có sản phẩm phù hợp"
              emptyDescription="Hãy thử dùng từ khoá ngắn hơn hoặc tên thương hiệu phổ biến."
            />
          </section>

          <ProductVideoSection
            title="Video mô tả sản phẩm liên quan"
            description="Các video ngắn giúp bạn xem nhanh thiết kế, tính năng và trải nghiệm thực tế của sản phẩm."
            videos={videos}
            autoPlayFirst
            onProductClick={handleVideoProductClick}
            onView={handleVideoView}
          />
        </div>
      )}
    </div>
  );
}

export default SearchResultPage;
