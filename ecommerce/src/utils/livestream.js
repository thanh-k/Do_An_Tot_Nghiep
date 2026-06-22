const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export function buildLivestreamWsUrl(livestreamId, role) {
  const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${base.replace(/^http/, "ws")}/ws/livestream/${livestreamId}?role=${role}`;
}

export function formatVnd(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " ₫";
}

export function isLiveDealUsable(deal, now = Date.now()) {
  if (!deal?.active) return false;
  const endRaw = deal.endsAt || deal.endedAt || deal.expireAt;
  const startRaw = deal.startsAt || deal.startedAt;
  const endTime = endRaw ? new Date(endRaw).getTime() : 0;
  const startTime = startRaw ? new Date(startRaw).getTime() : 0;
  const quantityLimit = Number(deal.quantityLimit || 0);
  const quantitySold = Number(deal.quantitySold || 0);
  if (startTime && startTime > now) return false;
  if (endTime && endTime <= now) return false;
  if (quantityLimit > 0 && quantitySold >= quantityLimit) return false;
  return true;
}

export function getDealForProduct(livestream, productId, now = Date.now()) {
  return livestream?.activeDeals?.find(
    (deal) => Number(deal.productId) === Number(productId) && isLiveDealUsable(deal, now),
  );
}

export function withLiveDealVariant(product, deal, livestreamId) {
  const baseVariant = Array.isArray(product.variants) && product.variants.length
    ? product.variants[0]
    : {
        // Phải dùng variantId thật từ BE, không tạo id ảo dạng live-{productId}
        id: product.variantId,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock || 99,
        attributes: {},
        images: [product.thumbnail].filter(Boolean),
      };

  const liveVariant = {
    ...baseVariant,
    id: product.variantId || baseVariant.id,
    price: deal?.dealPrice || baseVariant.price || product.price,
    compareAtPrice: deal?.originalPrice || baseVariant.compareAtPrice || product.compareAtPrice,
    liveDealId: deal?.id || null,
    livestreamId: livestreamId || null,
    isLivestreamDeal: Boolean(deal?.id),
  };

  return {
    ...product,
    variants: [liveVariant],
  };
}
