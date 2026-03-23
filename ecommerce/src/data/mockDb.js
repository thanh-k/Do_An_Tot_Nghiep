import { STORAGE_KEYS } from "@/constants";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { users } from "@/data/users";
import { orders } from "@/data/orders";
import { banners } from "@/data/banners";

export const initialDb = {
  categories,
  products,
  users,
  orders,
  banners,
};

export const initializeMockDb = () => {
  if (typeof window === "undefined") return;

  const existing = window.localStorage.getItem(STORAGE_KEYS.DB);
  if (!existing) {
    window.localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(initialDb));
  }
};

export default initialDb;
