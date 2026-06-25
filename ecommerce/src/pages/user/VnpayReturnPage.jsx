import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ShoppingBag } from "lucide-react";
import { orderService } from "@/services/user/orderService";
import { formatCurrency, formatPaymentStatus, isOrderPaid } from "@/utils/format";
import { useCart } from "@/hooks/useCart";

/**
 * Trang nhận redirect từ VNPay sau khi thanh toán.
 * Backend đã verify chữ ký + cập nhật PAID trước khi redirect về đây.
 * Trang này hiển thị kết quả cho user.
 *
 * URL: /payment/vnpay-return?vnp_ResponseCode=00&vnp_TxnRef=123&success=true
 */
function VnpayReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  const vnpTxnRef = searchParams.get("vnp_TxnRef");
  const success = searchParams.get("success") === "true";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const { clearCart, removeMultipleFromCart } = useCart();

  useEffect(() => {
    if (!vnpTxnRef) {
      setLoading(false);
      return;
    }

    if (success) {
      // Xóa giỏ hàng khi thanh toán VNPay thành công dựa trên localStorage
      const isDirect = localStorage.getItem("vnpay_pending_direct") === "true";
      if (!isDirect) {
        try {
          const itemsStr = localStorage.getItem("vnpay_pending_items");
          if (itemsStr) {
            const itemIds = JSON.parse(itemsStr);
            if (removeMultipleFromCart && itemIds.length > 0) {
              removeMultipleFromCart(itemIds);
            } else {
              clearCart();
            }
          }
        } catch (e) {
          clearCart(); // Fallback
        }
      }
      // Dọn dẹp localStorage
      localStorage.removeItem("vnpay_pending_direct");
      localStorage.removeItem("vnpay_pending_items");
    }

    orderService
      .getOrderById(vnpTxnRef)
      .then((res) => {
        setOrder(res?.result || res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vnpTxnRef]);

  if (loading) {
    return (
      <div className="container-padded flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-600" />
          <p className="mt-4 text-lg font-semibold text-slate-600">
            Đang xác nhận thanh toán...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-padded flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-lg">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-xl">
          {/* Header */}
          <div
            className={`px-8 py-8 text-center text-white ${
              success
                ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                : "bg-gradient-to-br from-rose-500 to-rose-600"
            }`}
          >
            {success ? (
              <CheckCircle2 className="mx-auto h-16 w-16" />
            ) : (
              <XCircle className="mx-auto h-16 w-16" />
            )}
            <h1 className="mt-4 text-2xl font-black">
              {success ? "Thanh toán thành công!" : "Thanh toán thất bại"}
            </h1>
            <p className="mt-2 text-sm text-white/85">
              {success
                ? "Đơn hàng của bạn đã được xác nhận và đang được xử lý."
                : "Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức khác."}
            </p>
          </div>

          {/* Body */}
          <div className="p-8">
            {order && (
              <div className="mb-6 space-y-3 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Mã đơn hàng</span>
                  <span className="font-black text-slate-900">
                    #{order.id || vnpTxnRef}
                  </span>
                </div>
                {order.totalAmount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Số tiền</span>
                    <span className="font-black text-brand-700">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Trạng thái</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      isOrderPaid(order)
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {formatPaymentStatus(order.paymentStatus || (order.status === "PAID" ? "PAID" : "UNPAID"))}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Phương thức</span>
                  <span className="font-semibold text-slate-700">VNPay</span>
                </div>
              </div>
            )}

            {!success && vnpResponseCode && (
              <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                <p className="font-bold">Mã lỗi VNPay: {vnpResponseCode}</p>
                <p className="mt-1 text-rose-600">
                  {vnpResponseCode === "24"
                    ? "Giao dịch bị hủy bởi người dùng."
                    : vnpResponseCode === "11"
                      ? "Giao dịch đã hết hạn (quá 15 phút)."
                      : vnpResponseCode === "65"
                        ? "Tài khoản đã vượt quá hạn mức giao dịch."
                        : "Giao dịch không thành công. Vui lòng thử lại."}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/orders"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-black text-white hover:bg-brand-700"
              >
                <ShoppingBag size={16} />
                Xem đơn hàng
              </Link>
              <Link
                to="/"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VnpayReturnPage;
