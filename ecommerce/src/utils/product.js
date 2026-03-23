export const getDefaultVariant = (product) => product?.variants?.[0] || null;

export const getVariantAttributeKeys = (variants = []) => {
  const keys = new Set();
  variants.forEach((variant) => {
    Object.keys(variant.attributes || {}).forEach((key) => keys.add(key));
  });
  return [...keys];
};

export const getVariantOptions = (variants = []) => {
  const options = {};
  variants.forEach((variant) => {
    Object.entries(variant.attributes || {}).forEach(([key, value]) => {
      if (!options[key]) options[key] = new Set();
      options[key].add(value);
    });
  });
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => [key, [...value]])
  );
};

export const findVariantByAttributes = (variants = [], selectedAttributes = {}) =>
  variants.find((variant) =>
    Object.entries(selectedAttributes).every(
      ([key, value]) => variant.attributes?.[key] === value
    )
  );

export const buildVariantLabel = (variant) =>
  Object.values(variant?.attributes || {}).filter(Boolean).join(" / ");

export const getStartingPrice = (product) => {
  const prices = product?.variants?.map((item) => item.price) || [];
  if (!prices.length) return product?.salePrice || product?.price || 0;
  return Math.min(...prices);
};

export const getCompareAtPrice = (product) => {
  const prices =
    product?.variants
      ?.map((item) => item.compareAtPrice)
      .filter(Boolean) || [];
  if (!prices.length) return product?.price || 0;
  return Math.max(...prices);
};

export const getProductStock = (product) =>
  product?.variants?.reduce((sum, item) => sum + (item.stock || 0), 0) ||
  product?.stock ||
  0;

export const isProductInStock = (product) => getProductStock(product) > 0;

export const getProductPrimaryImage = (product) =>
  product?.thumbnail || product?.images?.[0] || product?.variants?.[0]?.images?.[0] || "";
