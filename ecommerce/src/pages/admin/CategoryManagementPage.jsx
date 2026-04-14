import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import CategoryFormModal from "@/components/admin/CategoryFormModal";
import DataTable from "@/components/admin/DataTable";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import { categoryService } from "@/services/admin/categoryService";
import productService from "@/services/productService";
import { useDebounce } from "@/hooks/useDebounce";

import Pagination from "@/components/common/Pagination";

function CategoryManagementPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 300);
  const [modalState, setModalState] = useState({
    open: false,
    category: null,
  });

  // --- 1. THÊM STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // Giới hạn 7 danh mục mỗi trang theo ý ní

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- 2. LOGIC XỬ LÝ DỮ LIỆU ---

  // Lọc theo từ khóa tìm kiếm
  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(keyword.toLowerCase()),
    );
  }, [categories, keyword]);

  // Chia nhỏ dữ liệu để hiển thị đúng trang hiện tại (7 cái)
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCategories, currentPage]);

  // Tính tổng số trang dựa trên kết quả đã lọc
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  // Reset về trang 1 mỗi khi gõ tìm kiếm để tránh lỗi hiển thị trang trống
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

  const columns = [
    {
      key: "name",
      title: "Category",
      render: (row) => (
        <div className="flex gap-3">
          {/* Sửa row.image thành row.icon để khớp Backend */}
          <img
            src={row.icon}
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
        <p className="line-clamp-2 max-w-xl text-sm">{row.description}</p>
      ),
    },
    {
      key: "products",
      title: "Số sản phẩm",
      render: (row) => (
        <span className="font-semibold text-brand-700">
          {/* Nếu ní chưa có API Product thật thì tạm thời để 0 hoặc filter list cũ */}
          {products
            ? products.filter((p) => p.categoryId === row.id).length
            : 0}
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
            variant="outline"
            size="sm"
            onClick={() => setModalState({ open: true, category: row })}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              const confirmed = window.confirm(`Xoá category "${row.name}"?`);
              if (!confirmed) return;
              try {
                await categoryService.deleteCategory(row.id);
                toast.success("Đã xoá category");
                loadData();
              } catch (error) {
                toast.error(error.message);
              }
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const handleSave = async (payload) => {
    try {
      await categoryService.saveCategory(payload);
      toast.success(
        payload.id ? "Cập nhật thành công" : "Thêm mới thành công!",
      );
      setModalState({ open: false, category: null });
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
        title="Quản lý category"
        description="Quản lý nhóm sản phẩm để điều hướng menu, filter và hiển thị nội dung theo từng danh mục."
        actions={
          <Button onClick={() => setModalState({ open: true, category: null })}>
            <Plus size={16} />
            Thêm category
          </Button>
        }
      />

      <div className="card p-4">
        <Input
          placeholder="Tìm category..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          Đang tải dữ liệu...
        </div>
      ) : (
        <>
          {/* TRUYỀN paginatedCategories VÀO DATA TABLE (Thay vì truyền filteredCategories) */}
          <DataTable columns={columns} data={paginatedCategories} />

          {/* --- 3. GỌI COMPONENT PHÂN TRANG --- */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}

      <CategoryFormModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, category: null })}
        initialCategory={modalState.category}
        onSubmit={handleSave}
      />
    </div>
  );
}

export default CategoryManagementPage;
