import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Input from "@/components/common/Input";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageHeader";
import ProductGrid from "@/components/product/ProductGrid";
import { useDebounce } from "@/hooks/useDebounce";
import productService from "@/services/productService";

function SearchResultPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [keyword, setKeyword] = useState(queryParam);
  const debouncedKeyword = useDebounce(keyword, 350);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    setKeyword(queryParam);
  }, [queryParam]);

  useEffect(() => {
    setLoading(true);
    productService
      .getProducts({
        search: debouncedKeyword,
        pageSize: 12,
      })
      .then((response) => setProducts(response.items))
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
        description="Tìm kiếm sản phẩm bằng chữ hoặc ký tự. Khu vực này dùng mock data và lọc trực tiếp trên frontend."
      />

      <form onSubmit={handleSubmit} className="mb-6 rounded-3xl border border-slate-200 bg-white p-4">
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
          <p>
            Đang hiển thị kết quả cho từ khoá:
            <span className="ml-2 font-semibold text-slate-900">"{queryParam}"</span>
          </p>
        ) : (
          <p>Nhập từ khoá để bắt đầu tìm kiếm.</p>
        )}
      </div>

      {loading ? (
        <LoadingSpinner label="Đang tìm sản phẩm..." />
      ) : (
        <ProductGrid
          products={products}
          emptyTitle="Không có sản phẩm phù hợp"
          emptyDescription="Hãy thử dùng từ khoá ngắn hơn hoặc tên thương hiệu phổ biến."
        />
      )}
    </div>
  );
}

export default SearchResultPage;
