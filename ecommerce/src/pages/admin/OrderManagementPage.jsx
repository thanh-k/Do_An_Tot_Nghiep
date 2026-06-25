import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Eye } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import PageHeader from "@/components/common/PageHeader";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Pagination from "@/components/common/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import OrderFormModal from "@/components/admin/OrderFormModal";
import orderService from "@/services/user/orderService";
import { ORDER_STATUS_OPTIONS } from "@/constants";
import {
  formatCurrency,
  formatDate,
  formatOrderStatus,
  formatPaymentStatus,
  getPaymentStatusColor,
  formatOrderCode,
} from "@/utils/format";

// Helper function để lấy class màu sắc cho trạng thái đơn hàng
const getStatusColorClass = (status) => {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-700";
    case "PROCESSING":
      return "bg-indigo-100 text-indigo-700";
    case "SHIPPED":
      return "bg-purple-100 text-purple-700";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

function OrderManagementPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [modalState, setModalState] = useState({ open: false, order: null });
  const [lastEditedId, setLastEditedId] = useState(null);

  const debouncedKeyword = useDebounce(keyword, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const loadData = () => {
    setLoading(true);
    orderService
      .getAllOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword, statusFilter]);

  const filteredOrders = useMemo(() => {
    const search = debouncedKeyword.trim().toLowerCase();
    let result = [...orders];

    // 1. Lọc theo trạng thái và từ khóa
    result = result.filter((order) => {
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      const matchesSearch =
        !search ||
        [
          order.id,
          formatOrderCode(order),
          typeof order.shippingAddress === "string"
            ? order.shippingAddress
            : order.shippingAddress?.address,
          order.phoneNumber,
          ...(order.details || []).map((item) => item.name),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);

      return matchesStatus && matchesSearch;
    });

    // 2. Sắp xếp mặc định: Đơn hàng mới nhất lên đầu
    result.sort((a, b) => b.id - a.id);

    // 3. Đưa đơn hàng vừa sửa lên đầu
    if (lastEditedId) {
      const editedIndex = result.findIndex((o) => o.id === lastEditedId);
      if (editedIndex > 0) {
        const [editedItem] = result.splice(editedIndex, 1);
        result.unshift(editedItem);
      }
    }

    return result;
  }, [orders, statusFilter, debouncedKeyword, lastEditedId]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const columns = [
    {
      key: "id",
      title: "Đơn hàng",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{formatOrderCode(row)}</p>
          <p className="text-xs text-slate-500">
            {row.createdAt ? formatDate(row.createdAt) : "Đang cập nhật"}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      title: "Khách hàng",
      render: (row) => {
        // Xử lý an toàn tránh lỗi Object khi render dữ liệu cũ/mock
        const addressStr =
          typeof row.shippingAddress === "string"
            ? row.shippingAddress
            : row.shippingAddress?.address
              ? `${row.shippingAddress.address}, ${row.shippingAddress.city}`
              : "Chưa cập nhật địa chỉ";

        return (
          <div>
            <p className="font-semibold text-slate-900">
              {row.phoneNumber || row.shippingAddress?.phone || "Không có SĐT"}
            </p>
            <p
              className="text-xs text-slate-500 line-clamp-1 max-w-[200px]"
              title={addressStr}
            >
              {addressStr}
            </p>
          </div>
        );
      },
    },
    {
      key: "details",
      title: "Sản phẩm",
      render: (row) => (
        <div className="space-y-1">
          {(row.details || []).slice(0, 2).map((item) => (
            <p key={item.id} className="text-sm">
              {item.name} × {item.quantity}
            </p>
          ))}
          {(row.details || []).length > 2 ? (
            <p className="text-xs text-slate-500">
              + {(row.details || []).length - 2} sản phẩm khác
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (row) => (
        <div className="space-y-2 min-w-[120px]">
          <p
            className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full text-center ${getStatusColorClass(row.status)}`}
          >
            {formatOrderStatus(row.status)}
          </p>
          <select
            value={row.status}
            onChange={(event) => handleUpdateStatus(row.id, event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {ORDER_STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    {
      key: "paymentStatus",
      title: "Thanh toán",
      render: (row) => (
        <div className="min-w-[120px]">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide"
            style={{
              backgroundColor: `${getPaymentStatusColor(row.paymentStatus || (row.status === "PAID" ? "PAID" : "UNPAID"))}18`,
              color: getPaymentStatusColor(row.paymentStatus || (row.status === "PAID" ? "PAID" : "UNPAID")),
            }}
          >
            {formatPaymentStatus(row.paymentStatus || (row.status === "PAID" ? "PAID" : "UNPAID"))}
          </span>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            {row.paymentMethod || "COD"}
          </p>
        </div>
      ),
    },
    {
      key: "total",
      title: "Tổng tiền",
      align: "right",
      render: (row) => (
        <span className="font-semibold text-brand-700">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      align: "right",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setModalState({ open: true, order: row })}
        >
          <Eye size={14} className="mr-1" /> Chi tiết
        </Button>
      ),
    },
  ];

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await orderService.updateOrderStatus(id, newStatus);
      toast.success("Cập nhật trạng thái đơn hàng thành công");
      setLastEditedId(id);
      setCurrentPage(1); // Ép về trang 1 để xem ngay đơn hàng vừa sửa
      setModalState({ open: false, order: null });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    }
  };

  const handleDelete = async (order) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa đơn hàng #${order.id} không? Hành động này không thể hoàn tác.`,
      )
    )
      return;
    try {
      await orderService.deleteOrder(order.id);
      toast.success("Xóa đơn hàng thành công");
      setModalState({ open: false, order: null });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa đơn hàng");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý đơn hàng"
        description="Theo dõi đơn hàng, cập nhật trạng thái giao nhận và mô phỏng nghiệp vụ quản lý vận hành."
        actions={
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {ORDER_STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        }
      />

      <div className="card p-4">
        <Input
          placeholder="Tìm theo mã đơn, tên khách, số điện thoại hoặc tên sản phẩm..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          Đang tải đơn hàng...
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={paginatedOrders} />
          {filteredOrders.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          )}
        </>
      )}

      <OrderFormModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, order: null })}
        order={modalState.order}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default OrderManagementPage;
