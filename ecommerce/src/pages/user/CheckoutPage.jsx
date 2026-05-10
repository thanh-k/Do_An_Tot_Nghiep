import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Ticket, X } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import Modal from "@/components/common/Modal";
import useAuth from "@/hooks/useAuth";
import useCart from "@/hooks/useCart";
import useVoucherWallet from "@/hooks/useVoucherWallet";
import { orderService } from "@/services/user/orderService";
import userVoucherService from "@/services/user/voucherService";
import { PAYMENT_METHOD_OPTIONS } from "@/constants";
import { formatCurrency } from "@/utils/format";

import AddressSelector from "@/components/user/Mapp";
// Cấu hình UI Icon và Màu sắc cho từng loại Voucher
const CATEGORY_MAP = {
  DISCOUNT: { label: "Giảm giá", bg: "bg-rose-500", text: "text-rose-600" },
  SHIPPING: { label: "Vận chuyển", bg: "bg-blue-500", text: "text-blue-600" },
  CASHBACK: { label: "Hoàn xu", bg: "bg-amber-500", text: "text-amber-600" },
  VIP: { label: "Đặc quyền", bg: "bg-fuchsia-500", text: "text-fuchsia-600" },
};

function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { cartItems, subtotal, clearCart, removeMultipleFromCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [shipping, setShipping] = useState({
    fullName: "",
    email: "",
    phone: "",
    note: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // --- VOUCHER STATES ---
  const { savedVoucherCodes, syncAvailableCodes } = useVoucherWallet();
  const [myVouchers, setMyVouchers] = useState([]);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [shippingAddressInfo, setShippingAddressInfo] = useState({
    province: "",
    district: "",
    ward: "",
    specificAddress: "",
    fullAddress: "",
  });

  useEffect(() => {
  userVoucherService
    .getActiveVouchers()
    .then((data) => {
      const codes = savedVoucherCodes || [];
      setMyVouchers(
        (data || []).filter(
          (v) =>
            codes.includes(v.code) &&
            v.claimable !== false &&
            v.eligible !== false
        )
      );
    })
    .catch(() => {});
}, [savedVoucherCodes]);

  // Lấy ID các sản phẩm được chọn từ Giỏ hàng truyền sang
  const selectedIds = location.state?.selectedIds || [];
  // Lấy dữ liệu sản phẩm trực tiếp nếu đến từ nút "Mua ngay"
  const directItems = location.state?.directItems;

  const checkoutItems = useMemo(() => {
    if (directItems && directItems.length > 0) return directItems; // Ưu tiên dùng dữ liệu truyền trực tiếp
    if (selectedIds.length > 0)
      return cartItems.filter((item) => selectedIds.includes(item.id));
    // Nếu truy cập trực tiếp URL mà không có state, điều hướng về giỏ hàng, KHÔNG cho phép thanh toán toàn bộ giỏ
    return [];
  }, [cartItems, selectedIds, directItems]);

  // Tính lại tổng tiền chỉ cho những sản phẩm được chọn
  const checkoutSubtotal = useMemo(() => {
    return checkoutItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }, [checkoutItems]);

  // --- LOGIC TÍNH TIỀN & VOUCHER ---
  const shippingFee = checkoutSubtotal >= 500000 ? 0 : 30000;

  const discountAmount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (
      appliedVoucher.category === "SHIPPING" ||
      appliedVoucher.category === "CASHBACK"
    )
      return 0;
    if (appliedVoucher.discountType === "PERCENT") {
      return (checkoutSubtotal * appliedVoucher.discountValue) / 100;
    }
    return appliedVoucher.discountValue;
  }, [appliedVoucher, checkoutSubtotal]);

  const shippingDiscount = useMemo(() => {
    if (!appliedVoucher || appliedVoucher.category !== "SHIPPING") return 0;
    if (appliedVoucher.discountType === "PERCENT") {
      return (shippingFee * appliedVoucher.discountValue) / 100;
    }
    return Math.min(shippingFee, appliedVoucher.discountValue);
  }, [appliedVoucher, shippingFee]);

  const cashbackAmount = useMemo(() => {
    if (!appliedVoucher || appliedVoucher.category !== "CASHBACK") return 0;
    if (appliedVoucher.discountType === "PERCENT") {
      return (checkoutSubtotal * appliedVoucher.discountValue) / 100;
    }
    return appliedVoucher.discountValue;
  }, [appliedVoucher, checkoutSubtotal]);

  const finalShippingFee = shippingFee - shippingDiscount;
  const finalTotal =
    Math.max(0, checkoutSubtotal - discountAmount) + finalShippingFee;

  // Hủy voucher tự động nếu người dùng đổi số lượng khiến đơn hàng không đạt tối thiểu
  useEffect(() => {
    if (appliedVoucher && checkoutSubtotal < appliedVoucher.minOrderValue) {
      setAppliedVoucher(null);
      toast.error(
        "Mã ưu đãi đã bị gỡ vì đơn hàng không đủ điều kiện tối thiểu!",
      );
    }
  }, [checkoutSubtotal, appliedVoucher]);

  useEffect(() => {
    if (currentUser) {
      setShipping({
        fullName: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        note: "",
      });
    }
  }, [currentUser]);

  const canSubmit = useMemo(
    () =>
      shipping.fullName &&
      shipping.email &&
      shipping.phone &&
      shippingAddressInfo.province &&
      shippingAddressInfo.district &&
      shippingAddressInfo.ward &&
      shippingAddressInfo.specificAddress?.trim() &&
      checkoutItems.length > 0,
    [checkoutItems.length, shipping, shippingAddressInfo],
  );

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!checkoutItems.length) {
    return <Navigate to="/cart" replace />;
  }

  const handleChange = (field, value) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    if (!canSubmit) {
      toast.error("Vui lòng hoàn thiện thông tin giao hàng.");
      return;
    }

    try {
      setLoading(true);

      // Chuẩn bị payload chuẩn xác theo Backend OrderRequest
      const payload = {
        userId: currentUser.id, // Truyền ID của user đang đăng nhập
        phoneNumber: shipping.phone,
        shippingAddress: `${shippingAddressInfo.fullAddress}${shipping.note ? ` (Ghi chú: ${shipping.note})` : ""}`,
        items: checkoutItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        voucherCode: appliedVoucher ? appliedVoucher.code : null,
      };

      await orderService.createOrder(payload);

      // Chỉ xoá những sản phẩm đã được chọn thanh toán khỏi giỏ hàng
      if (!directItems) {
        if (removeMultipleFromCart) {
          removeMultipleFromCart(checkoutItems.map((item) => item.id));
        } else {
          clearCart();
        }
      }

      toast.success("Đặt hàng thành công!");
      navigate("/orders");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi đặt hàng";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-padded py-8">
      <PageHeader
        title="Thanh toán"
        description="Mock checkout flow với thông tin giao hàng, phương thức thanh toán và tạo đơn hàng giả lập."
      />

      <form
        onSubmit={handlePlaceOrder}
        className="grid gap-6 xl:grid-cols-[1fr_380px]"
      >
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              Thông tin giao hàng
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Họ và tên"
                value={shipping.fullName}
                onChange={(event) =>
                  handleChange("fullName", event.target.value)
                }
              />
              <Input
                label="Email"
                type="email"
                value={shipping.email}
                onChange={(event) => handleChange("email", event.target.value)}
              />
              <Input
                label="Số điện thoại"
                value={shipping.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
              />
              <div className="md:col-span-2">
                <AddressSelector onAddressChange={setShippingAddressInfo} />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Ghi chú"
                  textarea
                  rows={4}
                  value={shipping.note}
                  onChange={(event) => handleChange("note", event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              Phương thức thanh toán
            </h2>
            <div className="grid gap-3">
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <label
                  key={method.value}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-4"
                >
                  <input
                    type="radio"
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                    className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <p className="font-medium text-slate-900">{method.label}</p>
                    <p className="text-sm text-slate-500">
                      Dùng cho mock checkout frontend.
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <aside className="card h-fit p-6">
          <h2 className="text-xl font-bold text-slate-900">Đơn hàng của bạn</h2>
          <div className="mt-5 space-y-4">
            {checkoutItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-2xl bg-slate-50 p-3"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-20 w-20 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.variantLabel}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">x{item.quantity}</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-dashed border-slate-200 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Tạm tính</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(checkoutSubtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Phí vận chuyển</span>
              <span className="font-semibold text-slate-900">
                {shippingFee === 0 ? (
                  <span className="text-emerald-600">Miễn phí</span>
                ) : (
                  formatCurrency(shippingFee)
                )}
              </span>
            </div>

            {shippingDiscount > 0 && (
              <div className="flex items-center justify-between text-blue-600">
                <span>Giảm phí vận chuyển</span>
                <span className="font-semibold">
                  - {formatCurrency(shippingDiscount)}
                </span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-rose-600">
                <span>Voucher giảm giá</span>
                <span className="font-semibold">
                  - {formatCurrency(discountAmount)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-base border-t border-slate-100 pt-3">
              <span className="font-semibold text-slate-900">Tổng cộng</span>
              <span className="text-2xl font-bold text-brand-700">
                {formatCurrency(finalTotal)}
              </span>
            </div>

            {cashbackAmount > 0 && (
              <div className="bg-amber-50 text-amber-700 p-2 text-center rounded-lg text-xs font-bold mt-2">
                🎁 Bạn sẽ nhận được {formatCurrency(cashbackAmount)} xu sau khi
                hoàn thành đơn!
              </div>
            )}
          </div>

          {/* --- VOUCHER SECTION --- */}
          <div className="mt-6 border-t border-dashed border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-slate-900 flex items-center gap-2">
                <Ticket size={18} className="text-rose-600" /> Ưu đãi từ ví
              </span>
              <button
                type="button"
                onClick={() => setShowVoucherModal(true)}
                className="text-sm font-bold text-brand-600 hover:underline"
              >
                {appliedVoucher ? "Đổi mã khác" : "Chọn hoặc nhập mã"}
              </button>
            </div>
            {appliedVoucher ? (
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-black text-brand-700 text-sm uppercase">
                    {appliedVoucher.code}
                  </p>
                  <p className="text-[11px] text-brand-600 font-medium mt-0.5">
                    {appliedVoucher.category === "CASHBACK"
                      ? `Hoàn ${formatCurrency(cashbackAmount)} xu vào ví Nova`
                      : appliedVoucher.category === "SHIPPING"
                        ? `Giảm ${formatCurrency(shippingDiscount)} phí vận chuyển`
                        : `Giảm trực tiếp ${formatCurrency(discountAmount)} vào đơn`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedVoucher(null)}
                  className="text-slate-400 hover:text-rose-600 bg-white p-1 rounded-full shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                Chưa áp dụng mã giảm giá nào.
              </p>
            )}
          </div>

          <Button type="submit" fullWidth className="mt-6" loading={loading}>
            Xác nhận đặt hàng
          </Button>
        </aside>
      </form>

      {/* --- VOUCHER MODAL --- */}
      <Modal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        title="Chọn Mã Khuyến Mãi"
        size="md"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pb-2">
          {myVouchers.map((v) => {
            const isEligible = checkoutSubtotal >= v.minOrderValue;
            const catConfig = CATEGORY_MAP[v.category || "DISCOUNT"];
            return (
              <div
                key={v.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  isEligible
                    ? "bg-white border-slate-200 hover:border-brand-500 cursor-pointer shadow-sm"
                    : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (!isEligible) return;
                  setAppliedVoucher(v);
                  setShowVoucherModal(false);
                }}
              >
                {/* Trái - Icon */}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0 shadow-inner ${catConfig.bg}`}
                >
                  <Ticket size={24} />
                </div>
                {/* Giữa - Chi tiết */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-black text-slate-900 text-sm uppercase">
                      {v.code}
                    </p>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${catConfig.text} border-current uppercase`}
                    >
                      {catConfig.label}
                    </span>
                  </div>
                  <p className={`text-xs font-black mt-1 ${catConfig.text}`}>
                    Giảm{" "}
                    {v.discountType === "PERCENT"
                      ? `${v.discountValue}%`
                      : formatCurrency(v.discountValue)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    Đơn tối thiểu {formatCurrency(v.minOrderValue)}
                  </p>
                  {!isEligible && (
                    <p className="text-[10px] text-rose-500 mt-1 italic font-semibold">
                      Mua thêm{" "}
                      {formatCurrency(v.minOrderValue - checkoutSubtotal)} để sử
                      dụng mã
                    </p>
                  )}
                </div>
                {/* Phải - Radio */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    appliedVoucher?.id === v.id
                      ? "border-brand-600"
                      : "border-slate-300"
                  }`}
                >
                  {appliedVoucher?.id === v.id && (
                    <div className="w-3 h-3 bg-brand-600 rounded-full" />
                  )}
                </div>
              </div>
            );
          })}
          {myVouchers.length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
              <Ticket size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm font-medium">
                Ví của bạn chưa có mã nào.
              </p>
              <Link
                to="/vouchers"
                className="text-brand-600 hover:underline font-bold mt-2 inline-block"
              >
                Đến Kho Voucher Săn mã ngay &rarr;
              </Link>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default CheckoutPage;
