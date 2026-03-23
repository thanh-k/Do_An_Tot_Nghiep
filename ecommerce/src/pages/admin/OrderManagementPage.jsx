import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import DataTable from "@/components/admin/DataTable";
import PageHeader from "@/components/common/PageHeader";
import orderService from "@/services/orderService";
import { ORDER_STATUS_OPTIONS } from "@/constants";
import {
  formatCurrency,
  formatDate,
  formatOrderStatus,
  formatPaymentStatus,
} from "@/utils/format";

function OrderManagementPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

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

  const filteredOrders = useMemo(
    () =>
      statusFilter ? orders.filter((order) => order.status === statusFilter) : orders,
    [orders, statusFilter]
  );

  const columns = [
    {
      key: "id",
      title: "Đơn hàng",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.id}</p>
          <p className="text-xs text-slate-500">{formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "customer",
      title: "Khách hàng",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">
            {row.shippingAddress?.fullName || row.user?.name}
          </p>
          <p className="text-xs text-slate-500">{row.shippingAddress?.phone}</p>
        </div>
      ),
    },
    {
      key: "items",
      title: "Sản phẩm",
      render: (row) => (
        <div className="space-y-1">
          {row.items.slice(0, 2).map((item) => (
            <p key={`${row.id}-${item.variantId}`} className="text-sm">
              {item.name} × {item.quantity}
            </p>
          ))}
          {row.items.length > 2 ? (
            <p className="text-xs text-slate-500">+ {row.items.length - 2} sản phẩm khác</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (row) => (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {formatOrderStatus(row.status)}
          </p>
          <select
            value={row.status}
            onChange={async (event) => {
              await orderService.updateOrderStatus(row.id, event.target.value);
              toast.success("Cập nhật trạng thái đơn hàng thành công");
              loadData();
            }}
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
      key: "payment",
      title: "Thanh toán",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.paymentMethod.toUpperCase()}</p>
          <p className="text-xs text-emerald-700">{formatPaymentStatus(row.paymentStatus)}</p>
        </div>
      ),
    },
    {
      key: "total",
      title: "Tổng tiền",
      align: "right",
      render: (row) => <span className="font-semibold">{formatCurrency(row.total)}</span>,
    },
  ];

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

      {loading ? <div className="card p-8 text-center text-sm text-slate-500">Đang tải đơn hàng...</div> : <DataTable columns={columns} data={filteredOrders} />}
    </div>
  );
}

export default OrderManagementPage;
