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
import { useDebounce } from "@/hooks/useDebounce";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/utils/permission";

function BrandManagementPage() {
  const { currentUser } = useAuth();
  const canCreate = hasPermission(currentUser, "BRAND_CREATE");
  const canUpdate = hasPermission(currentUser, "BRAND_UPDATE");
  const canDelete = hasPermission(currentUser, "BRAND_DELETE");
  const canManage = canCreate || canUpdate || canDelete;
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]); // Thêm state để lưu danh sách sản phẩm
  const [keyword, setKeyword] = useState("");
  const [modalState, setModalState] = useState({ open: false, brand: null });
  const [lastEditedId, setLastEditedId] = useState(null); // State lưu ID brand vừa sửa
  const debouncedKeyword = useDebounce(keyword, 300); // Thêm debounce cho ô tìm kiếm
  const [selectedIds, setSelectedIds] = useState([]);

  // --- LOGIC PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const loadData = async () => {
    setLoading(true);
    try {
      // Gọi song song API lấy thương hiệu và toàn bộ sản phẩm để đếm số lượng
      const [brandsData, productsData] = await Promise.all([
        brandService.getBrands(),
        productService.getAllProducts(),
      ]);
      setBrands(brandsData);
      setProducts(productsData || []);
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
    const search = debouncedKeyword.trim().toLowerCase();
    let result = [...brands];

    if (search) {
      result = result.filter((b) => b.name.toLowerCase().includes(search));
    }

    // Sắp xếp mặc định: Mới nhất lên đầu (Dựa vào ID)
    result.sort((a, b) => b.id - a.id);

    // Ép brand vừa sửa lên đầu
    if (lastEditedId && lastEditedId !== "NEW") {
      const editedIndex = result.findIndex((b) => b.id === lastEditedId);
      if (editedIndex > 0) {
        const [editedItem] = result.splice(editedIndex, 1);
        result.unshift(editedItem);
      }
    }

    return result;
  }, [brands, debouncedKeyword, lastEditedId]);

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
  }, [debouncedKeyword]);

  const visibleIds = paginatedBrands.map((b) => b.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Cấu hình cột hiển thị chuẩn như Category
  const columns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={toggleSelectAll}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleOne(row.id)}
        />
      ),
    },
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
      render: (row) => {
        const count = products.filter(
          (p) => p.brandId === row.id || p.brand?.id === row.id,
        ).length;
        return <span className="font-semibold text-brand-700">{count}</span>;
      },
    },
    {
      key: "actions",
      title: "Thao tác",
      align: "right",
      render: (row) =>
        canManage ? (
          <div className="flex justify-end gap-2">
            {canUpdate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModalState({ open: true, brand: row })}
              >
                <Pencil size={14} />
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(row)}
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ) : null,
    },
  ];

  const runBulkDelete = async () => {
    if (!selectedIds.length) return;
    const confirmed = window.confirm(
      `Xóa ${selectedIds.length} thương hiệu đã chọn?`,
    );
    if (!confirmed) return;

    let successCount = 0;
    for (const brandId of selectedIds) {
      try {
        await brandService.deleteBrand(brandId);
        successCount++;
      } catch (error) {
        const brandToDelete = brands.find((b) => b.id === brandId);
        const serverError =
          error.response?.data?.message ||
          `Xóa thương hiệu "${brandToDelete?.name || "ID: " + brandId}" thất bại.`;
        toast.error(serverError, { duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast.success(`Đã xóa thành công ${successCount} thương hiệu.`);
    }
    setSelectedIds([]);
    loadData();
  };

  const handleDelete = async (brand) => {
    if (!canDelete) return;
    if (!window.confirm(`Xoá thương hiệu "${brand.name}"?`)) return;
    try {
      await brandService.deleteBrand(brand.id);
      toast.success("Đã xoá thành công");
      loadData();
    } catch (error) {
      const serverError =
        error.response?.data?.message || "Lỗi khi xóa thương hiệu.";
      toast.error(serverError, { duration: 5000 });
    }
  };

  const handleSave = async (payload) => {
    if ((payload.id && !canUpdate) || (!payload.id && !canCreate)) return;
    try {
      await brandService.saveBrand(payload);
      toast.success(
        payload.id ? "Cập nhật thành công" : "Thêm mới thành công!",
      );

      // Lưu lại ID vừa sửa. Nếu thêm mới thì set 'NEW'
      if (payload.id) {
        setLastEditedId(payload.id);
      } else {
        setLastEditedId("NEW");
      }
      setCurrentPage(1); // Ép về trang 1 để xem brand vừa thêm/sửa

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
          canCreate ? (
            <Button onClick={() => setModalState({ open: true, brand: null })}>
              <Plus size={16} /> Thêm Brand
            </Button>
          ) : null
        }
      />

      <div className="card p-4">
        <Input
          placeholder="Tìm kiếm thương hiệu theo tên hoặc slug..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        {selectedIds.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-600">
              Đã chọn {selectedIds.length} thương hiệu
            </span>
            <Button size="sm" variant="danger" onClick={runBulkDelete}>
              <Trash2 size={14} /> Xóa đã chọn
            </Button>
          </div>
        )}
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
      {canManage && (
        <BrandFormModal
          isOpen={modalState.open}
          onClose={() => setModalState({ open: false, brand: null })}
          initialBrand={modalState.brand}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}

export default BrandManagementPage;
