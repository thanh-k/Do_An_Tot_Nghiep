import { SearchCode } from "lucide-react";
import { useMemo, useState } from "react";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageHeader";
import ProductGrid from "@/components/product/ProductGrid";
import ImageUploader from "@/components/search/ImageUploader";
import userProductService from "@/services/user/productService";
import toast from "react-hot-toast";

function ImageSearchPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState({ label: "", items: [] });
  const [loading, setLoading] = useState(false);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file],
  );

  const handleChange = (nextFile) => {
    if (!nextFile) return;
    setFile(nextFile);
  };

  const handleSearch = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const response = await userProductService.imageSearch(file);
      setResult(response);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tìm kiếm bằng hình ảnh!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-padded space-y-8 py-8">
      <PageHeader
        title="Tìm kiếm sản phẩm bằng hình ảnh"
        description="Tải lên hoặc chụp ảnh sản phẩm bạn muốn tìm. Trí tuệ nhân tạo (AI) sẽ phân tích và tìm ra sản phẩm giống nhất trong hệ thống."
      />

      <ImageUploader
        file={file}
        previewUrl={previewUrl}
        onChange={handleChange}
        onClear={() => {
          setFile(null);
          setResult({ label: "", items: [] });
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSearch} disabled={!file || loading}>
          <SearchCode size={18} />
          Phân tích hình ảnh AI
        </Button>
        <p className="text-sm text-slate-500">
          Hệ thống AI sẽ tự động phân tích và đưa ra các gợi ý chính xác nhất.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner label="AI đang quét và phân tích hình ảnh của bạn..." />
      ) : result.items.length ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-brand-100 bg-brand-50 p-5">
            <p className="text-sm font-medium text-brand-700">
              Kết quả nhận diện từ hệ thống AI:
              <span className="ml-2 text-base font-bold">{result.label}</span>
            </p>
          </div>
          <ProductGrid products={result.items} />
        </div>
      ) : (
        <div className="card p-8 text-center text-sm leading-6 text-slate-500">
          Tải ảnh lên và bấm "Phân tích hình ảnh AI" để bắt đầu tìm kiếm.
        </div>
      )}
    </div>
  );
}

export default ImageSearchPage;
