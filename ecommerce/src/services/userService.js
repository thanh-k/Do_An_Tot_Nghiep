import { getDb, updateDb, simulateDelay } from "@/services/storageService";

export const userService = {
  async getUsers() {
    await simulateDelay(230);
    return getDb().users.map(({ password, ...user }) => user);
  },

  async updateUser(userId, payload) {
    await simulateDelay(220);
    await updateDb((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === userId ? { ...user, ...payload } : user
      ),
    }));
    return true;
  },

  async deleteUser(userId) {
    await simulateDelay(220);
    await updateDb((current) => ({
      ...current,
      users: current.users.filter((user) => user.id !== userId),
      orders: current.orders.filter((order) => order.userId !== userId),
    }));
    return true;
  },
};

export default userService;
