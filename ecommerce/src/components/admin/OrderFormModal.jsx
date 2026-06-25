import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { formatCurrency, formatOrderStatus, formatPaymentStatus, getPaymentStatusColor, formatOrderCode } from "@/utils/format";

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
import { ORDER_STATUS_OPTIONS } from "@/constants";

function OrderFormModal({ isOpen, onClose, order, onUpdateStatus, onDelete }) {
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (order) {
      setStatus(order.status);
    }
  }, [order]);

  if (!order) return null;

  const handleSave = () => {
    if (status !== order.status) {
      onUpdateStatus(order.id, status);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết đơn hàng ${formatOrderCode(order)}`}
      size="2xl"
    >
      <div className="space-y-6">
        {/* THÔNG TIN KHÁCH HÀNG & TRẠNG THÁI */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">
              Thông tin giao hàng
            </h4>
            <p className="font-semibold text-slate-900 mb-1">
              SĐT: {order.phoneNumber || "Không có"}
            </p>
            <p className="text-sm text-slate-600">{order.shippingAddress}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">
              Trạng thái đơn hàng
            </h4>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              {ORDER_STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p
              className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full text-center mt-2 ${getStatusColorClass(order.status)}`}
            >
              {/* Hiển thị trạng thái hiện tại với màu sắc */}
              Hiện tại: {formatOrderStatus(order.status)}
            </p>

            <div className="mt-3 rounded-xl bg-white p-3 text-xs">
              <p className="font-bold uppercase tracking-wide text-slate-400">
                Trạng thái thanh toán
              </p>
              <p
                className="mt-1 font-black uppercase"
                style={{ color: getPaymentStatusColor(order.paymentStatus || (order.status === "PAID" ? "PAID" : "UNPAID")) }}
              >
                {formatPaymentStatus(order.paymentStatus || (order.status === "PAID" ? "PAID" : "UNPAID"))}
              </p>
              <p className="mt-1 text-slate-400">
                Phương thức: {order.paymentMethod || "COD"}
              </p>
            </div>
          </div>
        </div>

        {/* DANH SÁCH SẢN PHẨM */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3 border-b pb-2">
            Sản phẩm đã đặt ({order.details?.length || 0})
          </h4>
          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
            {(order.details || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-slate-100 p-3"
              >
                <img
                  src={
                    item.image || "https://placehold.co/100x100?text=No+Image"
                  }
                  alt={item.name}
                  className="h-16 w-16 rounded-lg object-cover border bg-slate-50"
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.variantSku}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(item.priceAtPurchase)}
                  </p>
                  <p className="text-xs text-slate-500">x {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TỔNG KẾT THANH TOÁN */}
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Phí vận chuyển:</span>
            <span className="font-medium text-slate-900">
              {order.shippingFee !== undefined
                ? formatCurrency(order.shippingFee)
                : "---"}
            </span>
          </div>
          {(order.voucherCode ||
            (order.discountAmount && order.discountAmount > 0)) && (
            <div className="flex justify-between text-rose-600">
              <span>
                Voucher {order.voucherCode ? `(${order.voucherCode})` : ""}:
              </span>
              <span className="font-semibold">
                -{formatCurrency(order.discountAmount || 0)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 mt-2 text-base">
            <span className="font-bold text-slate-900">Tổng thanh toán:</span>
            <span className="font-bold text-brand-700">
              {formatCurrency(order.totalAmount || 0)}
            </span>
          </div>
        </div>

        {/* HÀNH ĐỘNG */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="danger" onClick={() => onDelete(order)}>
            Xóa đơn hàng
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Đóng
            </Button>
            <Button onClick={handleSave}>Lưu trạng thái</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default OrderFormModal;
