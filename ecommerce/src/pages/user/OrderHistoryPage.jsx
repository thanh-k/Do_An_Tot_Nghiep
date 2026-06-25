import { Navigate, Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/services/apiClient";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import useAuth from "@/hooks/useAuth";
import { orderService } from "@/services/user/orderService";
import {
  formatCurrency,
  formatDate,
  formatOrderStatus,
  formatPaymentStatus,
  isOrderPaid,
  formatOrderCode,
} from "@/utils/format";
import { ATTRIBUTE_OPTIONS } from "@/utils/categoryConfig";
import { ArchiveX, PackageOpen, Star, Truck, Wallet, List, MessageSquareText } from "lucide-react";

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
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 4;
  const isDeliveredTab = activeStatus === "DELIVERED";

  useEffect(() => {
    if (!currentUser) return;

    orderService
      .getMyOrders(currentUser.id)
      .then(setOrders)
      .catch((error) => console.error("Lỗi khi tải lịch sử đơn hàng:", error))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      if (idA !== idB) {
        return idB - idA;
      }
      
      const dateA = new Date(a.createdAt || a.orderDate || 0);
      const dateB = new Date(b.createdAt || b.orderDate || 0);
      return dateB - dateA;
    });
  }, [orders]);

  const hasUnreviewedItem = (order) => {
    if (!canReviewOrder(order.status)) {
      return false;
    }

    const details = order.details || order.items || order.orderDetails || [];
    return details.some((item) => item.reviewable === true || item.reviewed === false);
  };

  const filteredOrders = useMemo(() => {
    if (activeStatus === "ALL") {
      return sortedOrders;
    }

    if (activeStatus === "UNREVIEWED") {
      return sortedOrders.filter(hasUnreviewedItem);
    }

    return sortedOrders.filter((o) => {
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
  }, [sortedOrders, activeStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
    { key: "UNREVIEWED", label: "Chưa đánh giá", icon: MessageSquareText },
    { key: "CANCELLED", label: "Đã hủy", icon: ArchiveX },
  ];

  const handleTabClick = (status) => {
    setSearchParams(
      status === "ALL" ? new URLSearchParams() : { status: status },
    );
  };

  return (
    <div className="container-padded py-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <PageHeader
          title="Lịch sử đơn hàng"
          description="Theo dõi các đơn hàng đã đặt, trạng thái xử lý và thông tin thanh toán."
        />
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar sm:mb-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-all sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm ${
                isActive
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
              : activeStatus === "UNREVIEWED"
                ? "Không có đơn hàng nào cần đánh giá"
                : "Không có đơn hàng nào ở trạng thái này"
          }
          description={
            activeStatus === "UNREVIEWED"
              ? "Các đơn hàng đã giao nhưng còn sản phẩm chưa đánh giá sẽ xuất hiện tại đây."
              : "Sau khi đặt hàng, các đơn hàng sẽ xuất hiện tại đây."
          }
        />
      ) : (
        <div className="space-y-3 sm:space-y-5">
          {paginatedOrders.map((order) => (
            <article key={order.id} className="card overflow-hidden p-3 sm:p-6">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:pb-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-sm sm:normal-case sm:tracking-normal">Mã đơn hàng</p>
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-base font-black text-brand-600 transition hover:text-brand-700 sm:text-xl"
                    >
                      {formatOrderCode(order)}
                    </Link>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide sm:hidden ${getStatusColorClass(
                      order.status,
                    )}`}
                  >
                    {formatOrderStatus(order.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm">
                    <p className="text-slate-500">Ngày đặt</p>
                    <p className="font-semibold text-slate-900">
                      {order.createdAt || order.orderDate
                        ? formatDate(order.createdAt || order.orderDate)
                        : "Đang cập nhật"}
                    </p>
                  </div>

                  <div className="hidden rounded-2xl bg-slate-50 px-4 py-3 text-sm sm:block">
                    <p className="text-slate-500 mb-2">Trạng thái</p>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusColorClass(
                        order.status,
                      )}`}
                    >
                      {formatOrderStatus(order.status)}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm">
                    <p className="text-slate-500">Thanh toán</p>
                    <p className={`font-semibold ${isOrderPaid(order) ? 'text-emerald-700' : 'text-amber-600'}`}>
                      {formatPaymentStatus(order.paymentStatus || (order.status === 'PAID' ? 'PAID' : 'UNPAID'))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2 sm:mt-5 sm:space-y-4">
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
                    const reviewed = Boolean(item.reviewed);
                    const reviewable = item.reviewable === true || (canReviewOrder(order.status) && !reviewed);

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
                        className="flex gap-3 rounded-2xl bg-slate-50 p-2.5 sm:gap-4 sm:p-4"
                      >
                        <img
                          src={itemImage}
                          alt={itemName}
                          className="h-16 w-16 shrink-0 rounded-xl border border-slate-100 bg-white object-cover sm:h-24 sm:w-24"
                        />

                        <div className="flex-1">
                          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 sm:text-base">
                            {itemName}
                          </h3>

                          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 sm:mt-1 sm:text-sm">
                            {variantLabel}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs sm:mt-3 sm:gap-3 sm:text-sm">
                            <div className="flex flex-col items-start gap-1.5 sm:gap-2">
                              <span className="text-slate-500">
                                SL: {itemQuantity}
                              </span>

                              {reviewable ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!productSlug) {
                                      toast.error(
                                        "Không tìm thấy sản phẩm để đánh giá.",
                                      );
                                      return;
                                    }
                                    window.location.href = `/products/${productSlug}?writeReview=1#review-section`;
                                  }}
                                  className="w-fit rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100 sm:px-3 sm:py-1.5 sm:text-xs"
                                >
                                  Đánh giá
                                </button>
                              ) : reviewed && canReviewOrder(order.status) ? (
                                <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 sm:px-3 sm:py-1.5 sm:text-xs">
                                  Đã đánh giá
                                </span>
                              ) : null}
                            </div>

                            <span className="ml-auto font-bold text-slate-900">
                              {formatCurrency(itemPrice * itemQuantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}

                <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-end sm:justify-between sm:pt-4">
                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-start">
                    <Link
                      to={`/orders/${order.id}`}
                      className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-brand-600 hover:bg-blue-100 sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm sm:hover:underline"
                    >
                      Chi tiết &rarr;
                    </Link>

                    {String(order.status || "").toUpperCase() === "PENDING" && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 sm:rounded-lg sm:text-sm sm:hover:underline"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    {order.voucherCode && (
                      <p className="mb-1 text-[11px] font-medium italic text-rose-500 sm:text-xs">
                        Đã áp dụng mã {order.voucherCode}:{" "}
                        <span className="font-bold">
                          - {formatCurrency(order.discountAmount || 0)}
                        </span>
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-50 px-3 py-2 text-sm font-black text-brand-700 sm:block sm:bg-transparent sm:px-0 sm:py-0 sm:text-lg">
                      <span>Tổng</span>
                      <span>{formatCurrency(order.totalAmount || order.total || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredOrders.length}
            pageSize={ORDERS_PER_PAGE}
            itemLabel="đơn hàng"
            className="rounded-3xl bg-white p-3 shadow-sm sm:p-4"
          />
        </div>
      )}
    </div>
  );
}

export default OrderHistoryPage;
