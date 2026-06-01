import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import VoucherFormModal from "@/components/admin/VoucherFormModal";
import DataTable from "@/components/admin/DataTable";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import { voucherService } from "@/services/admin/voucherService";
import Pagination from "@/components/common/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency, formatDate } from "@/utils/format";

// Định nghĩa cấu hình hiển thị Badge cho từng loại
const CATEGORY_MAP = {
  DISCOUNT: {
    label: "Giảm giá",
    style: "bg-rose-100 text-rose-700 border-rose-200",
  },
  SHIPPING: {
    label: "Vận chuyển",
    style: "bg-blue-100 text-blue-700 border-blue-200",
  },
  CASHBACK: {
    label: "Hoàn xu",
    style: "bg-amber-100 text-amber-700 border-amber-200",
  },
  VIP: {
    label: "Đặc quyền VIP",
    style: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  },
  COIN_REWARD: {
    label: "Đổi bằng xu",
    style: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

const getCategoryConfig = (category) =>
  CATEGORY_MAP[category || "DISCOUNT"] || {
    label: category || "Giảm giá",
    style: "bg-slate-100 text-slate-700 border-slate-200",
  };

function VoucherManagementPage() {
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(""); // Thêm state cho bộ lọc
  const debouncedKeyword = useDebounce(keyword, 300);
  const [modalState, setModalState] = useState({ open: false, voucher: null });
  const [lastEditedId, setLastEditedId] = useState(null); // State lưu ID voucher vừa sửa

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await voucherService.getVouchers();
      setVouchers(data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách Voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredVouchers = useMemo(() => {
    const search = debouncedKeyword.trim().toLowerCase();

    let result = vouchers.filter((v) => {
      const matchesSearch = !search || v.code.toLowerCase().includes(search);
      // Mặc định những voucher cũ chưa có category sẽ coi là DISCOUNT
      const currentCategory = v.category || "DISCOUNT";
      const matchesCategory =
        !categoryFilter || currentCategory === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    // Sắp xếp mặc định: Mới nhất lên đầu (Dựa vào ID)
    result.sort((a, b) => b.id - a.id);

    // Ép voucher vừa sửa lên đầu
    if (lastEditedId && lastEditedId !== "NEW") {
      const editedIndex = result.findIndex((v) => v.id === lastEditedId);
      if (editedIndex > 0) {
        const [editedItem] = result.splice(editedIndex, 1);
        result.unshift(editedItem);
      }
    }

    return result;
  }, [vouchers, debouncedKeyword, categoryFilter, lastEditedId]);

  const paginatedVouchers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVouchers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVouchers, currentPage]);

  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword, categoryFilter]);

  const columns = [
    {
      key: "code",
      title: "Voucher",
      render: (row) => {
        const cat = getCategoryConfig(row.category);
        return (
          <div className="flex gap-3 items-center">
            {row.image ? (
              <img
                src={row.image}
                alt={row.code}
                className="h-10 w-10 rounded-lg object-cover bg-slate-100 border border-slate-200"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg">
                %
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-brand-700">{row.code}</p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${cat.style}`}
                >
                  {cat.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {row.active ? (
                  <span className="text-emerald-600 font-medium">
                    Đang kích hoạt
                  </span>
                ) : (
                  <span className="text-rose-600 font-medium">Đã tắt</span>
                )}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "discount",
      title: "Mức giảm",
      render: (row) => (
        <span className="font-bold text-slate-900">
          {row.discountType === "PERCENT"
            ? `${row.discountValue}%`
            : formatCurrency(row.discountValue)}
        </span>
      ),
    },
    {
      key: "condition",
      title: "Điều kiện",
      render: (row) => (
        <div className="text-sm">
          <p>
            Đơn tối thiểu:{" "}
            <span className="font-medium text-slate-900">
              {formatCurrency(row.minOrderValue)}
            </span>
          </p>
          <p>
            Số lượng còn:{" "}
            <span className="font-medium text-brand-600">{row.quantity}</span>{" "}
            vé
          </p>
          {row.category === "COIN_REWARD" ? (
            <p>
              Giá đổi:{" "}
              <span className="font-medium text-emerald-600">
                {Number(row.coinCost || 0).toLocaleString("vi-VN")} xu
              </span>
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "expiry",
      title: "Hạn sử dụng",
      render: (row) => (
        <span className="text-sm text-slate-600 font-medium">
          {formatDate(row.expiryDate)}
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
            onClick={() => setModalState({ open: true, voucher: row })}
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
    if (!window.confirm(`Xoá voucher "${row.code}"?`)) return;
    try {
      await voucherService.deleteVoucher(row.id);
      toast.success("Đã xoá voucher thành công");
      loadData();
    } catch (e) {
      toast.error("Không thể xoá voucher này");
    }
  };

  const handleSave = async (payload) => {
    try {
      await voucherService.saveVoucher(payload);
      toast.success(
        payload.id
          ? "Cập nhật voucher thành công"
          : "Thêm mới voucher thành công!",
      );

      // Lưu lại ID vừa sửa. Nếu thêm mới thì set 'NEW'
      if (payload.id) {
        setLastEditedId(payload.id);
      } else {
        setLastEditedId("NEW");
      }
      setCurrentPage(1); // Ép về trang 1 để xem voucher vừa thêm/sửa

      setModalState({ open: false, voucher: null });
      loadData();
    } catch (e) {
      const serverError =
        e.response?.data?.message || "Lỗi không xác định khi lưu voucher";
      toast.error(serverError);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Voucher"
        description="Thiết lập mã giảm giá, mức giảm, điều kiện và hạn sử dụng cho khách hàng."
        actions={
          <Button onClick={() => setModalState({ open: true, voucher: null })}>
            <Plus size={16} /> Tạo Voucher
          </Button>
        }
      />
      <div className="card p-4 grid gap-4 md:grid-cols-[1fr_250px]">
        <Input
          placeholder="Tìm kiếm theo mã voucher (code)..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">Tất cả phân loại</option>
          <option value="DISCOUNT">Giảm giá đơn hàng</option>
          <option value="SHIPPING">Miễn phí vận chuyển</option>
          <option value="CASHBACK">Hoàn xu / Điểm</option>
          <option value="VIP">Đặc quyền VIP (reset hàng tháng)</option>
          <option value="COIN_REWARD">Đổi voucher bằng xu</option>
        </select>
      </div>
      {loading ? (
        <div className="card p-10 text-center text-slate-500">
          Đang tải dữ liệu voucher...
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={paginatedVouchers} />
          {filteredVouchers.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </>
      )}
      <VoucherFormModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, voucher: null })}
        initialVoucher={modalState.voucher}
        onSubmit={handleSave}
      />
    </div>
  );
}

export default VoucherManagementPage;
