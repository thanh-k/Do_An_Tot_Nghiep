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
import RecommendedProducts from "@/components/product/RecommendedProducts";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import userProductService from "@/services/user/productService";
import behaviorService from "@/services/user/behaviorService";
import { formatCurrency } from "@/utils/format";
import {
  findBestVariantForSelection,
  findVariantByAttributes,
  getDefaultVariant,
} from "@/utils/product";
import {
  ATTRIBUTE_OPTIONS,
  CATEGORY_VARIANT_CONFIG,
} from "@/utils/categoryConfig";

import ProductReviews from "@/components/product/ProductReviews";
import productVideoService from "@/services/productVideo/productVideoService";

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const getAttributeValue = (variant, key) => {
  if (!variant) {
    return "";
  }

  let attrs = variant.attributes;
  if (typeof attrs === "string") {
    try {
      attrs = JSON.parse(attrs);
    } catch (e) {
      attrs = {};
    }
  }
  return normalizeValue(attrs?.[key] ?? variant?.[key] ?? "");
};

const buildSelectedAttributesFromVariant = (variant) => {
  const result = {};
  Object.keys(ATTRIBUTE_OPTIONS).forEach((key) => {
    const val = getAttributeValue(variant, key);
    if (val) result[key] = val;
  });
  return result;
};

const formatVariantLabel = (attributes) => {
  if (!attributes || Object.keys(attributes).length === 0) return "Mặc định";
  const parts = [];
  Object.entries(attributes).forEach(([key, value]) => {
    if (value) {
      const label = ATTRIBUTE_OPTIONS[key]?.label || key;
      parts.push(`${label}: ${value}`);
    }
  });
  return parts.join(" / ") || "Mặc định";
};

function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [productVideos, setProductVideos] = useState([]);

  useEffect(() => {
    setLoading(true);
    userProductService
      .getProductBySlug(slug)
      .then((product) => {
        setProductData(product);
        productVideoService
          .getProductVideos(product.id)
          .then(setProductVideos)
          .catch(() => setProductVideos([]));
        behaviorService.track({
          eventType: "VIEW_PRODUCT",
          productId: product.id,
          categoryId: product.category?.id,
          brandId: product.brand?.id,
        });
        const defaultVariant = getDefaultVariant(product);
        setSelectedAttributes(
          buildSelectedAttributesFromVariant(defaultVariant),
        );
        setQuantity(1);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const sellableVariants = useMemo(() => {
    if (!productData?.variants) return [];
    return productData.variants.filter((variant) => Number(variant.stock || 0) > 0);
  }, [productData]);

  const selectedVariant = useMemo(() => {
    if (!productData) return null;

    const variantsForSelection = sellableVariants.length
      ? sellableVariants
      : productData.variants;

    return (
      findVariantByAttributes(variantsForSelection, selectedAttributes) ||
      findBestVariantForSelection(variantsForSelection, selectedAttributes) ||
      getDefaultVariant({ variants: variantsForSelection }) ||
      getDefaultVariant(productData)
    );
  }, [productData, selectedAttributes, sellableVariants]);

  // LOGIC ĐỘNG: Lấy danh sách các thuộc tính cần hiển thị dựa theo Danh mục (Giống hệt Admin)
  const activeAttributes = useMemo(() => {
    if (!productData || !productData.category)
      return [{ key: "color", ...ATTRIBUTE_OPTIONS["color"] }];

    const catSlug =
      productData.category.slug ||
      productData.category.name
        .toLowerCase()
        .replace(/ /g, "-")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d");
    const attributeKeys = CATEGORY_VARIANT_CONFIG[catSlug] ||
      CATEGORY_VARIANT_CONFIG["default"] || ["color"];

    return attributeKeys.map((key) => ({
      key: key,
      ...ATTRIBUTE_OPTIONS[key],
    }));
  }, [productData]);

  // LOGIC ĐỘNG: Lọc ra các giá trị CÓ THẬT của từng thuộc tính từ danh sách biến thể
  const availableOptions = useMemo(() => {
    if (!productData || !productData.variants) return {};

    const sourceVariants = sellableVariants.length
      ? sellableVariants
      : productData.variants;

    const options = {};
    activeAttributes.forEach((attr) => {
      const values = sourceVariants
        .map((v) => getAttributeValue(v, attr.key))
        .filter((val) => val !== "" && val !== null && val !== undefined);
      options[attr.key] = [...new Set(values)];
    });
    return options;
  }, [productData, activeAttributes, sellableVariants]);

  useEffect(() => {
    if (!selectedVariant) {
      return;
    }

    setSelectedAttributes(buildSelectedAttributesFromVariant(selectedVariant));
  }, [selectedVariant?.id]);

  const handleAttributeChange = (attribute, value) => {
    if (!productData) return;

    const nextSelection = {
      ...selectedAttributes,
      [attribute]: normalizeValue(value),
    };

    const variantsForSelection = sellableVariants.length
      ? sellableVariants
      : productData.variants;

    const matchedVariant =
      findVariantByAttributes(variantsForSelection, nextSelection) ||
      findBestVariantForSelection(
        variantsForSelection,
        nextSelection,
        attribute,
      ) ||
      getDefaultVariant({ variants: variantsForSelection }) ||
      getDefaultVariant(productData);

    if (matchedVariant) {
      setSelectedAttributes(buildSelectedAttributesFromVariant(matchedVariant));
      setQuantity(1);
      return;
    }

    setSelectedAttributes(nextSelection);
  };

  // Hàm xử lý đồng bộ ngược: Khi user bấm vào ảnh -> Cập nhật lại Option (Màu, RAM...)
  const handleImageClick = (imageUrl) => {
    if (!productData || !productData.variants) return;

    // Tìm biến thể đầu tiên khớp với ảnh được bấm
    const variantsForSelection = sellableVariants.length
      ? sellableVariants
      : productData.variants;

    const variantWithImage = variantsForSelection.find(
      (v) => v.image === imageUrl,
    );

    // Nếu tìm thấy, lập tức set lại trạng thái lựa chọn và reset số lượng
    if (variantWithImage) {
      setSelectedAttributes(
        buildSelectedAttributesFromVariant(variantWithImage),
      );
      setQuantity(1);
    }
  };


  const handleVideoProductClick = (video) => {
    productVideoService.trackProductClick(video.id).catch(() => {});
  };

  const handleVideoView = (video) => {
    productVideoService.trackView(video.id, 0).catch(() => {});
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
    behaviorService.track({ eventType: "ADD_TO_CART", productId: productData.id });
  };

  const handleBuyNow = () => {
    behaviorService.track({ eventType: "BUY_NOW", productId: productData.id });
    const itemId = `direct_${productData.id}_${selectedVariant.id}`;

    // Truyền trực tiếp dữ liệu sản phẩm sang Checkout để tránh phụ thuộc vào độ trễ của state Giỏ hàng
    const directItem = {
      id: itemId,
      productId: productData.id,
      name: productData.name,
      slug: productData.slug,
      image:
        selectedVariant.images?.[0] ||
        selectedVariant.image ||
        productData.thumbnail,
      variantId: selectedVariant.id,
      variantLabel: formatVariantLabel(selectedAttributes),
      attributes: selectedVariant.attributes,
      quantity: Math.min(quantity, selectedVariant.stock || 1),
      price: selectedVariant.price,
      compareAtPrice: selectedVariant.compareAtPrice,
      maxStock: selectedVariant.stock || 1,
    };

    navigate("/checkout", {
      state: { directItems: [directItem] },
    });
  };

  return (
    <div className="container-padded space-y-12 py-8">
      <Breadcrumb
        items={[
          { label: "Trang chủ", to: "/" },
          { label: "Sản phẩm", to: "/products" },
          {
            label: productData.category?.name || "Danh mục",
            to: `/products?category=${productData.category?.id}`,
          },
          { label: productData.name },
        ]}
      />

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <ProductGallery
          images={productData.images || []}
          videos={productVideos}
          selectedImage={selectedVariant?.image}
          onImageClick={handleImageClick}
          onVideoView={handleVideoView}
        />

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
                {productData.brand?.name || "Khác"}
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

            <Rating
              value={productData.rating}
              reviewCount={productData.reviewCount}
            />
          </div>

          <div className="relative rounded-3xl border border-slate-200 bg-white p-6">
            {/* Nút yêu thích sản phẩm đặt ở góc trên bên phải */}
            <button
              type="button"
              onClick={() => {
                toggleWishlist(productData);
                behaviorService.track({ eventType: "ADD_TO_WISHLIST", productId: productData.id });
              }}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 active:scale-95 shadow-sm"
              aria-label="Yêu thích sản phẩm"
            >
              <Heart
                size={20}
                className={
                  isInWishlist(productData.id)
                    ? "fill-rose-500 text-rose-500"
                    : "text-slate-400"
                }
              />
            </button>

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
                {formatVariantLabel(selectedAttributes)}
              </span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Tồn kho:{" "}
              <span
                className={`font-semibold ${
                  selectedVariant.stock > 0
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {selectedVariant.stock > 0
                  ? `${selectedVariant.stock} sản phẩm`
                  : "Hết hàng"}
              </span>
            </p>
          </div>

          {/* RENDER CÁC NÚT CHỌN BIẾN THỂ ĐỘNG TỪ CONFIG DẠNG CỘT */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100">
            {activeAttributes.map((attr) => {
              const options = availableOptions[attr.key];
              // Nếu thuộc tính này không có biến thể nào dùng tới thì ẩn đi
              if (!options || options.length === 0) return null;

              return (
                <div key={attr.key} className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {attr.label}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {options.map((option) => {
                      const isSelected =
                        selectedAttributes[attr.key] === option;
                      return (
                        <button
                          key={option}
                          onClick={() =>
                            handleAttributeChange(attr.key, option)
                          }
                          className={`rounded-xl border px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all ${
                            isSelected
                              ? "border-brand-600 bg-brand-50 text-brand-700 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-slate-50"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-semibold text-slate-900">
                Số lượng
              </span>
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
                variant="secondary"
                onClick={handleBuyNow}
                disabled={!selectedVariant.stock}
              >
                Mua ngay
              </Button>
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
          <h2 className="text-xl font-bold text-slate-900">
            Thông số kỹ thuật
          </h2>
          <div className="mt-5 space-y-3">
            {Object.entries(productData.specifications || {}).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm text-slate-500">{key}</span>
                  <span className="text-right text-sm font-semibold text-slate-800">
                    {value}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </section>


      {/* THÊM PHẦN ĐÁNH GIÁ VÀO ĐÂY */}
      <section id="review-section">
        <h2 className="text-3xl font-black italic uppercase text-slate-900 border-l-8 border-rose-600 pl-6 mb-12">
          Khách hàng nói về siêu phẩm này
        </h2>
        <ProductReviews productId={productData.id} />
      </section>

      {productData.relatedProducts &&
        productData.relatedProducts.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Sản phẩm liên quan
            </h2>
            <ProductGrid products={productData.relatedProducts} />
          </section>
        )}
    </div>
  );
}

export default ProductDetailPage;
