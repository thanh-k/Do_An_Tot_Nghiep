import { SearchCode } from "lucide-react";
import { useMemo, useState } from "react";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageHeader";
import ProductGrid from "@/components/product/ProductGrid";
import ImageUploader from "@/components/search/ImageUploader";
import productService from "@/services/admin/productService";

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
      const response = await productService.imageSearch(file);
      setResult(response);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-padded space-y-8 py-8">
      <PageHeader
        title="Tìm kiếm sản phẩm bằng hình ảnh"
        description="Mock giao diện visual search: upload ảnh, preview, mô phỏng quá trình AI và hiển thị danh sách sản phẩm liên quan."
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
          Phân tích ảnh (mock)
        </Button>
        <p className="text-sm text-slate-500">
          Gợi ý: đổi tên file theo keyword như <strong>iphone.png</strong> hoặc{" "}
          <strong>laptop.jpg</strong> để xem kết quả tương ứng.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner label="Đang mô phỏng phân tích hình ảnh..." />
      ) : result.items.length ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-brand-100 bg-brand-50 p-5">
            <p className="text-sm font-medium text-brand-700">
              Hệ thống mock nhận diện ảnh thuộc nhóm:
              <span className="ml-2 text-base font-bold">{result.label}</span>
            </p>
          </div>
          <ProductGrid products={result.items} />
        </div>
      ) : (
        <div className="card p-8 text-center text-sm leading-6 text-slate-500">
          Upload ảnh và bấm "Phân tích ảnh" để xem kết quả demo.
        </div>
      )}
    </div>
  );
}

export default ImageSearchPage;
