const ATTRIBUTE_KEYS = ["color", "storage", "ram", "ssd"];

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

  return normalizeValue(variant?.attributes?.[key] ?? variant?.[key] ?? "");
};

export const getDefaultVariant = (product) => {
  const variants = product?.variants || [];
  if (!variants.length) {
    return null;
  }

  const inStockVariant = variants.find((variant) => Number(variant.stock || 0) > 0);
  return inStockVariant || variants[0];
};

export const getVariantAttributeKeys = (variants = []) =>
  ATTRIBUTE_KEYS.filter((key) =>
    variants.some((variant) => getAttributeValue(variant, key) !== "")
  );

export const getVariantOptions = (variants = []) => {
  const options = {};

  ATTRIBUTE_KEYS.forEach((key) => {
    const values = variants
      .map((variant) => getAttributeValue(variant, key))
      .filter(Boolean);

    if (values.length) {
      options[key] = [...new Set(values)];
    }
  });

  return options;
};

export const findVariantByAttributes = (variants = [], selectedAttributes = {}) =>
  variants.find((variant) =>
    Object.entries(selectedAttributes).every(([key, value]) => {
      if (!normalizeValue(value)) {
        return true;
      }

      return getAttributeValue(variant, key) === normalizeValue(value);
    })
  ) || null;

export const findBestVariantForSelection = (
  variants = [],
  selectedAttributes = {},
  changedAttribute = ""
) => {
  if (!variants.length) {
    return null;
  }

  const scoredVariants = variants.map((variant) => {
    let score = 0;

    Object.entries(selectedAttributes).forEach(([key, value]) => {
      const normalizedSelected = normalizeValue(value);
      if (!normalizedSelected) {
        return;
      }

      const variantValue = getAttributeValue(variant, key);
      if (variantValue === normalizedSelected) {
        score += key === changedAttribute ? 100 : 10;
      }
    });

    if (Number(variant.stock || 0) > 0) {
      score += 1;
    }

    return { variant, score };
  });

  scoredVariants.sort((a, b) => b.score - a.score);
  return scoredVariants[0]?.variant || null;
};

export const buildVariantLabel = (variant) => {
  const parts = ATTRIBUTE_KEYS.map((key) => getAttributeValue(variant, key)).filter(Boolean);
  return parts.length ? parts.join(" / ") : "Phiên bản mặc định";
};

export const getStartingPrice = (product) => {
  const prices = product?.variants?.map((item) => Number(item.price || 0)).filter((price) => price > 0) || [];
  if (!prices.length) {
    return Number(product?.salePrice || product?.price || 0);
  }

  return Math.min(...prices);
};

export const getCompareAtPrice = (product) => {
  const prices = product?.variants?.map((item) => Number(item.compareAtPrice || 0)).filter((price) => price > 0) || [];
  if (!prices.length) {
    return Number(product?.price || 0);
  }

  return Math.max(...prices);
};

export const getProductStock = (product) => {
  const variantStock = product?.variants?.reduce((sum, item) => sum + Number(item.stock || 0), 0) || 0;
  return variantStock || Number(product?.stock || 0);
};

export const isProductInStock = (product) => getProductStock(product) > 0;

export const getProductPrimaryImage = (product) =>
  product?.thumbnail || product?.images?.[0] || product?.variants?.[0]?.images?.[0] || "";
