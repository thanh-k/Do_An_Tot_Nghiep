import axios from "axios";
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/products`;

export const userProductService = {
  // Hàm lấy danh sách sản phẩm có xử lý Lọc, Sắp xếp và Phân trang
  async getProducts(filters = {}) {
    try {
      // BƯỚC 1: Gọi API lấy toàn bộ sản phẩm từ Backend
      // (Vì Backend chưa có API Query Params chuẩn, ta sẽ lấy hết và xử lý tại Frontend cho mượt)
      const response = await axios.get(API_URL);
      let products = response.data.result || [];

      // BƯỚC 2: Xử lý LỌC (Filter) Danh mục, Thương hiệu & Khoảng giá
      if (filters.category) {
        products = products.filter(
          (p) => String(p.category?.id) === String(filters.category),
        );
      }

      if (filters.brands && filters.brands.length > 0) {
        products = products.filter((p) =>
          filters.brands.includes(p.brand?.name),
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

      // --- LỌC NÂNG CAO (Màu sắc, Dung lượng, RAM, SSD, InStock) ---
      const checkVariantAttr = (product, filterValues, attrKey) => {
        if (!filterValues || filterValues.length === 0) return true;
        return product.variants?.some((v) => {
          const attrs =
            typeof v.attributes === "string"
              ? JSON.parse(v.attributes || "{}")
              : v.attributes || {};
          return filterValues.includes(attrs[attrKey] || v[attrKey]);
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
          p.variants?.some((v) => Number(v.stock) > 0),
        );
      }

      // BƯỚC 3: Xử lý TÌM KIẾM (Search)
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
            products.sort((a, b) => {
              const priceA = a.variants?.[0]?.price || 0;
              const priceB = b.variants?.[0]?.price || 0;
              return priceA - priceB;
            });
            break;
          case "price-desc":
            products.sort((a, b) => {
              const priceA = a.variants?.[0]?.price || 0;
              const priceB = b.variants?.[0]?.price || 0;
              return priceB - priceA;
            });
            break;
          case "newest":
            // Sản phẩm có ID lớn hơn là sản phẩm mới tạo
            products.sort((a, b) => b.id - a.id);
            break;
          case "sale":
            // Sắp xếp theo mức giảm giá nhiều nhất
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

      // BƯỚC 5: Xử lý PHÂN TRANG (Pagination)
      const page = Number(filters.page) || 1;
      const pageSize = Number(filters.pageSize) || 9; // 9 sản phẩm 1 trang
      const total = products.length;
      const totalPages = Math.ceil(total / pageSize);

      // Cắt mảng lấy đúng số lượng sản phẩm của trang hiện tại
      const startIndex = (page - 1) * pageSize;
      const paginatedItems = products.slice(startIndex, startIndex + pageSize);

      // Trả về dữ liệu chuẩn cấu trúc mà Component đang chờ
      return {
        items: paginatedItems,
        total: total,
        page: page,
        totalPages: totalPages === 0 ? 1 : totalPages,
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm User:", error);
      throw error;
    }
  },

  // 1. Hàm dành riêng cho Dropdown gợi ý tìm kiếm trên thanh SearchBar
  async getSearchSuggestions(keyword, limit = 5) {
    try {
      if (!keyword || !keyword.trim()) return [];

      const response = await axios.get(API_URL);
      const allProducts = response.data.result || [];

      const searchKw = keyword.toLowerCase().trim();
      const removeAccents = (str) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D') : '';
      const cleanSearchKw = removeAccents(searchKw);

      const matchedProducts = allProducts.filter(p => {
        const name = p.name ? p.name.toLowerCase() : "";
        const cleanName = removeAccents(name);
        return name.includes(searchKw) || cleanName.includes(cleanSearchKw) || (p.slug && p.slug.includes(cleanSearchKw));
      });

      matchedProducts.sort((a, b) => b.id - a.id);
      return matchedProducts.slice(0, limit);
    } catch (error) {
      console.error("Lỗi khi lấy gợi ý tìm kiếm:", error);
      return [];
    }
  },

  // 2. Hàm MỚI ĐỘC LẬP dành riêng cho trang Kết quả tìm kiếm (SearchResultPage)
  async searchProducts(keyword, page = 1, pageSize = 12) {
    try {
      const response = await axios.get(API_URL);
      let allProducts = response.data.result || [];

      if (keyword && keyword.trim()) {
        const searchKw = keyword.toLowerCase().trim();
        const removeAccents = (str) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D') : '';
        const cleanSearchKw = removeAccents(searchKw);

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

      const total = items.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedItems = items.slice(startIndex, startIndex + pageSize);

      return { items: paginatedItems, total, page, totalPages: totalPages === 0 ? 1 : totalPages };
    } catch (error) {
      console.error("Lỗi khi tìm kiếm sản phẩm ở trang Search:", error);
      return { items: [], total: 0, page: 1, totalPages: 1 };
    }
  },

  // Hàm lấy chi tiết một sản phẩm theo Slug
  async getProductBySlug(slug) {
    try {
      const response = await axios.get(`${API_URL}/slug/${slug}`);
      let product = response.data.result;

      // Ép kiểu chuỗi JSON specifications thành Object để UI render được
      if (
        product.specifications &&
        typeof product.specifications === "string"
      ) {
        try {
          product.specifications = JSON.parse(product.specifications);
        } catch (e) {
          product.specifications = {};
        }
      }

      // Ép kiểu chuỗi JSON attributes của từng biến thể thành Object
      if (product.variants && Array.isArray(product.variants)) {
        product.variants = product.variants.map((v) => {
          if (v.attributes && typeof v.attributes === "string") {
            try {
              v.attributes = JSON.parse(v.attributes);
            } catch (e) { }
          }
          return v;
        });
      }

      // Tự động lấy sản phẩm liên quan dựa trên cùng Danh mục
      try {
        const categoryId = product.category?.id || product.categoryId;
        if (categoryId) {
          // Gọi lại hàm getProducts với bộ lọc category
          const relatedRes = await userProductService.getProducts({
            category: categoryId,
            pageSize: 5, // Lấy dư 1 cái phòng trường hợp trùng với sản phẩm đang xem
          });

          // Lọc bỏ sản phẩm hiện tại và lấy tối đa 4 sản phẩm hiển thị
          product.relatedProducts = relatedRes.items
            .filter((p) => p.id !== product.id)
            .slice(0, 4);
        }
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm liên quan:", err);
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
      const response = await axios.get(API_URL);
      const allProducts = response.data.result || [];

      // Lọc ra các danh sách tương ứng (lấy tối đa 8 sản phẩm mỗi bộ sưu tập cho đẹp)
      const featured = allProducts.filter((p) => p.isFeatured).slice(0, 8);
      const newest = allProducts
        .filter((p) => p.isNew)
        .sort((a, b) => b.id - a.id)
        .slice(0, 8);
      const sale = allProducts.filter((p) => p.isSale).slice(0, 8);

      return {
        featured,
        newest,
        sale,
      };
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu trang chủ:", error);
      // Trả về mảng rỗng an toàn để giao diện không bị crash khi dùng vòng lặp .map()
      return { featured: [], newest: [], sale: [] };
    }
  },

  // Hàm lấy danh sách các tuỳ chọn cho Bộ lọc (Filter Sidebar)
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
        brands: brandNames,
        colors: [
          "Đen",
          "Trắng",
          "Titan",
          "Đỏ",
          "Xanh",
          "Vàng",
          "Bạc",
          "Xám",
          "Hồng",
        ],
        storages: ["64GB", "128GB", "256GB", "512GB", "1TB"],
        rams: ["4GB", "8GB", "12GB", "16GB", "32GB", "64GB"],
        ssds: ["256GB", "512GB", "1TB", "2TB"],
      };
    } catch (error) {
      console.error("Lỗi lấy danh sách bộ lọc:", error);
      return { brands: [], colors: [], storages: [], rams: [], ssds: [] };
    }
  },

  // Hàm tìm kiếm bằng hình ảnh (Tích hợp AI)
  async imageSearch(file, k = 10) {
    try {
      // Bước 1: Gửi ảnh sang Vision Service qua Nginx proxy
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

      // Bước 2: Lấy chi tiết sản phẩm từ Java Backend
      const products = await apiClient.request(`${API_URL}/batch`, {
        method: "POST",
        body: JSON.stringify(productIds),
      });

      const normalizedProducts = (Array.isArray(products) ? products : []).map((product) => {
        if (product.specifications && typeof product.specifications === "string") {
          try { product.specifications = JSON.parse(product.specifications); }
          catch { product.specifications = {}; }
        }
        if (product.variants && Array.isArray(product.variants)) {
          product.variants = product.variants.map((v) => {
            if (v.attributes && typeof v.attributes === "string") {
              try { v.attributes = JSON.parse(v.attributes); } catch { }
            }
            return v;
          });
        }
        return product;
      });

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
