import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CreditCard, Landmark, MapPin, Plus, Ticket, Truck, X } from "lucide-react";
import AddressSelector from "@/components/user/Mapp";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import Modal from "@/components/common/Modal";
import VnpayQrModal from "@/components/payment/VnpayQrModal";
import useAuth from "@/hooks/useAuth";
import useCart from "@/hooks/useCart";
import useVoucherWallet from "@/hooks/useVoucherWallet";
import { orderService } from "@/services/user/orderService";
import { paymentService } from "@/services/user/paymentService";
import behaviorService from "@/services/user/behaviorService";
import userVoucherService from "@/services/user/voucherService";
import profileService from "@/services/user/profileService";
import { PAYMENT_METHOD_OPTIONS } from "@/constants";
import { formatCurrency } from "@/utils/format";
import { validateFullName, validatePhone } from "@/utils/validators";

// Cấu hình UI Icon và Màu sắc cho từng loại Voucher
const CATEGORY_MAP = {
  DISCOUNT: { label: "Giảm giá", bg: "bg-rose-500", text: "text-rose-600" },
  SHIPPING: { label: "Vận chuyển", bg: "bg-blue-500", text: "text-blue-600" },
  CASHBACK: { label: "Hoàn xu", bg: "bg-amber-500", text: "text-amber-600" },
  VIP: { label: "Đặc quyền", bg: "bg-fuchsia-500", text: "text-fuchsia-600" },
  COIN_REWARD: { label: "Đổi xu", bg: "bg-emerald-500", text: "text-emerald-600" },
};

const emptyCheckoutAddress = {
  recipientName: "",
  phone: "",
  addressLine: "",
  isDefault: false,
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
  const [showVnpayQrModal, setShowVnpayQrModal] = useState(false);
  const [vnpaySession, setVnpaySession] = useState(null);
  const orderCompletedRef = useRef(false);

  // --- VOUCHER STATES ---
  const { savedVoucherCodes, syncAvailableCodes } = useVoucherWallet();
  const [myVouchers, setMyVouchers] = useState([]);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyCheckoutAddress);
  const [addressErrors, setAddressErrors] = useState({});

  useEffect(() => {
    userVoucherService
      .getActiveVouchers()
      .then((data) => {
        console.log("[CheckoutPage] Dữ liệu voucher từ API /vouchers/me:", data);
        // Backend đã xử lý logic lọc, frontend chỉ cần lọc những mã đã được claim
        // hoặc các mã đặc biệt như VIP, COIN_REWARD
        const usableVouchers = (data || []).filter((v) => {
          const category = (v.category || "DISCOUNT").toUpperCase();
          const isClaimed = v.claimed === true;
          const isSpecial = category === "VIP" || category === "COIN_REWARD";

          // Điều kiện để hiển thị trong trang thanh toán:
          // 1. Voucher phải hợp lệ (active, eligible, còn lượt dùng) - Backend đã lo
          // 2. Voucher phải là loại đặc biệt (VIP, Đổi xu) hoặc đã được người dùng claim
          return isSpecial || isClaimed;
        });
        console.log("[CheckoutPage] Các voucher có thể sử dụng sau khi lọc:", usableVouchers);
        setMyVouchers(usableVouchers);
      })
      .catch((error) => {
        console.error("Không lấy được voucher trong checkout:", error);
      });
  }, [savedVoucherCodes]); // Re-fetch when wallet changes

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

  const checkoutProductIds = useMemo(() => {
    return [...new Set(checkoutItems.map((item) => item.productId).filter(Boolean))];
  }, [checkoutItems]);

  const selectedAddress = useMemo(() => {
    if (!addresses.length) return null;
    return addresses.find((item) => item.id === selectedAddressId) || addresses.find((item) => item.isDefault) || addresses[0];
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (!checkoutProductIds.length) return;

    orderCompletedRef.current = false;
    behaviorService.track({
      eventType: "START_CHECKOUT",
      productIds: checkoutProductIds,
    });

    return () => {
      if (!orderCompletedRef.current) {
        behaviorService.trackBeacon({
          eventType: "ABANDON_CHECKOUT",
          productIds: checkoutProductIds,
        });
      }
    };
  }, [checkoutProductIds.join(",")]);

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

  const loadAddresses = async () => {
    try {
      setAddressLoading(true);
      const data = await profileService.getProfileAddresses();
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);
      const defaultAddress = list.find((item) => item.isDefault) || list[0];
      setSelectedAddressId((prev) => prev || defaultAddress?.id || null);
      return list;
    } catch (error) {
      console.error("Không tải được sổ địa chỉ:", error);
      setAddresses([]);
      return [];
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setShipping({
        fullName: currentUser.fullName || currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        note: "",
      });
      loadAddresses();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!selectedAddress) return;
    setShipping((prev) => ({
      ...prev,
      fullName: selectedAddress.recipientName || prev.fullName || currentUser?.name || "",
      phone: selectedAddress.phone || prev.phone || currentUser?.phone || "",
    }));
  }, [selectedAddress, currentUser]);

  const resetAddressForm = () => {
    setAddressForm({
      ...emptyCheckoutAddress,
      recipientName: selectedAddress?.recipientName || currentUser?.fullName || currentUser?.name || "",
      phone: selectedAddress?.phone || currentUser?.phone || "",
      isDefault: addresses.length === 0,
    });
    setAddressErrors({});
  };

  const openAddressModal = () => {
    resetAddressForm();
    setShowAddressForm(addresses.length === 0);
    setShowAddressModal(true);
  };

  const submitCheckoutAddress = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!validateFullName(addressForm.recipientName)) {
      nextErrors.recipientName = "Tên người nhận không hợp lệ.";
    }
    if (!validatePhone(addressForm.phone)) {
      nextErrors.phone = "Số điện thoại phải gồm đúng 10 chữ số.";
    }
    if (!addressForm.addressLine?.trim()) {
      nextErrors.addressLine = "Vui lòng chọn đầy đủ khu vực và nhập địa chỉ chi tiết.";
    }

    if (Object.keys(nextErrors).length) {
      setAddressErrors(nextErrors);
      return;
    }

    try {
      setAddressSaving(true);
      const payload = {
        recipientName: addressForm.recipientName.trim(),
        phone: addressForm.phone.trim(),
        addressLine: addressForm.addressLine.trim(),
        isDefault: addressForm.isDefault || addresses.length === 0,
      };

      const created = await profileService.createAddress(payload);
      const list = await loadAddresses();

      const createdId =
        created?.id ||
        list.find(
          (item) =>
            item.recipientName === payload.recipientName &&
            item.phone === payload.phone &&
            item.addressLine === payload.addressLine
        )?.id;

      if (createdId) {
        setSelectedAddressId(createdId);
      }

      setShipping((prev) => ({
        ...prev,
        fullName: payload.recipientName,
        phone: payload.phone,
      }));

      toast.success("Đã thêm địa chỉ nhận hàng");
      setShowAddressForm(false);
      setAddressErrors({});
      setAddressForm(emptyCheckoutAddress);
    } catch (error) {
      toast.error(error?.message || "Không thể thêm địa chỉ nhận hàng");
    } finally {
      setAddressSaving(false);
    }
  };

  const canSubmit = useMemo(
    () =>
      shipping.fullName &&
      shipping.email &&
      shipping.phone &&
      selectedAddress?.addressLine &&
      checkoutItems.length > 0,
    [checkoutItems.length, shipping, selectedAddress],
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

  const buildOrderPayload = () => ({
    userId: currentUser.id,
    phoneNumber: selectedAddress.phone || shipping.phone,
    shippingAddress: `${selectedAddress.addressLine}${shipping.note ? ` (Ghi chú: ${shipping.note})` : ""}`,
    paymentMethod: paymentMethod === "banking" ? "VNPAY" : paymentMethod === "vnpay" ? "VNPAY" : "COD",
    items: checkoutItems.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      livestreamId: item.livestreamId || null,
      liveDealId: item.liveDealId || null,
    })),
    voucherCode: appliedVoucher ? appliedVoucher.code : null,
  });

  const createVnpaySession = async () => {
    try {
      setLoading(true);

      // Tạo đơn hàng thật (status = PENDING) TRƯỚC KHI hiện QR
      const orderResponse = await orderService.createOrder(buildOrderPayload());
      const orderId = orderResponse?.result?.id || orderResponse?.id;

      if (!orderId) {
        toast.error("Không thể tạo đơn hàng. Vui lòng thử lại.");
        return;
      }

      // Đánh dấu đơn đã tạo → không gọi ABANDON_CHECKOUT khi rời trang
      orderCompletedRef.current = true;

      // Lưu trạng thái giỏ hàng vào localStorage để VnpayQrModal xử lý xóa khi thanh toán thành công
      localStorage.setItem("vnpay_pending_direct", directItems ? "true" : "false");
      if (!directItems) {
        localStorage.setItem("vnpay_pending_items", JSON.stringify(checkoutItems.map((item) => item.id)));
      }

      setVnpaySession({
        orderId,
        amount: finalTotal,
        expiredAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
      setShowVnpayQrModal(true);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Không thể tạo đơn hàng.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async () => {
    try {
      setLoading(true);

      await orderService.createOrder(buildOrderPayload());
      orderCompletedRef.current = true;
      behaviorService.track({
        eventType: "PLACE_ORDER",
        productIds: checkoutProductIds,
      });

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

  // === VNPAY REDIRECT FLOW ===
  const handleVnpayRedirect = async () => {
    try {
      setLoading(true);

      // Tạo đơn hàng PENDING trước
      const orderResponse = await orderService.createOrder(buildOrderPayload());
      const orderId = orderResponse?.result?.id || orderResponse?.id;

      if (!orderId) {
        toast.error("Không thể tạo đơn hàng. Vui lòng thử lại.");
        return;
      }

      orderCompletedRef.current = true;

      // Gọi backend tạo URL thanh toán VNPay
      const paymentResponse = await paymentService.createVnpayPayment(orderId);
      const paymentUrl = paymentResponse?.result?.paymentUrl || paymentResponse?.paymentUrl;

      if (!paymentUrl) {
        toast.error("Không thể tạo liên kết thanh toán VNPay.");
        return;
      }

      // Lưu trạng thái giỏ hàng vào localStorage để xử lý ở VnpayReturnPage nếu thanh toán thành công
      localStorage.setItem("vnpay_pending_direct", directItems ? "true" : "false");
      if (!directItems) {
        localStorage.setItem("vnpay_pending_items", JSON.stringify(checkoutItems.map((item) => item.id)));
      }

      // Redirect sang VNPay
      window.location.href = paymentUrl;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Lỗi kết nối VNPay.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    if (!canSubmit) {
      toast.error(addresses.length ? "Vui lòng chọn địa chỉ giao hàng." : "Bạn cần thêm địa chỉ nhận hàng trong hồ sơ trước khi thanh toán.");
      return;
    }

    if (paymentMethod === "banking") {
      await createVnpaySession();
      return;
    }

    if (paymentMethod === "vnpay") {
      await handleVnpayRedirect();
      return;
    }

    await submitOrder();
  };

  return (
    <div className="container-padded py-8">
      <PageHeader
        title="Thanh toán"
        description="Điền thông tin giao hàng, chọn phương thức thanh toán và xác nhận đơn hàng."
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
            <div className="space-y-4">
              {addressLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  Đang tải sổ địa chỉ...
                </div>
              ) : selectedAddress ? (
                <div className="rounded-2xl border border-brand-100 bg-brand-50/30 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex items-center gap-2 text-brand-700">
                        <MapPin size={18} />
                        <span className="font-bold">Địa chỉ nhận hàng</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-slate-900">
                        <span className="font-black">{selectedAddress.recipientName}</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-semibold">{selectedAddress.phone}</span>
                        {selectedAddress.isDefault ? (
                          <span className="rounded border border-brand-300 px-2 py-0.5 text-xs font-bold text-brand-700">Mặc định</span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{selectedAddress.addressLine}</p>
                    </div>
                    <button
                      type="button"
                      onClick={openAddressModal}
                      className="text-sm font-bold text-brand-600 hover:underline"
                    >
                      Thay đổi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-rose-300 bg-rose-50 p-5">
                  <p className="font-bold text-rose-700">Bạn chưa có địa chỉ nhận hàng</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Vui lòng thêm địa chỉ nhận hàng để tiếp tục thanh toán. Bạn có thể lưu địa chỉ ngay tại trang này.
                  </p>
                  <button
                    type="button"
                    onClick={openAddressModal}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
                  >
                    <Plus size={16} />
                    Thêm địa chỉ
                  </button>
                </div>
              )}

              <div>
                <Input
                  label="Ghi chú"
                  textarea
                  rows={4}
                  value={shipping.note}
                  onChange={(event) => handleChange("note", event.target.value)}
                  placeholder="Lưu ý cho người bán hoặc đơn vị giao hàng..."
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              Phương thức thanh toán
            </h2>
            <div className="grid gap-3">
              {PAYMENT_METHOD_OPTIONS.map((method) => {
                const checked = paymentMethod === method.value;
                const Icon = method.value === "vnpay" ? CreditCard : method.value === "banking" ? Landmark : Truck;

                return (
                  <label
                    key={method.value}
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border px-4 py-4 transition ${
                      checked
                        ? "border-brand-500 bg-brand-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-brand-200"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={checked}
                      onChange={() => setPaymentMethod(method.value)}
                      className="mt-1 h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div className={`rounded-2xl p-3 ${checked ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900">{method.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {method.description}
                      </p>
                      {method.value === "banking" && checked ? (
                        <div className="mt-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                          Sau khi bấm xác nhận, hệ thống sẽ tạo đơn hàng và hiện mã QR chuyển khoản. Mã có hiệu lực trong 15 phút.
                        </div>
                      ) : null}
                      {method.value === "vnpay" && checked ? (
                        <div className="mt-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700">
                          Bạn sẽ được chuyển sang trang VNPay để hoàn tất thanh toán bằng thẻ ATM, Visa/MasterCard hoặc QR Pay.
                        </div>
                      ) : null}
                    </div>
                  </label>
                );
              })}
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
            {paymentMethod === "banking" ? "Tạo mã QR thanh toán" : paymentMethod === "vnpay" ? "Thanh toán qua VNPay" : "Xác nhận đặt hàng"}
          </Button>
        </aside>
      </form>

      <Modal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title="Địa chỉ nhận hàng"
        size="lg"
      >
        <div className="space-y-5">
          <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1">
            {addresses.map((item) => {
              const checked = selectedAddress?.id === item.id;
              return (
                <label
                  key={item.id}
                  className={`block cursor-pointer rounded-2xl border p-4 transition ${
                    checked ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500"
                      checked={checked}
                      onChange={() => setSelectedAddressId(item.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-slate-900">
                        <span className="font-black">{item.recipientName}</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-semibold">{item.phone}</span>
                        {item.isDefault ? (
                          <span className="rounded border border-brand-300 px-2 py-0.5 text-xs font-bold text-brand-700">Mặc định</span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.addressLine}</p>
                    </div>
                  </div>
                </label>
              );
            })}
            {!addresses.length ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Bạn chưa có địa chỉ nào được lưu. Hãy thêm địa chỉ mới bên dưới để tiếp tục thanh toán.
              </div>
            ) : null}
          </div>

          {!showAddressForm ? (
            <button
              type="button"
              onClick={() => {
                resetAddressForm();
                setShowAddressForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Plus size={16} />
              Thêm địa chỉ mới
            </button>
          ) : (
            <form onSubmit={submitCheckoutAddress} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900">Thêm địa chỉ nhận hàng</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Địa chỉ này sẽ được lưu vào sổ địa chỉ để dùng cho các lần thanh toán sau.
                  </p>
                </div>
                {addresses.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setAddressErrors({});
                    }}
                    className="text-sm font-bold text-slate-500 hover:text-slate-800"
                  >
                    Ẩn form
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Người nhận"
                  value={addressForm.recipientName}
                  error={addressErrors.recipientName}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, recipientName: event.target.value }))
                  }
                  placeholder="Tên người nhận"
                />
                <Input
                  label="Số điện thoại"
                  value={addressForm.phone}
                  error={addressErrors.phone}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="Ví dụ: 0348932044"
                />
                <div className="md:col-span-2">
                  <AddressSelector
                    compact
                    onAddressChange={(info) => {
                      setAddressForm((prev) => ({ ...prev, addressLine: info.fullAddress || "" }));
                    }}
                  />
                  {addressErrors.addressLine ? (
                    <p className="mt-2 text-sm font-medium text-rose-600">{addressErrors.addressLine}</p>
                  ) : null}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault || addresses.length === 0}
                    disabled={addresses.length === 0}
                    onChange={(event) =>
                      setAddressForm((prev) => ({ ...prev, isDefault: event.target.checked }))
                    }
                  />
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              <div className="mt-5 flex justify-end">
                <Button type="submit" loading={addressSaving}>
                  Lưu địa chỉ
                </Button>
              </div>
            </form>
          )}

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button type="button" onClick={() => setShowAddressModal(false)} disabled={!selectedAddress}>
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>

      <VnpayQrModal
        isOpen={showVnpayQrModal}
        onClose={async () => {
          setShowVnpayQrModal(false);
          if (vnpaySession?.orderId) {
            try {
              await orderService.updateOrderStatus(vnpaySession.orderId, "CANCELLED");
              toast.info("Đã hủy đơn hàng (chưa thanh toán).");
            } catch (err) {
              console.error("Lỗi khi hủy đơn hàng:", err);
            }
          }
        }}
        paymentSession={vnpaySession}
        loading={loading}
        onRefresh={createVnpaySession}
        onPaid={() => {
          // Đơn hàng đã tạo trước khi hiện QR, polling sẽ tự chuyển trang khi PAID.
          // Nút này cho trường hợp user muốn tự xác nhận — chỉ cần đóng modal.
          setShowVnpayQrModal(false);
          navigate("/orders");
        }}
      />

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
            const category = (v.category || "DISCOUNT").toUpperCase();
            const catConfig = CATEGORY_MAP[category] || CATEGORY_MAP.DISCOUNT;
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
