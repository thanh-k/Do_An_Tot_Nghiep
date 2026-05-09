import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Camera,
  X,
  Send,
  Image as ImageIcon,
  Sparkles,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import reviewService from "@/services/user/reviewService";

const FILTERS = ["Tất cả", "5 Sao", "4 Sao", "Có hình ảnh"];
const MAX_FILES = 5;

function formatDisplayDate(rawDate, fallbackDate) {
  if (fallbackDate) return fallbackDate;
  if (!rawDate) return "";
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN");
}

export default function ProductReviews({ productId }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const [reviewData, setReviewData] = useState(null);
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [selectedImg, setSelectedImg] = useState(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "", files: [], previews: [] });

  const loadReviews = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await reviewService.getProductReviews(productId);
      setReviewData(data);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Không thể tải đánh giá sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const reviews = reviewData?.reviews || [];

  const filteredReviews = useMemo(() => {
    switch (activeFilter) {
      case "5 Sao":
        return reviews.filter((r) => r.rating === 5);
      case "4 Sao":
        return reviews.filter((r) => r.rating === 4);
      case "Có hình ảnh":
        return reviews.filter((r) => (r.images || []).length > 0);
      default:
        return reviews;
    }
  }, [activeFilter, reviews]);

  const stats = useMemo(() => {
    const counts = {
      5: reviewData?.ratingCounts?.[5] || 0,
      4: reviewData?.ratingCounts?.[4] || 0,
      3: reviewData?.ratingCounts?.[3] || 0,
      2: reviewData?.ratingCounts?.[2] || 0,
      1: reviewData?.ratingCounts?.[1] || 0,
    };

    return {
      avg: Number(reviewData?.averageRating || 0).toFixed(1),
      counts,
      total: Number(reviewData?.totalReviews || 0),
    };
  }, [reviewData]);

  const resetForm = () => {
    setNewReview({ rating: 5, comment: "", files: [], previews: [] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenWriteReview = () => {
    if (!isAuthenticated) {
      toast("Vui lòng đăng nhập để đánh giá sản phẩm");
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }

    if (!reviewData?.hasPurchased) {
      toast.error("Bạn chỉ có thể đánh giá sau khi đã mua và nhận sản phẩm");
      return;
    }

    if (reviewData?.hasReviewed) {
      toast("Bạn đã đánh giá sản phẩm này rồi");
      return;
    }

    setIsWriteModalOpen(true);
  };

  const handleFilesChange = (event) => {
    const incoming = Array.from(event.target.files || []);
    if (!incoming.length) return;

    const allowed = incoming.slice(0, MAX_FILES - newReview.files.length);
    if (allowed.length < incoming.length) {
      toast(`Chỉ được chọn tối đa ${MAX_FILES} ảnh`);
    }

    const nextPreviews = allowed.map((file) => URL.createObjectURL(file));
    setNewReview((prev) => ({
      ...prev,
      files: [...prev.files, ...allowed].slice(0, MAX_FILES),
      previews: [...prev.previews, ...nextPreviews].slice(0, MAX_FILES),
    }));

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePreview = (index) => {
    setNewReview((prev) => {
      const previews = [...prev.previews];
      const files = [...prev.files];
      const removedPreview = previews[index];
      if (removedPreview) URL.revokeObjectURL(removedPreview);
      previews.splice(index, 1);
      files.splice(index, 1);
      return { ...prev, previews, files };
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReview.comment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setSubmitting(true);
    try {
      const data = await reviewService.createReview(productId, {
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        files: newReview.files,
      });
      setReviewData(data);
      setIsWriteModalOpen(false);
      newReview.previews.forEach((url) => URL.revokeObjectURL(url));
      resetForm();
      toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
    } catch (error) {
      toast.error(error?.message || "Không thể gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="mt-20">
        <div className="rounded-[3rem] border border-slate-100 bg-white p-10 text-center text-slate-500 shadow-xl">
          Đang tải đánh giá sản phẩm...
        </div>
      </section>
    );
  }

  return (
    <section className="mt-20">
      <div className="mb-12 rounded-[3rem] border border-slate-100 bg-white p-8 shadow-xl md:p-12">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="border-b border-slate-100 pb-8 text-center lg:col-span-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-12">
            <h4 className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-slate-400">
              Đánh giá trung bình
            </h4>
            <div className="flex flex-col items-center">
              <span className="text-8xl font-black leading-none text-slate-900 italic">{stats.avg}</span>
              <div className="my-6 flex gap-1 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={24} fill={i < Math.round(Number(stats.avg)) ? "currentColor" : "none"} className={i >= Math.round(Number(stats.avg)) ? "text-slate-200" : ""} />
                ))}
              </div>
              <p className="text-sm font-bold italic text-slate-500">({stats.total} nhận xét từ khách hàng)</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-8">
            {[5, 4, 3, 2, 1].map((star) => {
              const percentage = stats.total > 0 ? Math.round((stats.counts[star] / stats.total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-4">
                  <span className="w-12 text-xs font-black uppercase tracking-tighter text-slate-400">{star} Sao</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-50">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${percentage}%` }} transition={{ duration: 1 }} className={`h-full rounded-full bg-gradient-to-r ${star >= 4 ? "from-yellow-400 to-orange-500" : "from-slate-200 to-slate-300"}`} />
                  </div>
                  <span className="w-10 text-xs font-bold text-slate-600">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          <div className="mr-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Filter size={14} /> Lọc theo:
          </div>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeFilter === f ? "scale-105 bg-rose-600 text-white shadow-lg shadow-rose-200" : "border border-slate-100 bg-white text-slate-500 hover:border-rose-300"}`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={handleOpenWriteReview} className="flex items-center gap-3 rounded-2xl bg-slate-950 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-all hover:bg-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60" disabled={isAuthenticated && !reviewData?.canReview}>
          {reviewData?.hasReviewed ? "Đã đánh giá" : "Viết đánh giá"} <MessageSquare size={16} />
        </button>
      </div>

      {!isAuthenticated ? (
        <div className="mb-8 rounded-[2rem] border border-blue-100 bg-blue-50 px-6 py-4 text-sm font-medium text-blue-700">Đăng nhập và mua sản phẩm để gửi đánh giá thực tế.</div>
      ) : reviewData?.hasPurchased ? reviewData?.hasReviewed ? (
        <div className="mb-8 rounded-[2rem] border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm font-medium text-emerald-700">Bạn đã đánh giá sản phẩm này rồi. Cảm ơn bạn đã chia sẻ trải nghiệm.</div>
      ) : (
        <div className="mb-8 rounded-[2rem] border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm font-medium text-emerald-700">Bạn đã mua sản phẩm này. Hãy chia sẻ trải nghiệm thực tế của mình nhé.</div>
      ) : (
        <div className="mb-8 rounded-[2rem] border border-amber-100 bg-amber-50 px-6 py-4 text-sm font-medium text-amber-700">Chỉ khách hàng đã mua và nhận sản phẩm mới có thể đánh giá.</div>
      )}

      <motion.div layout className="min-h-[400px] space-y-8">
        <AnimatePresence mode="popLayout">
          {filteredReviews.length > 0 ? filteredReviews.map((rev) => (
            <motion.div key={rev.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="group relative overflow-hidden rounded-[2.5rem] border border-slate-50 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-8 md:flex-row">
                <div className="shrink-0 md:w-48">
                  <div className="flex items-center gap-4 md:flex-col md:items-start">
                    <div className="relative">
                      <img src={rev.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.user || "User")}&background=ffe4e6&color=e11d48`} className="h-14 w-14 rounded-2xl border-2 border-rose-100 object-cover" alt="user" />
                      <div className="absolute -bottom-1 -right-1 rounded-lg bg-rose-600 p-1 text-white"><Sparkles size={10} fill="currentColor" /></div>
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-slate-900">{rev.user}</h5>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-tighter text-slate-400">{formatDisplayDate(rev.createdAt, rev.date)}</p>
                    </div>
                  </div>
                  {rev.verified && <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-600 ring-1 ring-emerald-100"><CheckCircle2 size={12} /> Đã mua hàng</div>}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex gap-0.5 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} className={i >= rev.rating ? "text-slate-200" : ""} />
                    ))}
                  </div>
                  <p className="font-medium italic leading-relaxed text-slate-600">"{rev.comment}"</p>

                  {(rev.images || []).length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {rev.images.map((img, idx) => (
                        <div key={idx} onClick={() => setSelectedImg(img)} className="h-24 w-24 cursor-zoom-in overflow-hidden rounded-2xl border border-slate-100 shadow-md transition-transform hover:scale-105">
                          <img src={img} className="h-full w-full object-cover" alt="review" />
                        </div>
                      ))}
                    </div>
                  )}

                  {rev.shopReply ? (
                    <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-widest text-blue-600">Phản hồi từ shop</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                          {rev.shopReplyBy || "NovaShop"}
                          {rev.shopReplyAt ? ` • ${formatDisplayDate(rev.shopReplyAt)}` : ""}
                        </p>
                      </div>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">{rev.shopReply}</p>
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center gap-6 border-t border-slate-50 pt-6">
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 transition-colors hover:text-rose-600"><ThumbsUp size={14} /> Hữu ích ({rev.likes || 0})</button>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 transition-colors hover:text-rose-600"><MessageSquare size={14} /> Phản hồi</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50 py-20 text-center">
              <ImageIcon size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Không tìm thấy đánh giá phù hợp</p>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isWriteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="w-full max-w-xl overflow-hidden rounded-[3rem] bg-white shadow-2xl">
              <div className="flex items-center justify-between bg-slate-950 p-8 text-white">
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Chia sẻ trải nghiệm</h3>
                <button onClick={() => { setIsWriteModalOpen(false); resetForm(); }} className="rounded-full p-2 transition-colors hover:bg-white/10"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmitReview} className="space-y-8 p-10">
                <div className="space-y-4 text-center">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-400">Bạn chấm bao nhiêu sao?</p>
                  <div className="flex justify-center gap-2 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setNewReview({ ...newReview, rating: s })} className="transition-transform hover:scale-125">
                        <Star size={40} fill={s <= newReview.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="ml-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Nội dung đánh giá</label>
                  <textarea rows="4" className="w-full rounded-[2rem] border-2 border-slate-100 bg-slate-50 p-6 font-medium text-slate-700 outline-none transition-all focus:border-rose-600 focus:bg-white" placeholder="Hãy chia sẻ cảm nhận thực tế của bạn về sản phẩm này nhé..." value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} />
                </div>

                <div className="space-y-3">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesChange} />
                  <button type="button" className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-4 text-[10px] font-black uppercase text-slate-400 transition-all hover:border-rose-600 hover:text-rose-600" onClick={() => fileInputRef.current?.click()}>
                    <Camera size={18} /> Thêm hình ảnh
                  </button>

                  {newReview.previews.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {newReview.previews.map((preview, index) => (
                        <div key={preview} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-slate-200">
                          <img src={preview} alt="preview" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => removePreview(index)} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 p-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-rose-200 transition-all hover:bg-rose-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
                    {submitting ? "Đang gửi..." : "Gửi đánh giá"} <Send size={16} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex cursor-zoom-out items-center justify-center bg-slate-950/95 p-6 backdrop-blur-md" onClick={() => setSelectedImg(null)}>
            <img src={selectedImg} className="max-h-[85vh] max-w-full rounded-3xl border-4 border-white/10 shadow-2xl" alt="zoom" />
            <div className="absolute right-8 top-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white"><X size={20} /> Click để đóng</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
