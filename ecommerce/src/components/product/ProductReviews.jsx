import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Camera,
  X,
  ChevronDown,
  Send,
  Image as ImageIcon,
  Sparkles,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

// --- DỮ LIỆU ĐÁNH GIÁ MẪU BAN ĐẦU ---
const INITIAL_REVIEWS = [
  {
    id: 1,
    user: "Hoàng Nam",
    avatar: "https://i.pravatar.cc/150?u=nam",
    rating: 5,
    date: "01/04/2026",
    comment:
      "Giao hàng cực nhanh, đặt hỏa tốc 2h là có ngay. Máy màu Titan tự nhiên đẹp xuất sắc, đóng gói kỹ càng. Rất hài lòng!",
    images: [
      "https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=400",
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=400",
    ],
    verified: true,
    likes: 24,
  },
  {
    id: 2,
    user: "Minh Thư",
    avatar: "https://i.pravatar.cc/150?u=thu",
    rating: 5,
    date: "28/03/2026",
    comment:
      "Nhân viên tư vấn rất nhiệt tình qua Zalo. Sản phẩm nguyên seal, check bảo hành chính hãng chuẩn 12 tháng. Sẽ ủng hộ NovaShop dài dài.",
    images: [
      "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=400",
    ],
    verified: true,
    likes: 15,
  },
  {
    id: 3,
    user: "Quốc Anh",
    avatar: "https://i.pravatar.cc/150?u=anh",
    rating: 4,
    date: "25/03/2026",
    comment:
      "Máy dùng mượt, màn hình 120Hz lướt rất phê. Chỉ hơi tiếc là không kèm củ sạc nên phải mua thêm bên ngoài. Shop phục vụ tốt.",
    images: [],
    verified: true,
    likes: 8,
  },
  {
    id: 4,
    user: "Lan Phương",
    avatar: "https://i.pravatar.cc/150?u=phuong",
    rating: 5,
    date: "22/03/2026",
    comment:
      "Màu thực tế xinh xắn lắm luôn. Chụp ảnh selfie đỉnh của chóp. Cảm ơn shop vì món quà nhỏ đi kèm nhé!",
    images: [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=400",
    ],
    verified: true,
    likes: 32,
  },
];

const FILTERS = ["Tất cả", "5 Sao", "4 Sao", "Có hình ảnh"];

export default function ProductReviews() {
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [selectedImg, setSelectedImg] = useState(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // State cho form đánh giá mới
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });

  // --- LOGIC LỌC ĐÁNH GIÁ ---
  const filteredReviews = useMemo(() => {
    switch (activeFilter) {
      case "5 Sao":
        return reviews.filter((r) => r.rating === 5);
      case "4 Sao":
        return reviews.filter((r) => r.rating === 4);
      case "Có hình ảnh":
        return reviews.filter((r) => r.images.length > 0);
      default:
        return reviews;
    }
  }, [activeFilter, reviews]);

  // --- LOGIC TÍNH TOÁN SAO ĐÁNH GIÁ ĐỘNG TỪ MẢNG REVIEWS ---
  const stats = useMemo(() => {
    if (reviews.length === 0)
      return { avg: 0, counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, total: 0 };
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach((r) => {
      counts[r.rating] = (counts[r.rating] || 0) + 1;
      sum += r.rating;
    });
    return {
      avg: (sum / reviews.length).toFixed(1),
      counts,
      total: reviews.length,
    };
  }, [reviews]);

  // --- LOGIC GỬI ĐÁNH GIÁ MỚI ---
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newReview.comment.trim())
      return toast.error("Vui lòng nhập nội dung đánh giá");

    const reviewObj = {
      id: Date.now(),
      user: "Khách hàng (Bạn)",
      avatar: "https://i.pravatar.cc/150?u=you",
      rating: newReview.rating,
      date: "Vừa xong",
      comment: newReview.comment,
      images: [],
      verified: true,
      likes: 0,
    };

    setReviews([reviewObj, ...reviews]);
    setIsWriteModalOpen(false);
    setNewReview({ rating: 5, comment: "" });
    toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
  };

  return (
    <section className="mt-20">
      {/* 1. TỔNG QUAN ĐÁNH GIÁ */}
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-100 mb-12">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 text-center border-b lg:border-b-0 lg:border-r border-slate-100 pb-8 lg:pb-0 lg:pr-12">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
              Đánh giá trung bình
            </h4>
            <div className="flex flex-col items-center">
              <span className="text-8xl font-black text-slate-900 leading-none italic">
                {stats.avg}
              </span>
              <div className="flex gap-1 my-6 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={24}
                    fill={i < Math.round(stats.avg) ? "currentColor" : "none"}
                    className={
                      i >= Math.round(stats.avg) ? "text-slate-200" : ""
                    }
                  />
                ))}
              </div>
              <p className="text-sm font-bold text-slate-500 italic">
                ({stats.total} nhận xét từ khách hàng)
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4">
            {[5, 4, 3, 2, 1].map((star) => {
              // Tính toán phần trăm thanh tiến trình tự động
              const percentage =
                stats.total > 0
                  ? Math.round((stats.counts[star] / stats.total) * 100)
                  : 0;
              return (
                <div key={star} className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-400 w-12 uppercase tracking-tighter">
                    {star} Sao
                  </span>
                  <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{
                        width: `${percentage}%`,
                      }}
                      transition={{ duration: 1 }}
                      className={`h-full rounded-full bg-gradient-to-r ${star >= 4 ? "from-yellow-400 to-orange-500" : "from-slate-200 to-slate-300"}`}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-10">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. BỘ LỌC & NÚT VIẾT ĐÁNH GIÁ */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
          <div className="flex items-center gap-2 mr-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">
            <Filter size={14} /> Lọc theo:
          </div>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === f ? "bg-rose-600 text-white shadow-lg shadow-rose-200 scale-105" : "bg-white text-slate-500 border border-slate-100 hover:border-rose-300"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="flex items-center gap-3 bg-slate-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          Viết đánh giá <MessageSquare size={16} />
        </button>
      </div>

      {/* 3. DANH SÁCH REVIEW (VỚI HIỆU ỨNG LỌC) */}
      <motion.div layout className="space-y-8 min-h-[400px]">
        <AnimatePresence mode="popLayout">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((rev) => (
              <motion.div
                key={rev.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 relative overflow-hidden group"
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-48 shrink-0">
                    <div className="flex items-center gap-4 md:flex-col md:items-start">
                      <div className="relative">
                        <img
                          src={rev.avatar}
                          className="w-14 h-14 rounded-2xl border-2 border-rose-100 object-cover"
                          alt="user"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-rose-600 text-white p-1 rounded-lg">
                          <Sparkles size={10} fill="currentColor" />
                        </div>
                      </div>
                      <div>
                        <h5 className="font-black text-slate-900 text-sm">
                          {rev.user}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                          {rev.date}
                        </p>
                      </div>
                    </div>
                    {rev.verified && (
                      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase ring-1 ring-emerald-100">
                        <CheckCircle2 size={12} /> Đã mua hàng
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex text-yellow-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < rev.rating ? "currentColor" : "none"}
                          className={i >= rev.rating ? "text-slate-200" : ""}
                        />
                      ))}
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed italic">
                      "{rev.comment}"
                    </p>

                    {rev.images.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-2">
                        {rev.images.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedImg(img)}
                            className="w-24 h-24 rounded-2xl overflow-hidden cursor-zoom-in border border-slate-100 hover:scale-105 transition-transform shadow-md"
                          >
                            <img
                              src={img}
                              className="w-full h-full object-cover"
                              alt="review"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-6 pt-6 border-t border-slate-50 mt-4">
                      <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase hover:text-rose-600 transition-colors">
                        <ThumbsUp size={14} /> Hữu ích ({rev.likes})
                      </button>
                      <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase hover:text-rose-600 transition-colors">
                        <MessageSquare size={14} /> Phản hồi
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
                Không tìm thấy đánh giá phù hợp
              </p>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 4. MODAL VIẾT ĐÁNH GIÁ */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic tracking-tighter">
                  Chia sẻ trải nghiệm
                </h3>
                <button
                  onClick={() => setIsWriteModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmitReview} className="p-10 space-y-8">
                <div className="text-center space-y-4">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    Bạn chấm bao nhiêu sao?
                  </p>
                  <div className="flex justify-center gap-2 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setNewReview({ ...newReview, rating: s })
                        }
                        className="hover:scale-125 transition-transform"
                      >
                        <Star
                          size={40}
                          fill={s <= newReview.rating ? "currentColor" : "none"}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                    Nội dung đánh giá
                  </label>
                  <textarea
                    rows="4"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 outline-none focus:border-rose-600 focus:bg-white transition-all font-medium text-slate-700"
                    placeholder="Hãy chia sẻ cảm nhận thực tế của bạn về sản phẩm này nhé..."
                    value={newReview.comment}
                    onChange={(e) =>
                      setNewReview({ ...newReview, comment: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-slate-400 font-black uppercase text-[10px] hover:border-rose-600 hover:text-rose-600 transition-all"
                  >
                    <Camera size={18} /> Thêm hình ảnh
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white rounded-2xl p-4 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all"
                  >
                    Gửi đánh giá <Send size={16} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. LIGHTBOX XEM ẢNH */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out"
            onClick={() => setSelectedImg(null)}
          >
            <img
              src={selectedImg}
              className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl border-4 border-white/10"
              alt="zoom"
            />
            <div className="absolute top-8 right-8 text-white flex items-center gap-2 font-black uppercase text-xs tracking-widest">
              <X size={20} /> Click để đóng
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
