import { useEffect, useState } from "react";

export function useLocalStorage(key, initialValue) {
  const getInitial = () => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch (error) {
      console.error(`Không thể đọc localStorage key=${key}`, error);
      return initialValue;
    }
  };

  const [value, setValue] = useState(getInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Không thể ghi localStorage key=${key}`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;
