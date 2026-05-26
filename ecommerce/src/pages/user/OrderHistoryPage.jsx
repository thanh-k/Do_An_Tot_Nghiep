import { Navigate, Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/services/apiClient";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import useAuth from "@/hooks/useAuth";
import { orderService } from "@/services/user/orderService";
import {
  formatCurrency,
  formatDate,
  formatOrderStatus,
  formatPaymentStatus,
} from "@/utils/format";
import { ATTRIBUTE_OPTIONS } from "@/utils/categoryConfig";
import { ArchiveX, PackageOpen, Star, Truck, Wallet, List } from "lucide-react";

const getStatusColorClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-700";
    case "PROCESSING":
      return "bg-indigo-100 text-indigo-700";
    case "SHIPPED":
    case "SHIPPING":
      return "bg-purple-100 text-purple-700";
    case "DELIVERED":
    case "COMPLETED":
    case "PAID":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const canReviewOrder = (status) => {
  return ["DELIVERED", "COMPLETED", "PAID"].includes(
    String(status || "").toUpperCase(),
  );
};

const formatOrderVariantLabel = (attributesData, fallbackLabel) => {
  if (!attributesData || attributesData === "null")
    return fallbackLabel || "Mặc định";

  let attrs = attributesData;
  if (typeof attributesData === "string") {
    try {
      attrs = JSON.parse(attributesData);
    } catch (e) {
      return fallbackLabel || "Mặc định";
    }
  }

  if (!attrs || Object.keys(attrs).length === 0)
    return fallbackLabel || "Mặc định";
  const parts = [];
  Object.entries(attrs).forEach(([key, value]) => {
    if (value) parts.push(`${ATTRIBUTE_OPTIONS[key]?.label || key}: ${value}`);
  });
  return parts.join(" - ") || fallbackLabel || "Mặc định";
};

function OrderHistoryPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStatus = searchParams.get("status") || "ALL";

  useEffect(() => {
    if (!currentUser) return;

    orderService
      .getMyOrders(currentUser.id)
      .then(setOrders)
      .catch((error) => console.error("Lỗi khi tải lịch sử đơn hàng:", error))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const filteredOrders = useMemo(() => {
    if (activeStatus === "ALL") {
      return orders;
    }

    return orders.filter((o) => {
      const status = String(o.status || "").toUpperCase();
      if (activeStatus === "DELIVERED") {
        return ["DELIVERED", "COMPLETED", "PAID"].includes(status);
      }
      if (activeStatus === "PROCESSING") {
        return ["PROCESSING", "CONFIRMED"].includes(status);
      }
      if (activeStatus === "SHIPPED") {
        return ["SHIPPED", "SHIPPING"].includes(status);
      }
      return status === activeStatus;
    });
  }, [orders, activeStatus]);

  const handleCancelOrder = async (orderId) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.",
      )
    )
      return;

    try {
      await apiClient.request(`/orders/${orderId}/status?status=CANCELLED`, {
        method: "PUT",
      });
      toast.success("Đã hủy đơn hàng thành công!");
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === orderId ? { ...o, status: "CANCELLED" } : o,
        ),
      );
    } catch (error) {
      toast.error("Lỗi khi hủy đơn hàng. Vui lòng thử lại.");
    }
  };

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const TABS = [
    { key: "ALL", label: "Tất cả", icon: List },
    { key: "PENDING", label: "Chờ xác nhận", icon: Wallet },
    { key: "PROCESSING", label: "Đang xử lý", icon: PackageOpen },
    { key: "SHIPPED", label: "Đang giao", icon: Truck },
    { key: "DELIVERED", label: "Đã giao", icon: Star },
    { key: "CANCELLED", label: "Đã hủy", icon: ArchiveX },
  ];

  const handleTabClick = (status) => {
    setSearchParams(
      status === "ALL" ? new URLSearchParams() : { status: status },
    );
  };

  return (
    <div className="container-padded py-8">
      <PageHeader
        title="Lịch sử đơn hàng"
        description="Theo dõi các đơn hàng đã đặt, trạng thái xử lý và thông tin thanh toán."
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner label="Đang tải đơn hàng..." />
      ) : !filteredOrders.length ? (
        <EmptyState
          title={
            activeStatus === "ALL"
              ? "Bạn chưa có đơn hàng nào"
              : "Không có đơn hàng nào ở trạng thái này"
          }
          description="Sau khi đặt hàng, các đơn hàng sẽ xuất hiện tại đây."
        />
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => (
            <article key={order.id} className="card p-6">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Mã đơn hàng</p>
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-xl font-bold text-brand-600 hover:text-brand-700 transition"
                  >
                    #{order.id}
                  </Link>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <p className="text-slate-500">Ngày đặt</p>
                    <p className="font-semibold text-slate-900">
                      {order.createdAt || order.orderDate
                        ? formatDate(order.createdAt || order.orderDate)
                        : "Đang cập nhật"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <p className="text-slate-500 mb-2">Trạng thái</p>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusColorClass(
                        order.status,
                      )}`}
                    >
                      {formatOrderStatus(order.status)}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <p className="text-slate-500">Thanh toán</p>
                    <p className="font-semibold text-emerald-700">
                      {formatPaymentStatus(order.paymentStatus || "PENDING")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {(order.details || order.items || order.orderDetails || []).map(
                  (item, index) => {
                    const variant = item.productVariant || {};
                    const product = variant.product || {};

                    const itemName = item.name || product.name || "Sản phẩm";
                    const itemImage =
                      item.image || variant.image || product.thumbnail || "";
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
                        className="flex gap-4 rounded-2xl bg-slate-50 p-4"
                      >
                        <img
                          src={itemImage}
                          alt={itemName}
                          className="h-24 w-24 rounded-xl object-cover border border-slate-100 bg-white"
                        />

                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {itemName}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {variantLabel}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                            <div className="flex flex-col items-start gap-2">
                              <span className="text-slate-500">
                                Số lượng: {itemQuantity}
                              </span>

                              {canReviewOrder(order.status) ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!productSlug) {
                                      toast.error(
                                        "Không tìm thấy sản phẩm để đánh giá.",
                                      );
                                      return;
                                    }
                                    window.location.href = `/products/${productSlug}#review-section`;
                                  }}
                                  className="text-sm font-semibold text-amber-600 hover:underline"
                                >
                                  Đánh giá sản phẩm
                                </button>
                              ) : null}
                            </div>

                            <span className="font-semibold text-slate-900">
                              {formatCurrency(itemPrice * itemQuantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}

                <div className="flex items-end justify-between pt-4">
                  <div className="flex flex-col gap-2 items-start">
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-sm font-semibold text-brand-600 hover:underline"
                    >
                      Xem chi tiết đơn hàng &rarr;
                    </Link>

                    {String(order.status || "").toUpperCase() === "PENDING" && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-sm font-semibold text-rose-600 hover:underline bg-rose-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-rose-100"
                      >
                        Hủy đơn hàng
                      </button>
                    )}
                  </div>

                  <div className="text-right">
                    {order.voucherCode && (
                      <p className="text-xs text-rose-500 mb-1 font-medium italic">
                        Đã áp dụng mã {order.voucherCode}:{" "}
                        <span className="font-bold">
                          - {formatCurrency(order.discountAmount || 0)}
                        </span>
                      </p>
                    )}

                    <div className="text-lg font-bold text-brand-700">
                      Tổng thanh toán:{" "}
                      {formatCurrency(order.totalAmount || order.total || 0)}
                    </div>
                  </div>
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
