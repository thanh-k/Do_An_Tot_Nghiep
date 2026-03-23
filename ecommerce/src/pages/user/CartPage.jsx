import { ArrowRight, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import QuantitySelector from "@/components/common/QuantitySelector";
import Button from "@/components/common/Button";
import useCart from "@/hooks/useCart";
import { formatCurrency } from "@/utils/format";

function CartPage() {
  const navigate = useNavigate();
  const { cartItems, subtotal, updateQuantity, removeFromCart } = useCart();

  return (
    <div className="container-padded py-8">
      <PageHeader
        title="Giỏ hàng của bạn"
        description="Giỏ hàng được lưu bằng localStorage để mô phỏng trải nghiệm mua sắm liên tục."
      />

      {!cartItems.length ? (
        <EmptyState
          title="Giỏ hàng đang trống"
          description="Hãy thêm sản phẩm vào giỏ để bắt đầu quy trình checkout."
          actionLabel="Khám phá sản phẩm"
          onAction={() => navigate("/products")}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="card flex flex-col gap-4 p-5 sm:flex-row">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-32 w-full rounded-2xl object-cover sm:w-36"
                />

                <div className="flex-1 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Link
                        to={`/products/${item.slug}`}
                        className="text-lg font-semibold text-slate-900 transition hover:text-brand-600"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">{item.variantLabel}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-rose-600"
                    >
                      <Trash2 size={16} />
                      Xoá
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <QuantitySelector
                      value={item.quantity}
                      max={item.maxStock}
                      onChange={(value) => updateQuantity(item.id, value)}
                    />
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Đơn giá</p>
                      <p className="text-xl font-bold text-brand-700">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="card h-fit p-6">
            <h2 className="text-xl font-bold text-slate-900">Tổng đơn hàng</h2>
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tạm tính</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Phí vận chuyển</span>
                <span className="font-semibold text-emerald-600">Miễn phí</span>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-900">Thành tiền</span>
                  <span className="text-2xl font-bold text-brand-700">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <Link
                to="/checkout"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Tiến hành thanh toán
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/products"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-brand-500 hover:text-brand-600"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default CartPage;
