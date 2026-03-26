import { createId, getDb, updateDb, simulateDelay } from "@/services/storageService";

const defaultCategoryImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#e2e8f0"/>
      <circle cx="600" cy="360" r="180" fill="#94a3b8"/>
      <rect x="280" y="580" width="640" height="60" rx="30" fill="#94a3b8"/>
    </svg>
  `);

export const categoryService = {
  async getCategories() {
    await simulateDelay(180);
    return getDb().categories;
  },

  async saveCategory(payload) {
    const now = new Date().toISOString();
    const normalized = {
      ...payload,
      slug: payload.slug?.trim() || payload.name.toLowerCase().replace(/\s+/g, "-"),
      updatedAt: now,
    };

    if (payload.id) {
      await updateDb((current) => ({
        ...current,
        categories: current.categories.map((item) => (item.id === payload.id ? normalized : item)),
      }));
      return normalized;
    }

    const created = {
      id: createId("cat"),
      image: payload.image || defaultCategoryImage,
      createdAt: now,
      ...normalized,
    };

    await updateDb((current) => ({
      ...current,
      categories: [created, ...current.categories],
    }));
    return created;
  },

  async deleteCategory(categoryId) {
    const db = getDb();
    const relatedProducts = db.products.filter((product) => product.categoryId === categoryId);
    if (relatedProducts.length) {
      throw new Error("Không thể xoá category đang có sản phẩm.");
    }

    await updateDb((current) => ({
      ...current,
      categories: current.categories.filter((item) => item.id !== categoryId),
    }));
    return true;
  },
};

export default categoryService;
