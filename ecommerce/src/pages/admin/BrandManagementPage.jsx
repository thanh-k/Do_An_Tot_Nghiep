import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import BrandFormModal from "@/components/admin/BrandFormModal";
import DataTable from "@/components/admin/DataTable";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import { brandService } from "@/services/admin/brandService";
// Ní nhớ import thêm productService nếu muốn đếm số sản phẩm tham chiếu
import productService from "@/services/admin/productService";
import Pagination from "@/components/common/Pagination";

function BrandManagementPage() {
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]); // Thêm state để lưu danh sách sản phẩm
  const [keyword, setKeyword] = useState("");
  const [modalState, setModalState] = useState({ open: false, brand: null });

  // --- LOGIC PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await brandService.getBrands();
      setBrands(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Lọc theo từ khóa trước
  const filteredBrands = useMemo(() => {
    return brands.filter((b) =>
      b.name.toLowerCase().includes(keyword.toLowerCase()),
    );
  }, [brands, keyword]);

  // 2. Tính toán dữ liệu hiển thị cho trang hiện tại
  const paginatedBrands = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBrands.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBrands, currentPage]);

  // 3. Tính tổng số trang
  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);

  // Reset về trang 1 khi tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);
  // Cấu hình cột hiển thị chuẩn như Category
  const columns = [
    {
      key: "name",
      title: "Thương hiệu",
      render: (row) => (
        <div className="flex gap-3 ">
          {/* Hiển thị ảnh to và rõ như category */}
          <img
            src={row.logo}
            alt={row.name}
            className="h-14 w-14 rounded-xl object-cover"
          />
          <div>
            <p className="font-semibold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      title: "Mô tả",
      render: (row) => (
        <p className="line-clamp-2 max-w-xs text-sm text-slate-600">
          {row.description || "Chưa có mô tả"}
        </p>
      ),
    },
    {
      key: "products",
      title: "Số sản phẩm",
      render: (row) => (
        <span className="font-semibold text-brand-700">
          {products.filter((p) => p.brandId === row.id).length}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalState({ open: true, brand: row })}
          >
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const handleDelete = async (row) => {
    if (!window.confirm(`Xoá thương hiệu "${row.name}"?`)) return;
    try {
      await brandService.deleteBrand(row.id);
      toast.success("Đã xoá thành công");
      loadData();
    } catch (e) {
      toast.error("Không thể xoá thương hiệu này");
    }
  };

  const handleSave = async (payload) => {
    try {
      await brandService.saveBrand(payload);
      toast.success(
        payload.id ? "Cập nhật thành công" : "Thêm mới thành công!",
      );
      setModalState({ open: false, brand: null });
      loadData();
    } catch (e) {
      // Axios sẽ để dữ liệu Backend trả về trong e.response.data
      const serverError = e.response?.data?.message || "Lỗi không xác định";
      toast.error(serverError); // Bây giờ nó sẽ hiện "Tên danh mục này đã tồn tại!" thay vì lỗi 500
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Thương hiệu"
        description="Quản lý các hãng sản xuất, đối tác cung cấp sản phẩm cho hệ thống."
        actions={
          <Button onClick={() => setModalState({ open: true, brand: null })}>
            <Plus size={16} /> Thêm Brand
          </Button>
        }
      />

      <div className="card p-4">
        <Input
          placeholder="Tìm kiếm thương hiệu theo tên hoặc slug..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="card p-10 text-center text-slate-500">
          Đang tải dữ liệu thương hiệu...
        </div>
      ) : (
        <>
          {/* Truyền paginatedBrands (đã cắt 7 cái) vào Table */}
          <DataTable columns={columns} data={paginatedBrands} />

          {/* Gọi Component phân trang */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}
      <BrandFormModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, brand: null })}
        initialBrand={modalState.brand}
        onSubmit={handleSave}
      />
    </div>
  );
}

export default BrandManagementPage;
