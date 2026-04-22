import { ArrowRight, Trash2, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import QuantitySelector from "@/components/common/QuantitySelector";
import useCart from "@/hooks/useCart";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProductVariantSelector from "@/components/product/ProductVariantSelector";
import userProductService from "@/services/user/productService";
import {
  findVariantByAttributes,
  findBestVariantForSelection,
  getDefaultVariant,
} from "@/utils/product";
import { formatCurrency } from "@/utils/format";

// Hàm format chuỗi hiển thị biến thể rõ ràng cho Giỏ Hàng
const formatCartVariant = (item) => {
  let attrs = item.attributes || {};
  if (typeof attrs === "string") {
    try {
      attrs = JSON.parse(attrs);
    } catch (e) {
      attrs = {};
    }
  }

  const color = attrs.color || item.color;
  const storage = attrs.storage || item.storage;
  const ram = attrs.ram || item.ram;
  const ssd = attrs.ssd || item.ssd;

  const parts = [];
  if (color) parts.push(`Màu: ${color}`);
  if (storage) parts.push(`Dung lượng: ${storage}`);
  if (ram) parts.push(`RAM: ${ram}`);
  if (ssd) parts.push(`SSD: ${ssd}`);

  if (parts.length > 0) return parts.join(" / ");

  // Fallback: Cố gắng bóc tách từ chuỗi variantLabel cũ nếu thiếu thuộc tính
  if (item.variantLabel && item.variantLabel !== "Mặc định") {
    const labels = item.variantLabel.split(" / ");
    const formatted = [];
    if (labels[0]) formatted.push(`Màu: ${labels[0]}`);
    if (labels[1]) formatted.push(`Dung lượng: ${labels[1]}`);
    if (labels[2]) formatted.push(`RAM: ${labels[2]}`);
    if (labels[3]) formatted.push(`SSD: ${labels[3]}`);
    if (formatted.length > 0) return formatted.join(" / ");
  }

  return item.variantLabel || "Mặc định";
};

// Helper parse thuộc tính an toàn cho Modal
const getAttributeValue = (variant, key) => {
  if (!variant) return "";
  let attrs = variant.attributes;
  if (typeof attrs === "string") {
    try {
      attrs = JSON.parse(attrs);
    } catch (e) {
      attrs = {};
    }
  }
  return String(attrs?.[key] ?? variant?.[key] ?? "").trim();
};

const buildSelectedAttributesFromVariant = (variant) => ({
  color: getAttributeValue(variant, "color"),
  storage: getAttributeValue(variant, "storage"),
  ram: getAttributeValue(variant, "ram"),
  ssd: getAttributeValue(variant, "ssd"),
});

function CartPage() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, addToCart } = useCart();
  const [selectedIds, setSelectedIds] = useState([]);

  // --- STATE CHO MODAL ĐỔI BIẾN THỂ ---
  const [variantModal, setVariantModal] = useState({ open: false, item: null });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalVariant, setModalVariant] = useState(null);
  const [modalAttributes, setModalAttributes] = useState({});

  // Tự động chọn tất cả sản phẩm khi lần đầu vào giỏ hàng và đồng bộ khi xóa
  useEffect(() => {
    if (cartItems.length > 0 && selectedIds.length === 0) {
      setSelectedIds(cartItems.map((item) => item.id));
    } else {
      setSelectedIds((prev) =>
        prev.filter((id) => cartItems.some((item) => item.id === id)),
      );
    }
  }, [cartItems.length]);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(cartItems.map((item) => item.id));
    else setSelectedIds([]);
  };

  const handleSelectItem = (id, checked) => {
    if (checked) setSelectedIds((prev) => [...prev, id]);
    else setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
  };

  const selectedSubtotal = cartItems
    .filter((item) => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const isAllSelected =
    cartItems.length > 0 && selectedIds.length === cartItems.length;

  const handleCheckout = () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
      return;
    }
    // Chuyển hướng kèm theo danh sách ID đã chọn
    navigate("/checkout", { state: { selectedIds } });
  };

  // --- LOGIC XỬ LÝ MODAL ĐỔI BIẾN THỂ ---
  const handleOpenVariantModal = async (item) => {
    setVariantModal({ open: true, item });
    setModalLoading(true);
    try {
      // Gọi API lấy thông tin full của sản phẩm (chứa tất cả variants)
      const product = await userProductService.getProductBySlug(item.slug);
      setModalProduct(product);

      // Tìm biến thể hiện tại đang nằm trong giỏ
      const currentVariant =
        product.variants.find((v) => v.id === item.variantId) ||
        product.variants[0];
      setModalVariant(currentVariant);
      setModalAttributes(buildSelectedAttributesFromVariant(currentVariant));
    } catch (error) {
      toast.error("Không thể tải thông tin sản phẩm");
      setVariantModal({ open: false, item: null });
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalAttributeChange = (attribute, value) => {
    if (!modalProduct) return;
    const nextSelection = { ...modalAttributes, [attribute]: value };
    const matchedVariant =
      findVariantByAttributes(modalProduct.variants, nextSelection) ||
      findBestVariantForSelection(
        modalProduct.variants,
        nextSelection,
        attribute,
      ) ||
      getDefaultVariant(modalProduct);
    if (matchedVariant) {
      setModalAttributes(buildSelectedAttributesFromVariant(matchedVariant));
      setModalVariant(matchedVariant);
    } else {
      setModalAttributes(nextSelection);
    }
  };

  const handleConfirmVariantChange = () => {
    if (!modalVariant || modalVariant.stock <= 0)
      return toast.error("Biến thể này đã hết hàng!");
    if (modalVariant.id === variantModal.item.variantId)
      return setVariantModal({ open: false, item: null }); // Không đổi gì

    removeFromCart(variantModal.item.id); // Xóa đồ cũ
    addToCart(modalProduct, modalVariant, variantModal.item.quantity); // Thêm đồ mới vào với SL giữ nguyên
    toast.success("Cập nhật phân loại thành công");
    setVariantModal({ open: false, item: null });
  };

  return (
    <div className="container-padded py-8">
      <PageHeader
        title="Giỏ hàng của bạn"
        description="Sản phẩm tuyệt vời đang chờ bạn! Hoàn tất thanh toán ngay để hưởng ưu đãi Miễn phí vận chuyển và cam kết bảo hành chính hãng 100% từ hệ thống của chúng tôi."
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
            {/* Nút Chọn Tất Cả */}
            <div className="card flex items-center justify-between p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="h-5 w-5 cursor-pointer rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-slate-800">
                  Chọn tất cả ({cartItems.length} sản phẩm)
                </span>
              </label>
            </div>

            {cartItems.map((item) => (
              <div
                key={item.id}
                className="card flex flex-col gap-4 p-5 sm:flex-row"
              >
                <div className="flex items-center gap-4 sm:items-start">
                  <div className="flex h-32 items-center sm:h-auto sm:pt-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) =>
                        handleSelectItem(item.id, e.target.checked)
                      }
                      className="h-5 w-5 cursor-pointer rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                  </div>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-32 w-28 sm:w-36 flex-shrink-0 rounded-2xl object-contain p-3 bg-slate-100"
                  />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Link
                        to={`/products/${item.slug}`}
                        className="text-lg font-semibold text-slate-900 transition hover:text-brand-600"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-2 inline-block">
                        <button
                          onClick={() => handleOpenVariantModal(item)}
                          className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 border border-slate-100"
                        >
                          <span>Phân loại: {formatCartVariant(item)}</span>
                          <ChevronDown size={14} />
                        </button>
                      </div>
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
                <span className="text-slate-500">
                  Tạm tính ({selectedIds.length} sản phẩm)
                </span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(selectedSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Phí vận chuyển</span>
                <span className="font-semibold text-emerald-600">Miễn phí</span>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-900">
                    Thành tiền
                  </span>
                  <span className="text-2xl font-bold text-brand-700">
                    {formatCurrency(selectedSubtotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <button
                onClick={handleCheckout}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition ${
                  selectedIds.length > 0
                    ? "bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200"
                    : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                Tiến hành thanh toán
                <ArrowRight size={16} />
              </button>
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

      {/* --- MODAL ĐỔI BIẾN THỂ --- */}
      <Modal
        isOpen={variantModal.open}
        onClose={() => setVariantModal({ open: false, item: null })}
        title="Chọn phân loại hàng"
        size="md"
      >
        {modalLoading ? (
          <LoadingSpinner label="Đang kết nối để lấy thông tin..." />
        ) : modalProduct && modalVariant ? (
          <div className="space-y-6">
            <div className="flex gap-4 border-b border-slate-100 pb-6">
              <img
                src={modalVariant.image || modalProduct.thumbnail}
                className="w-24 h-24 rounded-2xl object-contain bg-slate-50 p-2 border border-slate-100"
              />
              <div className="flex flex-col justify-end pb-2">
                <p className="text-2xl font-bold text-brand-700">
                  {formatCurrency(modalVariant.price)}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Kho:{" "}
                  {modalVariant.stock > 0 ? (
                    modalVariant.stock
                  ) : (
                    <span className="text-rose-500">Hết hàng</span>
                  )}
                </p>
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto no-scrollbar">
              <ProductVariantSelector
                variants={modalProduct.variants}
                selectedAttributes={modalAttributes}
                onChange={handleModalAttributeChange}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => setVariantModal({ open: false, item: null })}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmVariantChange}
                disabled={modalVariant.stock <= 0}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default CartPage;
