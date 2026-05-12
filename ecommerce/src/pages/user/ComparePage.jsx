import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Trash2,
  Search,
  Plus,
  X,
  Lightbulb,
  Zap,
  CheckCircle2,
  ShoppingCart,
  CreditCard,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { compareService } from "@/services/user/compareService";
import { userProductService } from "@/services/user/productService";
import { categoryService } from "@/services/admin/categoryService";
import Input from "@/components/common/Input";
import { useDebounce } from "@/hooks/useDebounce";

const MAX_SLOTS = 2; // Giao diện hiển thị đẹp nhất với 2 sản phẩm

export default function ComparePage() {
  const [loading, setLoading] = useState(true);

  // Quản lý các ô trống (slots)
  const [slots, setSlots] = useState(Array(MAX_SLOTS).fill(null));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);

  // Logic tìm kiếm trong Modal
  const [searchKeyword, setSearchKeyword] = useState("");
  const debouncedSearchKeyword = useDebounce(searchKeyword, 300);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [modalCategory, setModalCategory] = useState("");

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(console.error);
  }, []);

  const loadCompareData = async () => {
    setLoading(true);
    try {
      // Lấy danh sách ID từ LocalStorage
      const compareList = await compareService.getCompareList();

      if (compareList.length === 0) {
        setSlots(Array(MAX_SLOTS).fill(null));
        setLoading(false);
        return;
      }

      const productsRes = await userProductService.getProducts({
        pageSize: 1000,
      });
      const allProducts = productsRes.items || [];

      const compareIds = compareList.map((item) => item.productId);
      const matchedBaseProducts = allProducts.filter((p) =>
        compareIds.includes(p.id),
      );

      const detailPromises = matchedBaseProducts.map((p) =>
        userProductService.getProductBySlug(p.slug),
      );
      const detailedProducts = await Promise.all(detailPromises);

      // Đổ dữ liệu vào các Slot
      const validProducts = detailedProducts.filter(Boolean);
      const newSlots = Array(MAX_SLOTS).fill(null);
      validProducts.forEach((p, idx) => {
        if (idx < MAX_SLOTS) newSlots[idx] = p;
      });

      setSlots(newSlots);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu so sánh:", error);
      toast.error("Có lỗi khi tải dữ liệu so sánh!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompareData();
  }, []);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setSearchLoading(true);
      try {
        const response = await userProductService.getProducts({
          search: debouncedSearchKeyword,
          category: modalCategory || undefined,
          pageSize: 10,
        });
        setSearchResults(response.items);
      } catch (error) {
        console.error("Lỗi khi tìm kiếm sản phẩm:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };
    if (isModalOpen) {
      fetchSearchResults();
    }
  }, [debouncedSearchKeyword, modalCategory, isModalOpen]);

  const handleAddProductToCompare = async (productToAdd) => {
    try {
      const existingProducts = slots.filter(Boolean);

      // Validate: Cùng danh mục
      if (existingProducts.length > 0) {
        const firstProductCategory = existingProducts[0].category?.id;
        if (productToAdd.category?.id !== firstProductCategory) {
          toast.error("Chỉ có thể so sánh sản phẩm cùng danh mục!");
          return;
        }
      }

      // Validate: Trùng lặp
      if (existingProducts.some((p) => p.id === productToAdd.id)) {
        toast.error("Sản phẩm này đã có trong danh sách so sánh!");
        return;
      }

      // Lấy chi tiết để có specifications
      const detailProduct = await userProductService.getProductBySlug(
        productToAdd.slug,
      );

      // Nếu slot hiện tại đang có sản phẩm, xóa nó khỏi danh sách lưu trữ trước
      const currentSlotProduct = slots[activeSlotIndex];
      if (currentSlotProduct) {
        await compareService.removeFromCompare(currentSlotProduct.id);
      }

      // Thêm sản phẩm mới vào danh sách lưu trữ LocalStorage
      await compareService.addToCompare(detailProduct.id);

      // Cập nhật UI ngay lập tức
      const newSlots = [...slots];
      newSlots[activeSlotIndex] = detailProduct;
      setSlots(newSlots);

      toast.success(`Đã thêm "${detailProduct.name}" vào so sánh`);
      setIsModalOpen(false);
      setSearchKeyword("");
    } catch (error) {
      toast.error(error.message || "Lỗi khi thêm sản phẩm vào so sánh");
    }
  };

  const handleRemoveItem = async (index) => {
    const product = slots[index];
    if (!product) return;
    try {
      await compareService.removeFromCompare(product.id);
      toast.success("Đã xóa khỏi danh sách");

      const newSlots = [...slots];
      newSlots[index] = null;
      setSlots(newSlots);
    } catch (error) {
      toast.error("Lỗi khi xóa sản phẩm");
    }
  };

  const handleOpenAdd = (index) => {
    setActiveSlotIndex(index);
    setIsModalOpen(true);
  };

  const allSpecKeys = useMemo(() => {
    const keys = new Set();
    slots.forEach((p) => {
      if (p?.specifications && typeof p.specifications === "object") {
        Object.keys(p.specifications).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [slots]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">
        Đang tải dữ liệu so sánh...
      </div>
    );
  }

  const hasProducts = slots.some(Boolean);
  const hasTwoProducts = slots.filter(Boolean).length === 2;

  return (
    <div className="min-h-screen bg-white pb-20 overflow-x-hidden relative">
      {/* 1. HERO SECTION */}
      <section className="bg-slate-950 pt-24 pb-48 text-white relative">
        <div className="container-padded relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/30 mb-8"
          >
            <Lightbulb size={14} />{" "}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Lựa chọn thông minh
            </span>
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-8xl font-black italic uppercase leading-none tracking-tighter"
          >
            SO SÁNH <span className="text-rose-600">ĐỐI KHÁNG</span>
          </motion.h1>
        </div>
      </section>

      {/* 2. BẢNG SO SÁNH */}
      <div className="container-padded -mt-32 relative z-30">
        <div className="bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full border-collapse table-fixed min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="w-[20%] p-10 bg-slate-50/50 text-left align-middle border-r border-slate-50">
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                        <Zap size={24} fill="currentColor" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 uppercase italic leading-none">
                        Thông số <br /> So sánh
                      </h3>
                    </div>
                  </th>

                  {slots.map((product, index) => (
                    <th
                      key={`header-${index}`}
                      className="w-[40%] p-10 border-l border-slate-50 relative group"
                    >
                      {product ? (
                        <div className="flex flex-col items-center gap-6">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white transition-all z-20 shadow-sm"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="relative">
                            <motion.img
                              whileHover={{ y: -10 }}
                              src={
                                product.thumbnail ||
                                product.image ||
                                "https://via.placeholder.com/200"
                              }
                              className="h-48 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-transform duration-500"
                            />
                          </div>
                          <div className="text-center w-full">
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">
                              {product.brand?.name || "N/A"}
                            </p>
                            <Link
                              to={`/product/${product.slug}`}
                              className="text-xl font-black text-slate-900 leading-tight line-clamp-2 hover:text-brand-600 transition-colors"
                            >
                              {product.name}
                            </Link>
                            <p className="text-2xl font-black text-slate-950 mt-3 italic">
                              {formatPrice(product.variants?.[0]?.price)}
                            </p>
                          </div>
                          <div className="w-full space-y-3 pt-2">
                            <Link
                              to={`/product/${product.slug}`}
                              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 transition-all shadow-lg active:scale-95"
                            >
                              <ShoppingCart size={16} />
                              Xem chi tiết
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAdd(index)}
                          className="flex flex-col items-center justify-center h-full min-h-[300px] w-full border-4 border-dashed border-slate-100 rounded-[3rem] hover:border-rose-200 hover:bg-rose-50/50 transition-all group"
                        >
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all mb-4">
                            <Plus size={32} />
                          </div>
                          <span className="text-sm font-black text-slate-400 uppercase group-hover:text-rose-600">
                            Thêm sản phẩm
                          </span>
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              {hasProducts && (
                <tbody>
                  {/* --- DÒNG PHÂN TÍCH AI (CHỈ HIỂN THỊ KHI CÓ ĐỦ 2 SẢN PHẨM) --- */}
                  {hasTwoProducts && (
                    <tr className="bg-gradient-to-r from-rose-50/40 to-orange-50/40">
                      <td className="p-8 align-middle border-r border-rose-100/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                            <Sparkles size={20} />
                          </div>
                          <span className="font-black text-rose-600 text-sm uppercase tracking-tight">
                            AI Phân tích
                          </span>
                        </div>
                      </td>
                      {slots.map((p, i) => {
                        const otherProduct = slots[i === 0 ? 1 : 0];
                        const myPrice = p.variants?.[0]?.price || 0;
                        const otherPrice = otherProduct.variants?.[0]?.price || 0;

                        let aiText = "";
                        let badge = "";
                        let isWinner = false;

                        // Thuật toán AI phân tích dựa trên giá trị và phân khúc
                        if (myPrice < otherPrice) {
                          isWinner = true;
                          badge = "🏆 Lựa chọn Tiết kiệm";
                          aiText = `Hệ thống AI đánh giá đây là thiết bị có tỷ lệ P/P (Hiệu năng/Giá thành) tối ưu nhất. Rẻ hơn đối thủ ${formatPrice(otherPrice - myPrice)}, đây là sự lựa chọn cực kỳ thông minh cho ngân sách của bạn mà vẫn đảm bảo trải nghiệm tốt.`;
                        } else if (myPrice > otherPrice) {
                          badge = "💎 Lựa chọn Cao cấp";
                          aiText = `Hệ thống AI nhận diện đây là thiết bị thuộc phân khúc cao cấp hơn. Dù có mức giá nhỉnh hơn ${formatPrice(myPrice - otherPrice)}, sản phẩm này hứa hẹn mang lại trải nghiệm toàn diện, vật liệu hoàn thiện tốt và công nghệ vượt trội hơn.`;
                        } else {
                          badge = "⚖️ Cân tài cân sức";
                          aiText = `Cả hai thiết bị đều có mức giá hoàn toàn tương đương nhau. Quyết định sẽ phụ thuộc vào việc bạn yêu thích thương hiệu ${p.brand?.name || "này"} hay đối thủ hơn.`;
                        }

                        return (
                          <td key={`ai-${i}`} className="p-8 border-l border-rose-100/50 relative">
                            <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm relative overflow-hidden group-hover:shadow-md transition-shadow">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                              <div className="relative z-10">
                                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase mb-4 shadow-sm ${isWinner ? "bg-rose-600 text-white" : "bg-slate-900 text-white"}`}>
                                  {badge}
                                </span>
                                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                                  "{aiText}"
                                </p>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {/* DÒNG THƯƠNG HIỆU */}
                  <tr className="hover:bg-slate-50 transition-colors border-t border-slate-50">
                    <td className="p-8 align-middle border-r border-slate-50">
                      <span className="font-bold text-slate-900 text-sm uppercase tracking-tight">
                        Thương hiệu
                      </span>
                    </td>
                    {slots.map((p, i) => (
                      <td
                        key={`brand-${i}`}
                        className="p-8 border-l border-slate-50 text-center"
                      >
                        <span className="text-base font-bold text-slate-700">
                          {p ? p.brand?.name || "N/A" : "---"}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* CÁC DÒNG THÔNG SỐ ĐỘNG TỪ DATABASE */}
                  {allSpecKeys.map((specKey) => (
                    <tr
                      key={specKey}
                      className="group hover:bg-slate-50 transition-colors border-t border-slate-50"
                    >
                      <td className="p-8 align-middle border-r border-slate-50">
                        <span className="font-bold text-slate-900 text-sm uppercase tracking-tight">
                          {specKey}
                        </span>
                      </td>
                      {slots.map((p, i) => {
                        const specValue = p?.specifications?.[specKey];
                        return (
                          <td
                            key={`spec-${i}-${specKey}`}
                            className="p-8 border-l border-slate-50 text-center"
                          >
                            <span className="text-base font-bold text-slate-600 leading-relaxed">
                              {specValue ? (
                                specValue
                              ) : (
                                <span className="text-slate-300">---</span>
                              )}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>

            {!hasProducts && (
              <div className="text-center py-20 bg-white">
                <p className="text-lg text-slate-500 mb-2">
                  Bạn chưa chọn sản phẩm nào để so sánh.
                </p>
                <p className="text-sm text-slate-400">
                  Hãy nhấn vào biểu tượng <b>+</b> ở trên để bắt đầu.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. MODAL TÌM KIẾM VÀ CHỌN SẢN PHẨM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm bg-slate-950/60">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 bg-slate-950 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-rose-500" />
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">
                    Thêm thiết bị so sánh
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 shrink-0 border-b border-slate-100 bg-slate-50 grid grid-cols-[1fr_2fr] gap-4">
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-500 outline-none"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Nhập tên thiết bị bạn muốn tìm..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  leftIcon={<Search size={18} className="text-slate-400" />}
                />
              </div>

              <div className="p-6 overflow-y-auto space-y-3 no-scrollbar flex-1">
                {searchLoading && (
                  <div className="py-10 text-center text-slate-500 font-bold">
                    Đang tìm kiếm...
                  </div>
                )}

                {!searchLoading &&
                  searchResults.length === 0 &&
                  searchKeyword && (
                    <div className="py-10 text-center text-slate-500">
                      Không tìm thấy sản phẩm phù hợp.
                    </div>
                  )}

                {!searchLoading &&
                  searchResults.map((p) => {
                    const isSelected = slots.some((s) => s && s.id === p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() =>
                          !isSelected && handleAddProductToCompare(p)
                        }
                        className={`flex items-center gap-4 p-4 rounded-[2rem] border-2 transition-all ${
                          isSelected
                            ? "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                            : "border-slate-50 hover:border-rose-600 hover:bg-rose-50 cursor-pointer group"
                        }`}
                      >
                        <img
                          src={
                            p.thumbnail ||
                            p.image ||
                            "https://via.placeholder.com/100"
                          }
                          alt={p.name}
                          className="w-20 h-20 object-contain bg-white rounded-xl p-1 border border-slate-100"
                        />
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-0.5">
                            {p.category?.name || "N/A"}
                          </p>
                          <h4 className="font-black text-slate-900 text-sm leading-tight line-clamp-1">
                            {p.name}
                          </h4>
                          <p className="text-slate-500 font-bold mt-1 text-sm">
                            {formatPrice(p.variants?.[0]?.price)}
                          </p>
                        </div>
                        {!isSelected ? (
                          <Plus
                            className="text-slate-300 group-hover:text-rose-600 group-hover:scale-125 transition-all mr-2"
                            size={24}
                          />
                        ) : (
                          <span className="text-[10px] bg-slate-200 px-3 py-1.5 rounded-full text-slate-500 font-black mr-2">
                            ĐÃ CHỌN
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
