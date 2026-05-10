import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Eye, RefreshCcw, MessageSquare, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import ReviewDetailModal from "@/components/admin/ReviewDetailModal";
import { useDebounce } from "@/hooks/useDebounce";
import useAuth from "@/hooks/useAuth";
import { hasAnyPermission } from "@/utils/permission";
import adminReviewService from "@/services/admin/reviewService";

const RATING_OPTIONS = [
  { value: "", label: "Tất cả số sao" },
  { value: "5", label: "5 sao" },
  { value: "4", label: "4 sao" },
  { value: "3", label: "3 sao" },
  { value: "2", label: "2 sao" },
  { value: "1", label: "1 sao" },
];

const VISIBILITY_OPTIONS = [
  { value: "", label: "Tất cả hiển thị" },
  { value: "true", label: "Đang hiển thị" },
  { value: "false", label: "Đã ẩn" },
];

const VERIFIED_OPTIONS = [
  { value: "", label: "Tất cả xác minh" },
  { value: "true", label: "Đã mua hàng" },
  { value: "false", label: "Chưa xác minh" },
];

const REPLIED_OPTIONS = [
  { value: "", label: "Tất cả phản hồi" },
  { value: "true", label: "Đã phản hồi" },
  { value: "false", label: "Chưa phản hồi" },
];

function parseBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function ReviewManagementPage() {
  const { currentUser } = useAuth();
  const canView = hasAnyPermission(currentUser, ["REVIEW_VIEW"]);
  const canUpdate = hasAnyPermission(currentUser, ["REVIEW_UPDATE"]);
  const canDelete = hasAnyPermission(currentUser, ["REVIEW_DELETE"]);
  const canReply = hasAnyPermission(currentUser, ["REVIEW_REPLY", "REVIEW_UPDATE"]);

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [repliedFilter, setRepliedFilter] = useState("");
  const [modalState, setModalState] = useState({ open: false, review: null });
  const debouncedKeyword = useDebounce(keyword, 300);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await adminReviewService.getReviews({
        keyword: debouncedKeyword,
        rating: ratingFilter,
        visible: parseBoolean(visibilityFilter),
        verified: parseBoolean(verifiedFilter),
        replied: parseBoolean(repliedFilter),
      });
      setReviews(data);
    } catch (error) {
      toast.error(error.message || "Tải danh sách đánh giá thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) loadReviews();
  }, [canView, debouncedKeyword, ratingFilter, visibilityFilter, verifiedFilter, repliedFilter]);

  const summary = useMemo(() => ({
    total: reviews.length,
    visible: reviews.filter((item) => item.visible).length,
    hidden: reviews.filter((item) => !item.visible).length,
    replied: reviews.filter((item) => item.shopReply).length,
  }), [reviews]);

  const openDetail = async (review) => {
    setModalState({ open: true, review });
    try {
      const detail = await adminReviewService.getReviewById(review.id);
      setModalState({ open: true, review: detail });
    } catch (error) {
      toast.error(error.message || "Không thể tải chi tiết đánh giá");
    }
  };

  const refreshAndKeepOpen = async (reviewId) => {
    await loadReviews();
    const detail = await adminReviewService.getReviewById(reviewId);
    setModalState({ open: true, review: detail });
  };

  const handleToggleVisibility = async (visible) => {
    if (!modalState.review) return;
    try {
      await adminReviewService.updateVisibility(modalState.review.id, visible);
      toast.success(visible ? "Đã hiện lại đánh giá" : "Đã ẩn đánh giá");
      await refreshAndKeepOpen(modalState.review.id);
    } catch (error) {
      toast.error(error.message || "Cập nhật hiển thị thất bại");
    }
  };

  const handleSaveReply = async (replyContent, hasReply) => {
    if (!modalState.review) return;
    try {
      if (hasReply) {
        await adminReviewService.updateReply(modalState.review.id, replyContent);
        toast.success("Đã cập nhật phản hồi từ shop");
      } else {
        await adminReviewService.createReply(modalState.review.id, replyContent);
        toast.success("Đã gửi phản hồi từ shop");
      }
      await refreshAndKeepOpen(modalState.review.id);
    } catch (error) {
      toast.error(error.message || "Lưu phản hồi thất bại");
    }
  };

  const handleDeleteReply = async () => {
    if (!modalState.review) return;
    try {
      await adminReviewService.deleteReply(modalState.review.id);
      toast.success("Đã xóa phản hồi từ shop");
      await refreshAndKeepOpen(modalState.review.id);
    } catch (error) {
      toast.error(error.message || "Xóa phản hồi thất bại");
    }
  };

  const handleDeleteReview = async () => {
    if (!modalState.review) return;
    try {
      await adminReviewService.deleteReview(modalState.review.id);
      toast.success("Đã xóa đánh giá");
      setModalState({ open: false, review: null });
      await loadReviews();
    } catch (error) {
      toast.error(error.message || "Xóa đánh giá thất bại");
    }
  };

  const columns = [
    { key: "stt", title: "STT", render: (_row, index) => index + 1 },
    {
      key: "product",
      title: "Sản phẩm",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.productName}</p>
          <p className="text-xs text-slate-500">#{row.productId}</p>
        </div>
      ),
    },
    {
      key: "user",
      title: "Khách hàng",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.userName}</p>
          <p className="text-xs text-slate-500">{row.userEmail}</p>
        </div>
      ),
    },
    {
      key: "rating",
      title: "Số sao",
      render: (row) => <span className="font-semibold text-amber-500">{row.rating}/5</span>,
    },
    {
      key: "comment",
      title: "Nội dung",
      render: (row) => <p className="max-w-md line-clamp-2 text-sm text-slate-600">{row.comment}</p>,
    },
    {
      key: "visible",
      title: "Hiển thị",
      render: (row) => (
        <span className={`font-semibold ${row.visible ? "text-emerald-600" : "text-rose-600"}`}>
          {row.visible ? "Đang hiển thị" : "Đã ẩn"}
        </span>
      ),
    },
    {
      key: "reply",
      title: "Phản hồi shop",
      render: (row) => (
        <span className={`font-semibold ${row.shopReply ? "text-blue-600" : "text-slate-400"}`}>
          {row.shopReply ? "Đã phản hồi" : "Chưa phản hồi"}
        </span>
      ),
    },
    { key: "createdAt", title: "Ngày tạo", render: (row) => row.createdAtLabel },
    {
      key: "actions",
      title: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openDetail(row)}>
            <Eye size={14} />Xem
          </Button>
          {canReply ? (
            <Button size="sm" variant="secondary" onClick={() => openDetail(row)}>
              <MessageSquare size={14} />Phản hồi
            </Button>
          ) : null}
          {canDelete ? (
            <Button size="sm" variant="danger" onClick={async () => { if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return; try { await adminReviewService.deleteReview(row.id); toast.success("Đã xóa đánh giá"); await loadReviews(); } catch (error) { toast.error(error.message || "Xóa đánh giá thất bại"); } }}>
              <Trash2 size={14} />Xóa
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  if (!canView) {
    return <div className="card p-8 text-center text-sm font-medium text-rose-600">Bạn không đủ quyền hạn để dùng chức năng này.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý đánh giá"
        description="Theo dõi, kiểm duyệt và phản hồi đánh giá sản phẩm từ khách hàng."
        actions={
          <Button variant="secondary" onClick={loadReviews}>
            <RefreshCcw size={16} />Làm mới
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-slate-500">Tổng đánh giá</p><p className="mt-2 text-3xl font-bold text-slate-900">{summary.total}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Đang hiển thị</p><p className="mt-2 text-3xl font-bold text-emerald-600">{summary.visible}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Đã ẩn</p><p className="mt-2 text-3xl font-bold text-rose-600">{summary.hidden}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Đã phản hồi</p><p className="mt-2 text-3xl font-bold text-blue-600">{summary.replied}</p></div>
      </div>

      <div className="card p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Input
            label="Tìm kiếm đánh giá"
            placeholder="Tìm theo sản phẩm, khách hàng, email, nội dung"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Lọc số sao</label><select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100">{RATING_OPTIONS.map((option)=><option key={option.label} value={option.value}>{option.label}</option>)}</select></div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Lọc hiển thị</label><select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100">{VISIBILITY_OPTIONS.map((option)=><option key={option.label} value={option.value}>{option.label}</option>)}</select></div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Lọc xác minh</label><select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100">{VERIFIED_OPTIONS.map((option)=><option key={option.label} value={option.value}>{option.label}</option>)}</select></div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Lọc phản hồi</label><select value={repliedFilter} onChange={(e) => setRepliedFilter(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100">{REPLIED_OPTIONS.map((option)=><option key={option.label} value={option.value}>{option.label}</option>)}</select></div>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-500">Đang tải danh sách đánh giá...</div>
      ) : (
        <DataTable columns={columns} data={reviews} pagination={{ enabled: true, pageSize: 8, itemLabel: "đánh giá" }} />
      )}

      <ReviewDetailModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, review: null })}
        review={modalState.review}
        canReply={canReply}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onSaveReply={handleSaveReply}
        onDeleteReply={handleDeleteReply}
        onToggleVisibility={handleToggleVisibility}
        onDeleteReview={handleDeleteReview}
      />
    </div>
  );
}

export default ReviewManagementPage;
