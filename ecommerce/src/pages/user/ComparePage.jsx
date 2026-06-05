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
        Object.entries(p.specifications).forEach(([k, v]) => {
          if (v === null || v === undefined) return;
          const valStr = String(v).trim().toLowerCase();
          // Lọc bỏ các trường rỗng hoặc mang ý nghĩa "Không có" để bảng thông số luôn gọn gàng và chuẩn theo danh mục
          if (
            valStr !== "" &&
            valStr !== "-" &&
            valStr !== "n/a" &&
            valStr !== "không có" &&
            valStr !== "không hỗ trợ"
          ) {
            keys.add(k);
          }
        });
      }
    });
    return Array.from(keys);
  }, [slots]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 0);

  // LOGIC: AI tự động phân tích và trích xuất điểm mạnh dựa trên Toàn Bộ Thông Số
  const generateAnalysis = (p, otherProduct) => {
    if (!p || !otherProduct) return { badge: "", aiText: "", isWinner: false };

    const myPrice = p.variants?.[0]?.price || 0;
    const otherPrice = otherProduct.variants?.[0]?.price || 0;

    let myAdvantages = [];

    // Hàm bóc tách con số từ chuỗi thông số (VD: "8 GB" -> 8, "5000 mAh" -> 5000)
    const extractNumber = (str) => {
      if (!str) return 0;
      const match = String(str).match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    };

    if (p.specifications && otherProduct.specifications) {
      Object.keys(p.specifications).forEach((key) => {
        const mySpec = p.specifications[key];
        const otherSpec = otherProduct.specifications[key];

        if (mySpec && otherSpec) {
          const myVal = extractNumber(mySpec);
          const otherVal = extractNumber(otherSpec);

          if (myVal > 0 && otherVal > 0 && myVal !== otherVal) {
            const lowerKey = key.toLowerCase();
            if (myVal > otherVal) {
              if (lowerKey.includes("ram"))
                myAdvantages.push("RAM lớn hơn đa nhiệm mượt mà");
              else if (lowerKey.includes("pin"))
                myAdvantages.push("Dung lượng pin bền bỉ hơn");
              else if (
                lowerKey.includes("nhớ") ||
                lowerKey.includes("rom") ||
                lowerKey.includes("lưu trữ")
              )
                myAdvantages.push("Không gian lưu trữ rộng rãi hơn");
              else if (
                lowerKey.includes("camera") ||
                lowerKey.includes("máy ảnh")
              )
                myAdvantages.push("Độ phân giải Camera sắc nét hơn");
              else if (
                lowerKey.includes("màn hình") ||
                lowerKey.includes("inch")
              )
                myAdvantages.push("Không gian hiển thị lớn hơn");
              else if (
                lowerKey.includes("hz") ||
                lowerKey.includes("tần số quét")
              )
                myAdvantages.push("Tần số quét cao, vuốt chạm mượt mà");
              else if (lowerKey.includes("sạc"))
                myAdvantages.push("Công suất sạc nhanh hơn");
            }
          }
        }
      });
    }

    myAdvantages = [...new Set(myAdvantages)];
    const topAdvantages = myAdvantages.slice(0, 3); // Lấy tối đa 3 ưu điểm nổi bật nhất để câu văn không quá dài

    let badge = "";
    let aiText = "";
    let isWinner = false;

    const diffPrice = Math.abs(myPrice - otherPrice);
    const formatDiff = formatPrice(diffPrice);

    // Tạo một index ngẫu nhiên nhưng cố định cho cặp 2 sản phẩm này (tránh flicker khi re-render)
    const hashString = String(p.id) + String(otherProduct.id);
    let hashSum = 0;
    for (let i = 0; i < hashString.length; i++) {
      hashSum += hashString.charCodeAt(i);
    }
    const rIdx = hashSum % 5; // Chọn 1 trong 5 mẫu câu

    const advText = topAdvantages.join(", ");
    const priceCondition =
      myPrice < otherPrice
        ? `Không những tiết kiệm được ${formatDiff}, mà thiết bị này còn`
        : "Cùng mức giá nhưng lại";
    const brandName = p.brand?.name || "thương hiệu này";

    if (topAdvantages.length > 0) {
      if (myPrice <= otherPrice) {
        badge = "👑 Ngôi Vương Công Nghệ";
        isWinner = true;
        const templates = [
          `Đây thực sự là một "món hời" công nghệ! ${priceCondition} vượt trội hơn đối thủ về ${advText}. Một quyết định xuống tiền vô cùng thông minh!`,
          `Điểm 10 cho chất lượng! ${priceCondition} mang lại giá trị vượt bậc nhờ ${advText}. Chắc chắn sẽ không làm bạn thất vọng.`,
          `Nếu bạn tìm kiếm hiệu năng trên giá thành (P/P) tốt nhất, đây chính là chân ái! ${priceCondition} hoàn toàn áp đảo với ${advText}.`,
          `Tuyệt vời! ${priceCondition} xuất sắc đánh bại đối thủ nhờ ${advText}. Chốt đơn ngay kẻo lỡ siêu phẩm này!`,
          `Một chiến thắng thuyết phục! ${priceCondition} tự hào sở hữu ${advText}, biến nó thành lựa chọn không thể hợp lý hơn.`,
        ];
        aiText = templates[rIdx];
      } else {
        badge = "💎 Lựa Chọn Đẳng Cấp";
        isWinner = true;
        const templates = [
          `Đắt xắt ra miếng! Dù nhỉnh hơn ${formatDiff}, nhưng thiết bị này mang lại một trải nghiệm thực sự xứng tầm với ${advText}.`,
          `Đẳng cấp là đây! Khoản chênh lệch ${formatDiff} hoàn toàn được bù đắp xứng đáng nhờ ${advText}.`,
          `Sự đầu tư thông minh cho sự hoàn hảo! Dù cao hơn ${formatDiff}, bạn sẽ được tận hưởng ${advText} cực kỳ ấn tượng.`,
          `Tiền nào của nấy! Bỏ thêm ${formatDiff} để đổi lấy ${advText} chắc chắn là một quyết định nâng cấp cực chuẩn.`,
          `Dành cho những ai không thỏa hiệp! Mức giá nhỉnh hơn ${formatDiff} là vé vào cửa để trải nghiệm ${advText} đỉnh cao.`,
        ];
        aiText = templates[rIdx];
      }
    } else {
      if (myPrice < otherPrice) {
        badge = "💰 Tiết Kiệm Thông Minh";
        const templates = [
          `Tuy không nhỉnh hơn về thông số, nhưng với mức giá "mềm" hơn đáng kể (${formatDiff}), đây là phương án tối ưu ngân sách cực kỳ tuyệt vời.`,
          `Lựa chọn an toàn cho hầu bao! Tiết kiệm ngay ${formatDiff} mà vẫn sở hữu thiết bị đáp ứng trọn vẹn nhu cầu cơ bản của bạn.`,
          `Không cần cấu hình khủng nhất, việc giữ lại ${formatDiff} trong túi mới là nước đi khôn ngoan nếu bạn chỉ cần trải nghiệm đủ dùng.`,
          `Thực dụng và kinh tế! Thiết bị này giúp bạn tiết kiệm tới ${formatDiff}, cực kỳ hoàn hảo cho những ai ưu tiên ngân sách.`,
          `Một món đầu tư sinh lời! Rẻ hơn ${formatDiff} so với đối thủ là một điểm cộng cực lớn không thể bỏ qua.`,
        ];
        aiText = templates[rIdx];
      } else if (myPrice > otherPrice) {
        badge = "🌟 Dấu Ấn Thương Hiệu";
        const templates = [
          `Dù mức giá cao hơn và thông số có phần khiêm tốn, thiết bị này sinh ra để dành cho những ai đam mê trải nghiệm mang đậm dấu ấn từ ${brandName}.`,
          `Đôi khi thông số không phải là tất cả! Mức giá nhỉnh hơn này mua lấy sự ổn định, thiết kế độc quyền và hệ sinh thái từ ${brandName}.`,
          `Dành riêng cho các fan cứng! Dù đắt hơn đôi chút, nhưng cảm giác cầm trên tay một sản phẩm mang tính biểu tượng luôn có giá trị riêng.`,
          `Trải nghiệm người dùng mới là thước đo cuối cùng! Sự chênh lệch mức giá phản ánh độ hoàn thiện tinh tế và dịch vụ đẳng cấp của hãng.`,
          `Một thiết bị đề cao phong cách và sự tối ưu phần mềm hơn là chạy đua phần cứng, rất đáng để cân nhắc nếu bạn yêu thích ${brandName}.`,
        ];
        aiText = templates[rIdx];
      } else {
        badge = "⚖️ Kẻ Tám Lạng, Người Nửa Cân";
        const templates = [
          `Cả hai siêu phẩm đều quá ngang tài ngang sức. Hãy lắng nghe con tim: bạn bị thu hút bởi phong cách thiết kế của hãng nào hơn thì chốt đơn ngay nhé!`,
          `Thật khó để phân định thắng thua! Quyết định giờ đây hoàn toàn phụ thuộc vào việc bạn thích màu sắc, kiểu dáng của thiết bị nào hơn.`,
          `Một chín một mười! Hãy chọn theo cảm nhận cá nhân và hệ sinh thái bạn đang sử dụng, vì cả hai đều là những cỗ máy xuất sắc.`,
          `Kẻ tám lạng, người nửa cân! Không có lựa chọn sai ở đây, chỉ có thiết bị nào mang lại cho bạn cảm giác "ưng mắt" hơn mà thôi.`,
          `Chênh lệch không đáng kể! Nếu bạn đang phân vân, hãy ra ngay cửa hàng gần nhất để trải nghiệm thực tế và chọn theo cảm giác cầm nắm.`,
        ];
        aiText = templates[rIdx];
      }
    }

    return { badge, aiText, isWinner };
  };

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
      <section className="bg-slate-950 pt-24 pb-32 md:pb-48 text-white relative">
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
            className="text-4xl sm:text-5xl md:text-8xl font-black italic uppercase leading-none tracking-tighter"
          >
            SO SÁNH <span className="text-rose-600">ĐỐI KHÁNG</span>
          </motion.h1>
        </div>
      </section>

      {/* 2. BẢNG SO SÁNH */}
      <div className="container-padded -mt-20 md:-mt-32 relative z-30">
        <div className="bg-white rounded-[1.5rem] md:rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full border-collapse table-fixed min-w-[480px] sm:min-w-[700px] md:min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="w-[30%] md:w-[20%] p-3 md:p-10 bg-slate-50/50 text-left align-middle border-r border-slate-50">
                    <div className="space-y-2 md:space-y-4">
                      <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                        <Zap
                          size={16}
                          className="md:w-6 md:h-6"
                          fill="currentColor"
                        />
                      </div>
                      <h3 className="text-sm sm:text-xl md:text-3xl font-black text-slate-900 uppercase italic leading-none">
                        Thông số <br /> So sánh
                      </h3>
                    </div>
                  </th>

                  {slots.map((product, index) => (
                    <th
                      key={`header-${index}`}
                      className="w-[35%] md:w-[40%] p-3 md:p-10 border-l border-slate-50 relative group"
                    >
                      {product ? (
                        <div className="flex flex-col items-center gap-3 md:gap-6">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="absolute top-1.5 right-1.5 md:top-4 md:right-4 p-1 md:p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white transition-all z-20 shadow-sm"
                          >
                            <Trash2 size={12} className="md:w-4 md:h-4" />
                          </button>
                          <div className="relative">
                            <motion.img
                              whileHover={{ y: -5 }}
                              src={
                                product.thumbnail ||
                                product.image ||
                                "https://via.placeholder.com/200"
                              }
                              className="h-20 sm:h-36 md:h-48 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-transform duration-500"
                            />
                          </div>
                          <div className="text-center w-full">
                            <p className="text-[8px] md:text-[10px] font-black text-rose-600 uppercase tracking-widest mb-0.5 md:mb-1">
                              {product.brand?.name || "N/A"}
                            </p>
                            <Link
                              to={`/products/${product.slug}`}
                              className="text-xs sm:text-base md:text-xl font-black text-slate-900 leading-tight line-clamp-2 hover:text-brand-600 transition-colors"
                            >
                              {product.name}
                            </Link>
                            <p className="text-sm sm:text-lg md:text-2xl font-black text-slate-950 mt-1 md:mt-3 italic">
                              {formatPrice(product.variants?.[0]?.price)}
                            </p>
                          </div>
                          <div className="w-full space-y-2 md:space-y-3 pt-1 md:pt-2">
                            <Link
                              to={`/products/${product.slug}`}
                              className="w-full flex items-center justify-center gap-1.5 md:gap-2 bg-slate-900 text-white py-2 md:py-3.5 rounded-lg md:rounded-2xl font-black uppercase text-[8px] md:text-[10px] tracking-widest hover:bg-rose-600 transition-all shadow-lg active:scale-95"
                            >
                              <ShoppingCart
                                size={12}
                                className="md:w-4 md:h-4"
                              />
                              <span className="hidden sm:inline">
                                Xem chi tiết
                              </span>
                              <span className="sm:hidden">Chi tiết</span>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAdd(index)}
                          className="flex flex-col items-center justify-center h-full min-h-[140px] md:min-h-[300px] w-full border-2 md:border-4 border-dashed border-slate-100 rounded-[1.25rem] md:rounded-[3rem] hover:border-rose-200 hover:bg-rose-50/50 transition-all group p-2 md:p-4"
                        >
                          <div className="w-8 h-8 md:w-16 md:h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all mb-1.5 md:mb-4">
                            <Plus size={16} className="md:w-8 md:h-8" />
                          </div>
                          <span className="text-[9px] md:text-sm font-black text-slate-400 uppercase group-hover:text-rose-600 text-center">
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
                      <td className="p-3 md:p-8 align-middle border-r border-rose-100/50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 md:gap-3">
                          <div className="w-6 h-6 md:w-10 md:h-10 rounded-md md:rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center text-white shadow-lg shadow-rose-200 shrink-0">
                            <Sparkles size={12} className="md:w-5 md:h-5" />
                          </div>
                          <span className="font-black text-rose-600 text-[9px] md:text-sm uppercase tracking-tight">
                            Hệ Thống Tự Động Phân tích
                          </span>
                        </div>
                      </td>
                      {slots.map((p, i) => {
                        const otherProduct = slots[i === 0 ? 1 : 0];

                        const { badge, aiText, isWinner } = generateAnalysis(
                          p,
                          otherProduct,
                        );

                        return (
                          <td
                            key={`ai-${i}`}
                            className="p-3 md:p-8 border-l border-rose-100/50 relative"
                          >
                            <div className="bg-white rounded-xl md:rounded-3xl p-3 md:p-6 border border-rose-100 shadow-sm relative overflow-hidden group-hover:shadow-md transition-shadow">
                              <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-rose-50 rounded-full blur-xl md:blur-2xl -mr-8 -mt-8 md:-mr-10 md:-mt-10 pointer-events-none"></div>
                              <div className="relative z-10">
                                <span
                                  className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[11px] font-black uppercase mb-2 md:mb-4 shadow-sm ${isWinner ? "bg-rose-600 text-white" : "bg-slate-900 text-white"}`}
                                >
                                  {badge}
                                </span>
                                <p className="text-[10px] md:text-sm font-medium text-slate-700 leading-relaxed italic">
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
                    <td className="p-3 md:p-8 align-middle border-r border-slate-50">
                      <span className="font-bold text-slate-900 text-[10px] md:text-sm uppercase tracking-tight">
                        Thương hiệu
                      </span>
                    </td>
                    {slots.map((p, i) => (
                      <td
                        key={`brand-${i}`}
                        className="p-3 md:p-8 border-l border-slate-50 text-center"
                      >
                        <span className="text-xs md:text-base font-bold text-slate-700">
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
                      <td className="p-3 md:p-8 align-middle border-r border-slate-50">
                        <span className="font-bold text-slate-900 text-[10px] md:text-sm uppercase tracking-tight">
                          {specKey}
                        </span>
                      </td>
                      {slots.map((p, i) => {
                        const specValue = p?.specifications?.[specKey];
                        let isValidValue = false;
                        if (specValue !== null && specValue !== undefined) {
                          const valStr = String(specValue).trim().toLowerCase();
                          if (
                            valStr !== "" &&
                            valStr !== "-" &&
                            valStr !== "n/a" &&
                            valStr !== "không có" &&
                            valStr !== "không hỗ trợ"
                          ) {
                            isValidValue = true;
                          }
                        }

                        return (
                          <td
                            key={`spec-${i}-${specKey}`}
                            className="p-3 md:p-8 border-l border-slate-50 text-center"
                          >
                            <span className="text-xs md:text-base font-bold text-slate-600 leading-relaxed">
                              {isValidValue ? (
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
              <div className="text-center py-10 md:py-20 bg-white">
                <p className="text-base md:text-lg text-slate-500 mb-2">
                  Bạn chưa chọn sản phẩm nào để so sánh.
                </p>
                <p className="text-xs md:text-sm text-slate-400">
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
              className="bg-white w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 md:p-8 bg-slate-950 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-rose-500" />
                  <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter">
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

              <div className="p-4 md:p-6 shrink-0 border-b border-slate-100 bg-slate-50 grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-3 md:gap-4">
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
                          className="w-16 h-16 md:w-20 md:h-20 object-contain bg-white rounded-xl p-1 border border-slate-100 shrink-0"
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
