import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import useAuth from "@/hooks/useAuth";
import orderService from "@/services/orderService";
import {
  formatCurrency,
  formatDate,
  formatOrderStatus,
  formatPaymentStatus,
} from "@/utils/format";

function OrderHistoryPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    orderService
      .getOrdersByUser(currentUser.id)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container-padded py-8">
      <PageHeader
        title="Lịch sử đơn hàng"
        description="Theo dõi các đơn hàng đã đặt, trạng thái xử lý và thông tin thanh toán."
      />

      {loading ? (
        <LoadingSpinner label="Đang tải đơn hàng..." />
      ) : !orders.length ? (
        <EmptyState
          title="Bạn chưa có đơn hàng nào"
          description="Sau khi checkout, đơn hàng mock sẽ xuất hiện tại đây."
        />
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <article key={order.id} className="card p-6">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Mã đơn hàng</p>
                  <h2 className="text-xl font-bold text-slate-900">{order.id}</h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <p className="text-slate-500">Ngày đặt</p>
                    <p className="font-semibold text-slate-900">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <p className="text-slate-500">Trạng thái</p>
                    <p className="font-semibold text-brand-700">
                      {formatOrderStatus(order.status)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <p className="text-slate-500">Thanh toán</p>
                    <p className="font-semibold text-emerald-700">
                      {formatPaymentStatus(order.paymentStatus)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.productId}-${item.variantId}`} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-24 w-24 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{item.variantLabel}</p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500">Số lượng: {item.quantity}</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-end text-lg font-bold text-brand-700">
                  Tổng thanh toán: {formatCurrency(order.total)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistoryPage;
