import { useContext } from "react";
import { WishlistContext } from "@/contexts/WishlistContext";

export const useWishlist = () => useContext(WishlistContext);

export default useWishlist;
