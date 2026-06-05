import axios from "axios";
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/products`;

export const userProductService = {
  async getProducts(filters = {}) {
    try {
      let products = await fetchAllProducts();

      if (filters.category) {
        products = products.filter(
          (p) => String(p.category?.id) === String(filters.category),
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
          const price = p.variants?.[0]?.price || 0;
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

      if (filters.colors?.length > 0)
        products = products.filter((p) =>
          checkVariantAttr(p, filters.colors, "color"),
        );
      if (filters.storages?.length > 0)
        products = products.filter((p) =>
          checkVariantAttr(p, filters.storages, "storage"),
        );
      if (filters.rams?.length > 0)
        products = products.filter((p) =>
          checkVariantAttr(p, filters.rams, "ram"),
        );
      if (filters.ssds?.length > 0)
        products = products.filter((p) =>
          checkVariantAttr(p, filters.ssds, "ssd"),
        );

      // Lọc theo trạng thái còn hàng (ít nhất 1 biến thể có stock > 0)
      if (filters.inStock) {
        products = products.filter((p) =>
          p.variants?.some((variant) => Number(variant.stock || 0) > 0),
        );
      }

      const searchQuery = filters.search || filters.q || filters.keyword;
      if (searchQuery) {
        const keyword = searchQuery.toLowerCase().trim();
        const removeAccents = (str) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D') : '';
        const cleanKeyword = removeAccents(keyword);

        products = products.filter(
          (p) => {
            const name = p.name ? p.name.toLowerCase() : "";
            return name.includes(keyword) || removeAccents(name).includes(cleanKeyword) || (p.slug && p.slug.includes(cleanKeyword));
          }
        );
      }

      // BƯỚC 4: Xử lý SẮP XẾP (Sort)
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
              const getDiscount = (p) =>
                p.variants?.[0]?.compareAtPrice > p.variants?.[0]?.price
                  ? p.variants[0].compareAtPrice - p.variants[0].price
                  : 0;
              return getDiscount(b) - getDiscount(a);
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

        allProducts = allProducts.filter(p => {
          const name = p.name ? p.name.toLowerCase() : "";
          const cleanName = removeAccents(name);
          return name.includes(searchKw) || cleanName.includes(cleanSearchKw) || (p.slug && p.slug.includes(cleanSearchKw));
        });
      }

      allProducts.sort((a, b) => b.id - a.id);

      let items = allProducts;

      // Ép kiểu JSON cho các chuỗi cấu hình để UI render không bị lỗi
      items = items.map((product) => {
        if (product.specifications && typeof product.specifications === "string") {
          try { product.specifications = JSON.parse(product.specifications); }
          catch (e) { product.specifications = {}; }
        }
        if (product.variants && Array.isArray(product.variants)) {
          product.variants = product.variants.map((v) => {
            if (v.attributes && typeof v.attributes === "string") {
              try { v.attributes = JSON.parse(v.attributes); } catch (e) { }
            }
            return v;
          });
        }
        return product;
      });

      const total = allProducts.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const startIndex = (page - 1) * pageSize;
      const paginatedItems = items.slice(startIndex, startIndex + pageSize);

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

  // Hàm lấy dữ liệu cho Trang Chủ (HomePage)
  async getHomeCollections() {
    try {
      const allProducts = await fetchAllProducts();

      const featured = allProducts
        .filter((p) => p.isFeatured === true || Number(p.featured) === 1)
        .slice(0, 8);

      const newest = [...allProducts]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
          const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
          if (dateA !== dateB) return dateB - dateA;
          return Number(b.id || 0) - Number(a.id || 0);
        })
        .slice(0, 8);

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
      // Lấy danh sách thương hiệu THẬT từ Backend
      const brandRes = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/brands`
      );
      const brandNames = brandRes.result
        ? brandRes.result.map((b) => b.name)
        : [];

      // Trả về dạng mảng String trơn để FilterSidebar của bạn map() không bị lỗi Object
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
      formData.append("k", String(k));

      const baseUrl = import.meta.env.VITE_API_BASE_URL
        .replace("/api/v1", "");
      const visionUrl = import.meta.env.DEV
        ? "http://localhost:8001"
        : `${baseUrl}/vision`;

      const visionRes = await fetch(`${visionUrl}/search`, {
        method: "POST",
        body: formData,
      });

      if (!visionRes.ok) throw new Error("Vision service lỗi");

      const visionData = await visionRes.json();
      const productIds = visionData.product_ids || [];

      if (productIds.length === 0) {
        return { label: "Không tìm thấy sản phẩm tương đồng", items: [] };
      }

      const products = await apiClient.request(`${API_URL}/batch`, {
        method: "POST",
        body: JSON.stringify(productIds),
      });

      const normalizedProducts = normalizeProducts(products);

      return {
        label: `Tìm thấy ${normalizedProducts.length} sản phẩm tương tự`,
        items: normalizedProducts,
      };
    } catch (error) {
      console.error("Lỗi khi tìm kiếm bằng hình ảnh:", error);
      throw error;
    }
  },
};

export default userProductService;
