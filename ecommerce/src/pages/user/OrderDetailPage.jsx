import { useEffect, useState } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { orderService } from "@/services/user/orderService";
import {
  formatCurrency,
  formatDate,
  formatOrderStatus,
  formatPaymentStatus,
} from "@/utils/format";
import useAuth from "@/hooks/useAuth";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
} from "lucide-react";

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

const canReviewOrder = (status) => {
  return ["DELIVERED", "COMPLETED", "PAID"].includes(
    String(status || "").toUpperCase()
  );
};

function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!currentUser || !id) return;

    orderService
      .getOrderById(id)
      .then((data) => setOrder(data))
      .catch((error) => console.error("Lỗi tải chi tiết đơn hàng:", error))
      .finally(() => setLoading(false));
  }, [currentUser, id]);

  const handleCancelOrder = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác."
      )
    )
      return;

    try {
      await axios.put(`http://localhost:8080/api/v1/orders/${order.id}/status`, null, {
        params: { status: "CANCELLED" },
      });
      toast.success("Đã hủy đơn hàng thành công!");
      setOrder({ ...order, status: "CANCELLED" });
    } catch (error) {
      toast.error("Lỗi khi hủy đơn hàng. Vui lòng thử lại.");
    }
  };

  if (!currentUser) return <Navigate to="/login" replace />;

  if (loading)
    return (
      <div className="py-20">
        <LoadingSpinner label="Đang tải chi tiết đơn hàng..." />
      </div>
    );

  if (!order) {
    return (
      <div className="container-padded py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          Không tìm thấy đơn hàng
        </h2>
        <p className="mt-2 text-slate-500">
          Đơn hàng này không tồn tại hoặc bạn không có quyền xem.
        </p>
        <Link
          to="/orders"
          className="mt-6 inline-block font-semibold text-brand-600 hover:underline"
        >
          &larr; Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="container-padded py-8">
      <div className="mb-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-600 transition"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </Link>
      </div>

      <PageHeader
        title={`Chi tiết đơn hàng #${order.id}`}
        description="Theo dõi thông tin vận chuyển và chi tiết các sản phẩm đã đặt."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-4 mb-4">
              Sản phẩm đã mua
            </h2>

            <div className="space-y-4">
              {(order.details || order.items || order.orderDetails || []).map(
                (item, index) => {
                  const variant = item.productVariant || {};
                  const product = variant.product || {};

                  const itemName = item.name || product.name || "Sản phẩm";
                  const itemImage =
                    item.image ||
                    variant.image ||
                    product.thumbnail ||
                    "https://placehold.co/150x150?text=No+Image";
                  const itemPrice =
                    item.price || item.priceAtPurchase || variant.price || 0;
                  const itemQuantity = item.quantity || 1;
                  const productId = item.productId || product.id;
                  const productSlug = item.productSlug || product.slug;

                  let variantAttrs = {};
                  try {
                    const attrsData = item.attributes || variant.attributes;
                    variantAttrs =
                      typeof attrsData === "string"
                        ? JSON.parse(attrsData)
                        : attrsData || {};
                  } catch (e) {}

                  const variantLabel =
                    item.variantLabel ||
                    (variantAttrs.color
                      ? `${variantAttrs.color} - ${variantAttrs.storage || ""}`
                      : "Phân loại mặc định");

                  return (
                    <div
                      key={item.id || index}
                      className="flex gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100"
                    >
                      <img
                        src={itemImage}
                        alt={itemName}
                        className="h-20 w-20 rounded-xl object-cover border bg-white"
                      />

                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">
                          {itemName}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {variantLabel}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-sm">
                          <div className="flex flex-col items-start gap-2">
                            <span className="text-slate-500">
                              Số lượng: {itemQuantity}
                            </span>

                            {canReviewOrder(order.status) ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!productSlug) {
                                    toast.error("Không tìm thấy sản phẩm để đánh giá.");
                                    return;
                                  }
                                  navigate(`/products/${productSlug}#review-section`);
                                }}
                                className="text-sm font-semibold text-amber-600 hover:underline"
                              >
                                Đánh giá sản phẩm
                              </button>
                            ) : null}
                          </div>

                          <span className="font-semibold text-brand-700">
                            {formatCurrency(itemPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-6 space-y-3 border-t pt-4 text-sm text-slate-600">
              <div className="flex justify-between items-center">
                <span>Phí vận chuyển:</span>
                <span className="font-medium text-slate-900">
                  {order.shippingFee !== undefined
                    ? formatCurrency(order.shippingFee)
                    : "---"}
                </span>
              </div>

              {(order.voucherCode ||
                (order.discountAmount && order.discountAmount > 0)) && (
                <div className="flex justify-between items-center text-rose-600">
                  <span>
                    Voucher ưu đãi {order.voucherCode ? `(${order.voucherCode})` : ""}:
                  </span>
                  <span className="font-semibold">
                    -{formatCurrency(order.discountAmount || 0)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-lg font-bold text-slate-900">
                <span>Tổng thanh toán:</span>
                <span className="text-brand-700">
                  {formatCurrency(order.totalAmount || order.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-4 mb-4">
              Thông tin thanh toán
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="text-slate-400" size={18} />
                <div>
                  <p className="text-slate-500">Ngày đặt hàng</p>
                  <p className="font-semibold text-slate-900">
                    {order.createdAt || order.orderDate
                      ? formatDate(order.createdAt || order.orderDate)
                      : "Đang cập nhật"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="text-slate-400" size={18} />
                <div>
                  <p className="text-slate-500">Trạng thái thanh toán</p>
                  <p className="font-semibold text-emerald-600">
                    {formatPaymentStatus(order.paymentStatus || "PENDING")}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-slate-500 mb-1">Trạng thái đơn hàng:</p>
                <span
                  className={`inline-block rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider mt-1 ${getStatusColorClass(
                    order.status
                  )}`}
                >
                  {formatOrderStatus(order.status)}
                </span>
              </div>

              {order.status === "PENDING" && (
                <div className="pt-4 border-t border-slate-100 mt-2">
                  <button
                    onClick={handleCancelOrder}
                    className="w-full bg-rose-50 text-rose-600 font-bold py-3 rounded-xl hover:bg-rose-100 transition-colors"
                  >
                    Hủy đơn hàng này
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-4 mb-4">
              Thông tin giao hàng
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="text-slate-400 shrink-0 mt-1" size={18} />
                <p className="text-slate-700 leading-relaxed font-medium">
                  {order.shippingAddress || "Chưa cập nhật địa chỉ"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="text-slate-400" size={18} />
                <p className="font-semibold text-slate-900">
                  {order.phoneNumber || "Chưa cập nhật SĐT"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailPage;