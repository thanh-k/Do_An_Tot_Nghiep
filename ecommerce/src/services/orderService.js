import { createId, getDb, updateDb, simulateDelay } from "@/services/storageService";

export const orderService = {
  async getOrdersByUser(userId) {
    await simulateDelay(250);
    return getDb().orders
      .filter((order) => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getAllOrders() {
    await simulateDelay(250);
    const db = getDb();

    return db.orders
      .map((order) => ({
        ...order,
        user: db.users.find((user) => user.id === order.userId) || null,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async placeOrder(orderPayload, currentUser) {
    await simulateDelay(500);

    const subtotal = orderPayload.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const createdOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      items: orderPayload.items,
      status: "pending",
      paymentStatus:
        orderPayload.paymentMethod === "cod" ? "pending" : "paid",
      paymentMethod: orderPayload.paymentMethod,
      shippingAddress: orderPayload.shippingAddress,
      subtotal,
      shippingFee: 0,
      total: subtotal,
      createdAt: new Date().toISOString(),
    };

    await updateDb((current) => ({
      ...current,
      orders: [createdOrder, ...current.orders],
      products: current.products.map((product) => ({
        ...product,
        variants: product.variants.map((variant) => {
          const matchedItem = orderPayload.items.find(
            (item) => item.productId === product.id && item.variantId === variant.id
          );
          if (!matchedItem) return variant;

          return {
            ...variant,
            stock: Math.max(variant.stock - matchedItem.quantity, 0),
          };
        }),
      })),
    }));

    return createdOrder;
  },

  async updateOrderStatus(orderId, status) {
    await simulateDelay(220);

    await updateDb((current) => ({
      ...current,
      orders: current.orders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      ),
    }));

    return true;
  },
};

export default orderService;
