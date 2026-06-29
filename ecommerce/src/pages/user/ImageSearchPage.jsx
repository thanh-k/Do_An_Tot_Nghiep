import { SearchCode, Trash2, Camera } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageHeader";
import ProductGrid from "@/components/product/ProductGrid";
import ImageUploader from "@/components/search/ImageUploader";
import userProductService from "@/services/user/productService";
import EmptyState from "@/components/common/EmptyState";

function ImageSearchPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState({ label: "", items: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file],
  );

  const handleChange = (nextFile) => {
    if (!nextFile) return;
    setFile(nextFile);
    setResult({ label: "", items: [] });
    setSearched(false);
  };

  const handleSearch = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const response = await userProductService.imageSearch(file);
      setResult(response);
      setSearched(true);

      if (!response?.items || response.items.length === 0) {
        toast.error(
          "Không tìm thấy sản phẩm tương thích với hình ảnh. Vui lòng chọn hình ảnh khác!",
        );
      } else {
        toast.success(`Tìm thấy ${response.items.length} sản phẩm tương tự!`);
      }
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

      {previewUrl && !isCameraOpen && (
        <div className="card overflow-hidden rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-56 w-full lg:w-[240px] rounded-2xl object-cover shadow-sm border border-slate-200"
            />
            <div className="space-y-3 flex flex-col justify-center">
              <h4 className="text-lg font-semibold text-slate-900">
                Ảnh đã chọn: {file?.name || "Ảnh chụp từ Camera"}
              </h4>
              <p className="text-sm leading-6 text-slate-500">
                Hệ thống sẽ tiến hành trích xuất đặc trưng hình ảnh và tìm kiếm
                các sản phẩm tương đồng trong cơ sở dữ liệu.
              </p>
              <div className="flex items-center gap-4 mt-2">
                <button
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                  onClick={() => {
                    setFile(null);
                    setResult({ label: "", items: [] });
                    setSearched(false);
                    setIsCameraOpen(false);
                  }}
                >
                  <Trash2 size={12} />
                  Xoá ảnh
                </button>
                <button
                  className="inline-flex lg:hidden items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
                  onClick={() => {
                    setIsCameraOpen(true);
                  }}
                >
                  <Camera size={12} />
                  Đổi ảnh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCameraOpen && (
        <div className="w-full">
          <ImageUploader
            file={file}
            previewUrl={previewUrl}
            isCameraOpen={isCameraOpen}
            setIsCameraOpen={setIsCameraOpen}
            onChange={handleChange}
            onClear={() => {
              setFile(null);
              setResult({ label: "", items: [] });
              setSearched(false);
              setIsCameraOpen(false);
            }}
          />
        </div>
      )}

      {!isCameraOpen && !(file && (loading || searched)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Cột 1: Nút Phân tích và mô tả */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-3 p-2">
            <Button
              size="md"
              onClick={handleSearch}
              disabled={!file || loading}
              className="w-full sm:w-auto"
            >
              <SearchCode size={16} />
              Phân tích hình ảnh AI
            </Button>
            <p className="text-xs text-slate-500 max-w-sm">
              Hệ thống AI sẽ tự động phân tích và đưa ra các gợi ý chính xác
              nhất.
            </p>
          </div>
          {/* Cột 2: Khu vực Upload ảnh */}
          <div className={file ? "hidden lg:block" : "w-full"}>
            <ImageUploader
              file={file}
              previewUrl={previewUrl}
              isCameraOpen={isCameraOpen}
              setIsCameraOpen={setIsCameraOpen}
              onChange={handleChange}
              onClear={() => {
                setFile(null);
                setResult({ label: "", items: [] });
                setSearched(false);
                setIsCameraOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="AI đang quét và phân tích hình ảnh của bạn..." />
      ) : result.items.length > 0 ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-brand-100 bg-brand-50 p-5">
            <p className="text-sm font-medium text-brand-700">
              Kết quả nhận diện từ hệ thống AI:
              <span className="ml-2 text-base font-bold">{result.label}</span>
            </p>
          </div>
          <ProductGrid products={result.items} />
        </div>
      ) : searched ? (
        <EmptyState
          title="Không tìm thấy sản phẩm"
          description="Không tìm thấy sản phẩm tương thích với hình ảnh của bạn trong hệ thống. Vui lòng đổi hình ảnh sản phẩm khác để tìm kiếm tiếp hoặc chọn sản phẩm khác."
        />
      ) : (
        <div className="card p-8 text-center text-sm leading-6 text-slate-500">
          Tải ảnh lên và bấm "Phân tích hình ảnh AI" để bắt đầu tìm kiếm.
        </div>
      )}
    </div>
  );
}

export default ImageSearchPage;
