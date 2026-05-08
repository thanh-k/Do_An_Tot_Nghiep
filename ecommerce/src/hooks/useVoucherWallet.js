import { useState, useEffect } from "react";
import useAuth from "./useAuth";

export default function useVoucherWallet() {
  const { currentUser } = useAuth();
  const [savedVoucherCodes, setSavedVoucherCodes] = useState([]);

  useEffect(() => {
    if (currentUser) {
      const stored = localStorage.getItem(`voucher_wallet_${currentUser.id}`);
      if (stored) {
        try {
          setSavedVoucherCodes(JSON.parse(stored));
        } catch {
          setSavedVoucherCodes([]);
        }
      } else {
        setSavedVoucherCodes([]);
      }
    } else {
      setSavedVoucherCodes([]);
    }
  }, [currentUser]);

  const persist = (codes) => {
    if (!currentUser) return;
    setSavedVoucherCodes(codes);
    localStorage.setItem(`voucher_wallet_${currentUser.id}`, JSON.stringify(codes));
  };

  const saveVoucher = (code) => {
    if (!currentUser || savedVoucherCodes.includes(code)) return;
    persist([...savedVoucherCodes, code]);
  };

  const isSaved = (code) => savedVoucherCodes.includes(code);

  const syncAvailableCodes = (availableCodes = []) => {
    if (!currentUser) return;
    const allowed = new Set(availableCodes);
    const next = savedVoucherCodes.filter((code) => allowed.has(code));
    if (next.length !== savedVoucherCodes.length) {
      persist(next);
    }
  };

  return { savedVoucherCodes, saveVoucher, isSaved, syncAvailableCodes };
}
