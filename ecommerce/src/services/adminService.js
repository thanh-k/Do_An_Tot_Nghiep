import { getDb, simulateDelay } from "@/services/storageService";
import { getProductStock, getStartingPrice } from "@/utils/product";

export const adminService = {
  async getDashboardStats() {
    await simulateDelay(320);
    const db = getDb();

    const revenue = db.orders
      .filter((order) => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + order.total, 0);

    const lowStockProducts = db.products
      .filter((product) => getProductStock(product) <= 10)
      .slice(0, 5)
      .map((product) => ({
        id: product.id,
        name: product.name,
        stock: getProductStock(product),
        price: getStartingPrice(product),
      }));

    const recentOrders = db.orders
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
      .map((order) => ({
        ...order,
        user: db.users.find((user) => user.id === order.userId) || null,
      }));

    const categoryBreakdown = db.categories.map((category) => ({
      ...category,
      totalProducts: db.products.filter((item) => item.categoryId === category.id).length,
    }));

    return {
      totals: {
        products: db.products.length,
        categories: db.categories.length,
        users: db.users.length,
        orders: db.orders.length,
        revenue,
      },
      lowStockProducts,
      recentOrders,
      categoryBreakdown,
    };
  },
};

export default adminService;
