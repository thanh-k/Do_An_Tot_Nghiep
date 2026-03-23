import { createId, getDb, updateDb, simulateDelay } from "@/services/storageService";
import {
  getCompareAtPrice,
  getProductStock,
  getStartingPrice,
} from "@/utils/product";

const normalizeToArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
};

const matchVariantAttribute = (product, attribute, values) => {
  if (!values.length) return true;
  return product.variants?.some((variant) =>
    values.includes(variant.attributes?.[attribute])
  );
};

const matchPrice = (product, minPrice, maxPrice) => {
  const prices =
    product.variants?.map((variant) => variant.price).filter(Boolean) || [];
  const minVariantPrice = prices.length ? Math.min(...prices) : 0;
  const maxVariantPrice = prices.length ? Math.max(...prices) : 0;

  const actualMin = minPrice ? Number(minPrice) : null;
  const actualMax = maxPrice ? Number(maxPrice) : null;

  if (actualMin !== null && maxVariantPrice < actualMin) return false;
  if (actualMax !== null && minVariantPrice > actualMax) return false;
  return true;
};

const sortProducts = (items, sortBy) => {
  const cloned = [...items];

  switch (sortBy) {
    case "price-asc":
      return cloned.sort((a, b) => getStartingPrice(a) - getStartingPrice(b));
    case "price-desc":
      return cloned.sort((a, b) => getStartingPrice(b) - getStartingPrice(a));
    case "rating":
      return cloned.sort((a, b) => b.rating - a.rating);
    case "newest":
      return cloned.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "sale":
      return cloned.sort(
        (a, b) =>
          getCompareAtPrice(b) - getStartingPrice(b) -
          (getCompareAtPrice(a) - getStartingPrice(a))
      );
    default:
      return cloned.sort((a, b) => {
        const scoreA =
          Number(a.isFeatured) * 5 +
          Number(a.isNew) * 3 +
          Number(a.isSale) * 2 +
          a.rating;
        const scoreB =
          Number(b.isFeatured) * 5 +
          Number(b.isNew) * 3 +
          Number(b.isSale) * 2 +
          b.rating;
        return scoreB - scoreA;
      });
  }
};

const enrichProduct = (product, categories) => ({
  ...product,
  category: categories.find((item) => item.id === product.categoryId) || null,
  totalStock: getProductStock(product),
  startingPrice: getStartingPrice(product),
});

export const productService = {
  async getAllProducts() {
    await simulateDelay(250);
    const db = getDb();
    return db.products.map((product) => enrichProduct(product, db.categories));
  },

  async getProducts(filters = {}) {
    await simulateDelay(300);

    const db = getDb();
    const {
      search = "",
      category = "",
      minPrice,
      maxPrice,
      colors,
      storages,
      rams,
      ssds,
      brands,
      inStock,
      sortBy = "featured",
      page = 1,
      pageSize = 8,
    } = filters;

    const searchLower = search.trim().toLowerCase();
    const brandList = normalizeToArray(brands);
    const colorList = normalizeToArray(colors);
    const storageList = normalizeToArray(storages);
    const ramList = normalizeToArray(rams);
    const ssdList = normalizeToArray(ssds);
    const categoryList = normalizeToArray(category);

    let items = db.products.filter((product) => {
      const searchableText = [
        product.name,
        product.brand,
        product.shortDescription,
        product.description,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchLower ||
        searchableText.includes(searchLower) ||
        product.slug.includes(searchLower);

      const matchesCategory =
        !categoryList.length || categoryList.includes(product.categoryId);

      const matchesBrand = !brandList.length || brandList.includes(product.brand);

      const matchesColor = matchVariantAttribute(product, "color", colorList);
      const matchesStorage = matchVariantAttribute(product, "storage", storageList);
      const matchesRam = matchVariantAttribute(product, "ram", ramList);
      const matchesSsd = matchVariantAttribute(product, "ssd", ssdList);
      const matchesPrice = matchPrice(product, minPrice, maxPrice);
      const matchesStock = !inStock || getProductStock(product) > 0;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesColor &&
        matchesStorage &&
        matchesRam &&
        matchesSsd &&
        matchesPrice &&
        matchesStock
      );
    });

    items = sortProducts(items, sortBy).map((product) =>
      enrichProduct(product, db.categories)
    );

    const total = items.length;
    const currentPage = Number(page) || 1;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (currentPage - 1) * pageSize;

    return {
      items: items.slice(start, start + pageSize),
      total,
      page: currentPage,
      totalPages,
      pageSize,
    };
  },

  async getProductBySlug(slug) {
    await simulateDelay(250);
    const db = getDb();
    const product = db.products.find((item) => item.slug === slug);
    if (!product) return null;

    const relatedProducts = db.products
      .filter(
        (item) =>
          item.categoryId === product.categoryId && item.id !== product.id
      )
      .slice(0, 4);

    return {
      ...enrichProduct(product, db.categories),
      relatedProducts: relatedProducts.map((item) =>
        enrichProduct(item, db.categories)
      ),
    };
  },

  async searchProducts(query) {
    return this.getProducts({ search: query, pageSize: 12 });
  },

  async imageSearch(file) {
    await simulateDelay(700);
    const db = getDb();
    const fileName = file?.name?.toLowerCase?.() || "";

    let detectedLabel = "Thiết bị công nghệ";
    let items = db.products;

    if (/(iphone|apple|phone|smartphone)/.test(fileName)) {
      detectedLabel = "Điện thoại / Apple";
      items = db.products.filter(
        (item) => item.categoryId === "cat-phone" || item.brand === "Apple"
      );
    } else if (/(laptop|macbook|notebook|pc)/.test(fileName)) {
      detectedLabel = "Laptop";
      items = db.products.filter((item) => item.categoryId === "cat-laptop");
    } else if (/(tablet|ipad|tab)/.test(fileName)) {
      detectedLabel = "Tablet";
      items = db.products.filter((item) => item.categoryId === "cat-tablet");
    } else if (/(earbud|headphone|mouse|power|charger|accessory)/.test(fileName)) {
      detectedLabel = "Phụ kiện";
      items = db.products.filter((item) => item.categoryId === "cat-accessory");
    } else {
      items = db.products.filter((item) => item.isFeatured).slice(0, 6);
    }

    return {
      label: detectedLabel,
      items: items.slice(0, 8).map((item) => enrichProduct(item, db.categories)),
    };
  },

  async getHomeCollections() {
    await simulateDelay(250);
    const db = getDb();
    return {
      banners: db.banners,
      featured: db.products
        .filter((item) => item.isFeatured)
        .slice(0, 8)
        .map((item) => enrichProduct(item, db.categories)),
      latest: db.products
        .filter((item) => item.isNew)
        .slice(0, 8)
        .map((item) => enrichProduct(item, db.categories)),
      deals: db.products
        .filter((item) => item.isSale)
        .slice(0, 8)
        .map((item) => enrichProduct(item, db.categories)),
    };
  },

  async getAvailableFilters() {
    await simulateDelay(200);
    const db = getDb();

    const collect = (attribute) =>
      [
        ...new Set(
          db.products.flatMap((product) =>
            product.variants
              .map((variant) => variant.attributes?.[attribute])
              .filter(Boolean)
          )
        ),
      ].sort();

    return {
      brands: [...new Set(db.products.map((item) => item.brand))].sort(),
      colors: collect("color"),
      storages: collect("storage"),
      rams: collect("ram"),
      ssds: collect("ssd"),
      categories: db.categories,
    };
  },

  async saveProduct(payload) {
    const db = getDb();
    const now = new Date().toISOString();

    const normalizedProduct = {
      ...payload,
      slug: payload.slug?.trim() || payload.name.toLowerCase().replace(/\s+/g, "-"),
      images: payload.images?.length ? payload.images : [payload.thumbnail].filter(Boolean),
      createdAt: payload.createdAt || now,
      updatedAt: now,
    };

    if (payload.id) {
      const products = db.products.map((product) =>
        product.id === payload.id ? normalizedProduct : product
      );
      await updateDb((current) => ({ ...current, products }));
      return normalizedProduct;
    }

    const created = {
      ...normalizedProduct,
      id: createId("prod"),
      variants: normalizedProduct.variants?.map((variant) => ({
        ...variant,
        id: variant.id || createId("var"),
      })),
    };

    await updateDb((current) => ({
      ...current,
      products: [created, ...current.products],
    }));
    return created;
  },

  async deleteProduct(productId) {
    await updateDb((current) => ({
      ...current,
      products: current.products.filter((item) => item.id !== productId),
    }));
    return true;
  },
};

export default productService;
