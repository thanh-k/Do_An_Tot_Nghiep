import { createId, getDb, updateDb, simulateDelay } from "@/services/storageService";

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
        categories: current.categories.map((item) =>
          item.id === payload.id ? normalized : item
        ),
      }));
      return normalized;
    }

    const created = {
      id: createId("cat"),
      image:
        payload.image ||
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
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
