import { useEffect, useMemo, useState } from "react";
import { Heart, ShoppingCart, Truck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Breadcrumb from "@/components/common/Breadcrumb";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import QuantitySelector from "@/components/common/QuantitySelector";
import Rating from "@/components/common/Rating";
import ProductGallery from "@/components/product/ProductGallery";
import ProductGrid from "@/components/product/ProductGrid";
import ProductVariantSelector from "@/components/product/ProductVariantSelector";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import productService from "@/services/productService";
import { formatCurrency } from "@/utils/format";
import {
  buildVariantLabel,
  findVariantByAttributes,
  getDefaultVariant,
} from "@/utils/product";

function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setLoading(true);
    productService
      .getProductBySlug(slug)
      .then((product) => {
        setProductData(product);
        const defaultVariant = getDefaultVariant(product);
        setSelectedAttributes(defaultVariant?.attributes || {});
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const selectedVariant = useMemo(() => {
    if (!productData) return null;
    return (
      findVariantByAttributes(productData.variants, selectedAttributes) ||
      getDefaultVariant(productData)
    );
  }, [productData, selectedAttributes]);

  const displayImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : productData?.images || [];

  const handleAttributeChange = (attribute, value) => {
    if (!productData) return;

    const draft = {
      ...selectedAttributes,
      [attribute]: value,
    };

    const exact = findVariantByAttributes(productData.variants, draft);

    if (exact) {
      setSelectedAttributes(exact.attributes);
      return;
    }

    const partial = productData.variants.find(
      (variant) =>
        variant.attributes?.[attribute] === value &&
        Object.entries(draft).every(([key, selected]) => {
          if (key === attribute || !selected) return true;
          return variant.attributes?.[key] === selected;
        })
    );

    if (partial) {
      setSelectedAttributes(partial.attributes);
      return;
    }

    setSelectedAttributes(draft);
  };

  if (loading) {
    return <LoadingSpinner label="Đang tải chi tiết sản phẩm..." />;
  }

  if (!productData || !selectedVariant) {
    return (
      <div className="container-padded py-10">
        <div className="card p-10 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Không tìm thấy sản phẩm
          </h2>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(productData, selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    addToCart(productData, selectedVariant, quantity);
    navigate("/checkout");
  };

  return (
    <div className="container-padded space-y-12 py-8">
      <Breadcrumb
        items={[
          { label: "Trang chủ", to: "/" },
          { label: "Sản phẩm", to: "/products" },
          {
            label: productData.category?.name || "Danh mục",
            to: `/products?category=${productData.categoryId}`,
          },
          { label: productData.name },
        ]}
      />

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <ProductGallery images={displayImages} />

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {productData.isNew ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                  Mới
                </span>
              ) : null}
              {productData.isFeatured ? (
                <span className="rounded-full bg-brand-100 px-3 py-1 font-semibold text-brand-700">
                  Nổi bật
                </span>
              ) : null}
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                {productData.brand}
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                {productData.name}
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
                {productData.shortDescription}
              </p>
            </div>

            <Rating value={productData.rating} reviewCount={productData.reviewCount} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-end gap-4">
              <span className="text-3xl font-bold text-brand-700">
                {formatCurrency(selectedVariant.price)}
              </span>
              {selectedVariant.compareAtPrice > selectedVariant.price ? (
                <span className="text-lg text-slate-400 line-through">
                  {formatCurrency(selectedVariant.compareAtPrice)}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Biến thể hiện tại:{" "}
              <span className="font-semibold text-slate-700">
                {buildVariantLabel(selectedVariant)}
              </span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Tồn kho:{" "}
              <span
                className={`font-semibold ${
                  selectedVariant.stock > 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {selectedVariant.stock > 0
                  ? `${selectedVariant.stock} sản phẩm`
                  : "Hết hàng"}
              </span>
            </p>
          </div>

          <ProductVariantSelector
            variants={productData.variants}
            selectedAttributes={selectedAttributes}
            onChange={handleAttributeChange}
          />

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-semibold text-slate-900">Số lượng</span>
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                max={selectedVariant.stock || 1}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                fullWidth
                onClick={handleAddToCart}
                disabled={!selectedVariant.stock}
              >
                <ShoppingCart size={18} />
                Thêm vào giỏ
              </Button>
              <Button
                fullWidth
                variant="outline"
                onClick={() => toggleWishlist(productData)}
              >
                <Heart
                  size={18}
                  className={isInWishlist(productData.id) ? "fill-rose-500 text-rose-500" : ""}
                />
                {isInWishlist(productData.id) ? "Đã yêu thích" : "Thêm vào wishlist"}
              </Button>
            </div>

            <Button
              fullWidth
              variant="secondary"
              onClick={handleBuyNow}
              disabled={!selectedVariant.stock}
            >
              Mua ngay
            </Button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                <Truck size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Vận chuyển & hỗ trợ
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Giao nhanh nội thành, đổi trả 15 ngày và bảo hành chính hãng.
                  Phần logic hiện được mô phỏng ở frontend để thuận tiện demo UX.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_340px]">
        <div className="card p-6">
          <h2 className="text-2xl font-bold text-slate-900">Mô tả sản phẩm</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            {productData.description}
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900">Thông số kỹ thuật</h2>
          <div className="mt-5 space-y-3">
            {Object.entries(productData.specifications || {}).map(([key, value]) => (
              <div
                key={key}
                className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
              >
                <span className="text-sm text-slate-500">{key}</span>
                <span className="text-right text-sm font-semibold text-slate-800">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Sản phẩm liên quan</h2>
        <ProductGrid products={productData.relatedProducts} />
      </section>
    </div>
  );
}

export default ProductDetailPage;
