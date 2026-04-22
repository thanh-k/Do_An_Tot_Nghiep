import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import useAuth from "@/hooks/useAuth";
import useCart from "@/hooks/useCart";
import orderService from "@/services/orderService";
import { PAYMENT_METHOD_OPTIONS } from "@/constants";
import { formatCurrency } from "@/utils/format";

function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { cartItems, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [shipping, setShipping] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    note: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // Lấy ID các sản phẩm được chọn từ Giỏ hàng truyền sang
  const selectedIds = location.state?.selectedIds || [];

  // Chỉ lọc ra các sản phẩm được chọn. Nếu không có id nào (truy cập trực tiếp), fallback về toàn bộ giỏ
  const checkoutItems = useMemo(() => {
    if (selectedIds.length > 0)
      return cartItems.filter((item) => selectedIds.includes(item.id));
    return cartItems;
  }, [cartItems, selectedIds]);

  // Tính lại tổng tiền chỉ cho những sản phẩm được chọn
  const checkoutSubtotal = useMemo(() => {
    return checkoutItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }, [checkoutItems]);

  useEffect(() => {
    if (currentUser) {
      setShipping({
        fullName: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        city: currentUser.city || "",
        address: currentUser.address || "",
        note: "",
      });
    }
  }, [currentUser]);

  const canSubmit = useMemo(
    () =>
      shipping.fullName &&
      shipping.email &&
      shipping.phone &&
      shipping.city &&
      shipping.address &&
      checkoutItems.length > 0,
    [checkoutItems.length, shipping],
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
      await orderService.placeOrder(
        {
          items: checkoutItems, // Gửi đúng danh sách đã chọn đi
          shippingAddress: shipping,
          paymentMethod,
        },
        currentUser,
      );
      clearCart();
      toast.success("Đặt hàng thành công!");
      navigate("/orders");
    } catch (error) {
      toast.error(error.message);
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
              <Input
                label="Tỉnh / Thành phố"
                value={shipping.city}
                onChange={(event) => handleChange("city", event.target.value)}
              />
              <div className="md:col-span-2">
                <Input
                  label="Địa chỉ chi tiết"
                  value={shipping.address}
                  onChange={(event) =>
                    handleChange("address", event.target.value)
                  }
                />
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
              <span className="font-semibold text-emerald-600">Miễn phí</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold text-slate-900">Tổng cộng</span>
              <span className="text-2xl font-bold text-brand-700">
                {formatCurrency(checkoutSubtotal)}
              </span>
            </div>
          </div>

          <Button type="submit" fullWidth className="mt-6" loading={loading}>
            Xác nhận đặt hàng
          </Button>
        </aside>
      </form>
    </div>
  );
}

export default CheckoutPage;
