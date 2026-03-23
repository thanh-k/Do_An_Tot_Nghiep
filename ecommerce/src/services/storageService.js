import { STORAGE_KEYS } from "@/constants";
import { initialDb } from "@/data/mockDb";

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const getDb = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.DB);
    return raw ? JSON.parse(raw) : initialDb;
  } catch (error) {
    console.error("Không thể đọc database localStorage", error);
    return initialDb;
  }
};

export const setDb = async (nextDb) => {
  window.localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(nextDb));
  await wait(150);
  return nextDb;
};

export const updateDb = async (updater) => {
  const current = getDb();
  const next = typeof updater === "function" ? updater(current) : updater;
  return setDb(next);
};

export const readCollection = async (collectionName, delay = 250) => {
  await wait(delay);
  return getDb()[collectionName] || [];
};

export const writeCollection = async (collectionName, data) => {
  const db = getDb();
  db[collectionName] = data;
  await setDb(db);
  return data;
};

export const getStorageData = (key, fallback = null) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Không thể đọc localStorage key=${key}`, error);
    return fallback;
  }
};

export const setStorageData = (key, data) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Không thể ghi localStorage key=${key}`, error);
  }
};

export const removeStorageData = (key) => {
  window.localStorage.removeItem(key);
};

export const createId = (prefix = "id") =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

export const simulateDelay = wait;
