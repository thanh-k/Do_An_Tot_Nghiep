import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Input from "@/components/common/Input";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageHeader";
import ProductGrid from "@/components/product/ProductGrid";
import { useDebounce } from "@/hooks/useDebounce";
import userProductService from "@/services/user/productService";
import behaviorService from "@/services/user/behaviorService";

function SearchResultPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [keyword, setKeyword] = useState(queryParam);
  const debouncedKeyword = useDebounce(keyword, 350);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState({ items: [], total: 0 });

  useEffect(() => {
    setKeyword(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (!debouncedKeyword) {
      setResponse({ items: [], total: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    userProductService
      .searchProducts(debouncedKeyword, 1, 12)
      .then((data) => {
        setResponse(data);
        if (debouncedKeyword?.trim()) {
          behaviorService.track({
            eventType: "SEARCH_PRODUCT",
            keyword: debouncedKeyword.trim(),
            productIds: (data.items || []).slice(0, 8).map((item) => item.id),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [debouncedKeyword]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSearchParams(keyword.trim() ? { q: keyword.trim() } : {});
  };

  return (
    <div className="container-padded py-8">
      <PageHeader
        title="Kết quả tìm kiếm"
        description="Kết quả được trả về từ hệ thống tìm kiếm thông minh của chúng tôi."
      />

      <form
        onSubmit={handleSubmit}
        className="mb-6 rounded-3xl border border-slate-200 bg-white p-4"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Ví dụ: iphone, macbook, samsung..."
            leftIcon={<Search size={18} />}
          />
          <button className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white">
            Tìm kiếm
          </button>
        </div>
      </form>

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
        <ProductGrid
          products={response.items}
          emptyTitle="Không có sản phẩm phù hợp"
          emptyDescription="Hãy thử dùng từ khoá ngắn hơn hoặc tên thương hiệu phổ biến."
        />
      )}
    </div>
  );
}

export default SearchResultPage;
