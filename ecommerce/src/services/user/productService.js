import apiClient from "@/services/apiClient";

const API_URL = "/products";

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result?.content)) return data.result.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
}

function unwrapOne(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  if (data?.result) return unwrapOne(data.result);
  if (data?.data) return unwrapOne(data.data);
  if (data?.id || data?.slug || data?.name) return data;
  return null;
}

function removeAccents(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim();
}

function safeParseJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeVariant(variant = {}) {
  return {
    ...variant,
    attributes: safeParseJson(variant.attributes, {}),
  };
}

function normalizeProduct(product) {
  if (!product || typeof product !== "object") return null;

  const variants = Array.isArray(product.variants)
    ? product.variants.map(normalizeVariant)
    : [];

  const specifications =
    product.specifications && typeof product.specifications === "string"
      ? safeParseJson(product.specifications, {})
      : product.specifications || {};

  return {
    ...product,
    specifications,
    variants,
  };
}

function normalizeProducts(products = []) {
  return unwrapList(products).map(normalizeProduct).filter(Boolean);
}

function getProductPrice(product) {
  return Number(product?.variants?.[0]?.price || product?.price || 0);
}

function getCompareAtPrice(product) {
  return Number(
    product?.variants?.[0]?.compareAtPrice ||
    product?.compareAtPrice ||
    product?.compare_at_price ||
    0,
  );
}

function matchesSlug(product, slug) {
  const target = removeAccents(slug);
  const productSlug = removeAccents(product?.slug || "");
  const productNameSlug = removeAccents(product?.name || "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return productSlug === target || productNameSlug === target;
}

async function fetchAllProducts() {
  const response = await apiClient.request(API_URL);
  return normalizeProducts(response);
}

export const userProductService = {
  async getProducts(filters = {}) {
    try {
      let products = await fetchAllProducts();

      if (filters.category) {
        products = products.filter(
          (p) =>
            String(p.category?.id || p.categoryId) === String(filters.category),
        );
      }

      if (filters.brands && filters.brands.length > 0) {
        products = products.filter((p) =>
          filters.brands.includes(p.brand?.name || p.brandName),
        );
      }

      if (
        filters.minPrice !== undefined &&
        filters.minPrice !== "" &&
        filters.maxPrice !== undefined &&
        filters.maxPrice !== ""
      ) {
        products = products.filter((p) => {
          const price = getProductPrice(p);
          return (
            price >= Number(filters.minPrice) &&
            price <= Number(filters.maxPrice)
          );
        });
      }

      const checkVariantAttr = (product, filterValues, attrKey) => {
        if (!filterValues || filterValues.length === 0) return true;
        return product.variants?.some((variant) => {
          const attrs = variant.attributes || {};
          return filterValues.includes(attrs[attrKey] || variant[attrKey]);
        });
      };

      if (filters.colors?.length > 0) {
        products = products.filter((p) =>
          checkVariantAttr(p, filters.colors, "color"),
        );
      }

      if (filters.storages?.length > 0) {
        products = products.filter((p) =>
          checkVariantAttr(p, filters.storages, "storage"),
        );
      }

      if (filters.rams?.length > 0) {
        products = products.filter((p) =>
          checkVariantAttr(p, filters.rams, "ram"),
        );
      }

      if (filters.ssds?.length > 0) {
        products = products.filter((p) =>
          checkVariantAttr(p, filters.ssds, "ssd"),
        );
      }

      if (filters.inStock) {
        products = products.filter((p) =>
          p.variants?.some((variant) => Number(variant.stock || 0) > 0),
        );
      }

      const searchQuery = filters.search || filters.q || filters.keyword;
      if (searchQuery) {
        const keyword = removeAccents(searchQuery);
        products = products.filter((p) => {
          const name = removeAccents(p.name || "");
          const slug = removeAccents(p.slug || "");
          const brand = removeAccents(p.brand?.name || p.brandName || "");
          const category = removeAccents(
            p.category?.name || p.categoryName || "",
          );

          return (
            name.includes(keyword) ||
            slug.includes(keyword) ||
            brand.includes(keyword) ||
            category.includes(keyword)
          );
        });
      }

      if (filters.sortBy) {
        switch (filters.sortBy) {
          case "price-asc":
            products.sort((a, b) => getProductPrice(a) - getProductPrice(b));
            break;
          case "price-desc":
            products.sort((a, b) => getProductPrice(b) - getProductPrice(a));
            break;
          case "newest":
            products.sort((a, b) => {
              const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
              const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
              if (dateA !== dateB) return dateB - dateA;
              return Number(b.id || 0) - Number(a.id || 0);
            });
            break;
          case "sale":
            products.sort((a, b) => {
              const discountA = Math.max(
                getCompareAtPrice(a) - getProductPrice(a),
                0,
              );
              const discountB = Math.max(
                getCompareAtPrice(b) - getProductPrice(b),
                0,
              );
              return discountB - discountA;
            });
            break;
          default:
            break;
        }
      }

      const page = Number(filters.page) || 1;
      const pageSize = Number(filters.pageSize) || 12;
      const total = products.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const startIndex = (page - 1) * pageSize;
      const paginatedItems = products.slice(startIndex, startIndex + pageSize);

      return {
        items: paginatedItems,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm User:", error);
      return { items: [], total: 0, page: 1, totalPages: 1 };
    }
  },

  async getSearchSuggestions(keyword, limit = 5) {
    try {
      if (!keyword || !keyword.trim()) return [];

      const allProducts = await fetchAllProducts();
      const searchKw = removeAccents(keyword);

      const matchedProducts = allProducts.filter((p) => {
        const name = removeAccents(p.name || "");
        const slug = removeAccents(p.slug || "");
        return name.includes(searchKw) || slug.includes(searchKw);
      });

      matchedProducts.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
      return matchedProducts.slice(0, limit);
    } catch (error) {
      console.error("Lỗi khi lấy gợi ý tìm kiếm:", error);
      return [];
    }
  },

  async searchProducts(keyword, page = 1, pageSize = 12) {
    try {
      let allProducts = await fetchAllProducts();

      if (keyword && keyword.trim()) {
        const searchKw = removeAccents(keyword);

        allProducts = allProducts.filter((p) => {
          const name = removeAccents(p.name || "");
          const slug = removeAccents(p.slug || "");
          const brand = removeAccents(p.brand?.name || p.brandName || "");
          const category = removeAccents(
            p.category?.name || p.categoryName || "",
          );

          return (
            name.includes(searchKw) ||
            slug.includes(searchKw) ||
            brand.includes(searchKw) ||
            category.includes(searchKw)
          );
        });
      }

      allProducts.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

      const total = allProducts.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const startIndex = (page - 1) * pageSize;
      const paginatedItems = allProducts.slice(
        startIndex,
        startIndex + pageSize,
      );

      return {
        items: paginatedItems,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error("Lỗi khi tìm kiếm sản phẩm ở trang Search:", error);
      return { items: [], total: 0, page: 1, totalPages: 1 };
    }
  },

  async getProductBySlug(slug) {
    try {
      let product = null;

      try {
        const response = await apiClient.request(`${API_URL}/slug/${slug}`);
        product = normalizeProduct(unwrapOne(response));
      } catch {
        product = null;
      }

      if (!product) {
        const allProducts = await fetchAllProducts();
        product =
          allProducts.find((item) => matchesSlug(item, slug)) ||
          allProducts.find((item) => String(item.id) === String(slug)) ||
          null;
      }

      if (!product) {
        throw new Error(`Không tìm thấy sản phẩm với slug: ${slug}`);
      }

      try {
        const categoryId = product.category?.id || product.categoryId;

        if (categoryId) {
          const relatedRes = await userProductService.getProducts({
            category: categoryId,
            pageSize: 5,
          });

          product.relatedProducts = (relatedRes.items || [])
            .filter((item) => Number(item.id) !== Number(product.id))
            .slice(0, 4);
        } else {
          product.relatedProducts = [];
        }
      } catch {
        product.relatedProducts = [];
      }

      return product;
    } catch (error) {
      console.error(`Lỗi lấy chi tiết sản phẩm ${slug}:`, error);
      throw error;
    }
  },

  async getProductsByIds(ids) {
    try {
      if (!ids || ids.length === 0) return [];
      const response = await apiClient.request(`${API_URL}/batch`, {
        method: "POST",
        body: JSON.stringify(ids),
      });
      return normalizeProducts(response);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm batch:", error);
      return [];
    }
  },

  async getHomeCollections() {
    try {
      const allProducts = await fetchAllProducts();

      const featured = allProducts
        .filter((p) => p.isFeatured === true || Number(p.featured) === 1)
        .slice(0, 8);

      const newProducts = allProducts.filter((p) => p.isNew === true);
      const otherProducts = allProducts.filter((p) => p.isNew !== true);

      const sortByDate = (list) => [...list].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return Number(b.id || 0) - Number(a.id || 0);
      });

      const sortedNew = sortByDate(newProducts);
      const sortedOthers = sortByDate(otherProducts);
      const newest = [...sortedNew, ...sortedOthers].slice(0, 8);

      const sale = allProducts
        .filter((p) => getCompareAtPrice(p) > getProductPrice(p))
        .slice(0, 8);

      return {
        featured: featured.length > 0 ? featured : newest,
        newest,
        sale,
      };
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu trang chủ:", error);
      return { featured: [], newest: [], sale: [] };
    }
  },

  async getAvailableFilters() {
    try {
      const products = await fetchAllProducts();

      const brands = [
        ...new Set(
          products.map((p) => p.brand?.name || p.brandName).filter(Boolean),
        ),
      ];

      const valuesFromVariants = (key) => [
        ...new Set(
          products.flatMap((product) =>
            (product.variants || [])
              .map((variant) => variant.attributes?.[key] || variant[key])
              .filter(Boolean),
          ),
        ),
      ];

      return {
        brands,
        colors: valuesFromVariants("color"),
        storages: valuesFromVariants("storage"),
        rams: valuesFromVariants("ram"),
        ssds: valuesFromVariants("ssd"),
      };
    } catch (error) {
      console.error("Lỗi lấy danh sách bộ lọc:", error);
      return { brands: [], colors: [], storages: [], rams: [], ssds: [] };
    }
  },

  async imageSearch(file, k = 10) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/vision/search?limit=${k}`,
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error("Vision service lỗi");

      const data = await res.json();
      const products = data.result || [];

      if (products.length === 0) {
        return { label: "Không tìm thấy sản phẩm tương đồng", items: [] };
      }

      return {
        label: `Tìm thấy ${products.length} sản phẩm tương tự`,
        items: normalizeProducts(products),
      };
    } catch (error) {
      console.error("Lỗi khi tìm kiếm bằng hình ảnh:", error);
      throw error;
    }
  },
};

export default userProductService;