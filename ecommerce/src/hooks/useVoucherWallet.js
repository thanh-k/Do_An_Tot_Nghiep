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
        } catch (e) {
          setSavedVoucherCodes([]);
        }
      } else {
        setSavedVoucherCodes([]);
      }
    } else {
      setSavedVoucherCodes([]);
    }
  }, [currentUser]);

  const saveVoucher = (code) => {
    if (!currentUser) return;
    if (savedVoucherCodes.includes(code)) return;
    const updated = [...savedVoucherCodes, code];
    setSavedVoucherCodes(updated);
    localStorage.setItem(
      `voucher_wallet_${currentUser.id}`,
      JSON.stringify(updated),
    );
  };

  const isSaved = (code) => {
    return savedVoucherCodes.includes(code);
  };

  return { savedVoucherCodes, saveVoucher, isSaved };
}
