import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

function ReviewDetailModal({
  isOpen,
  onClose,
  review,
  canReply,
  canUpdate,
  canDelete,
  onSaveReply,
  onDeleteReply,
  onToggleVisibility,
  onDeleteReview,
}) {
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setReplyContent(review?.shopReply || "");
  }, [review, isOpen]);

  const handleSaveReply = async () => {
    if (!canReply) return;
    if (!replyContent.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    setSubmitting(true);
    try {
      await onSaveReply?.(replyContent.trim(), Boolean(review?.shopReply));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!review?.shopReply) return;
    if (!window.confirm("Bạn có chắc muốn xóa phản hồi của shop?")) return;
    setSubmitting(true);
    try {
      await onDeleteReply?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    setSubmitting(true);
    try {
      await onDeleteReview?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết đánh giá"
      description="Xem chi tiết, kiểm duyệt và phản hồi đánh giá từ khách hàng."
      size="lg"
    >
      {review ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Sản phẩm</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{review.productName}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Khách hàng</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{review.userName}</p>
              <p className="mt-1 text-xs text-slate-500">{review.userEmail}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Số sao</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{review.rating}/5</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Đơn hàng liên quan</p>
              <p className="mt-2 text-sm font-medium text-slate-900">#{review.orderId || "---"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Trạng thái hiển thị</p>
              <p className={`mt-2 text-sm font-semibold ${review.visible ? "text-emerald-600" : "text-rose-600"}`}>
                {review.visible ? "Đang hiển thị" : "Đã ẩn"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Xác minh mua hàng</p>
              <p className={`mt-2 text-sm font-semibold ${review.verifiedPurchase ? "text-emerald-600" : "text-slate-500"}`}>
                {review.verifiedPurchase ? "Đã mua hàng" : "Chưa xác minh"}
              </p>
            </div>
          </div>

          <Input label="Nội dung đánh giá" value={review.comment || ""} textarea rows={5} readOnly />

          {review.images?.length ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Ảnh đính kèm</p>
              <div className="flex flex-wrap gap-3">
                {review.images.map((image) => (
                  <img key={image} src={image} alt="review" className="h-24 w-24 rounded-2xl object-cover border border-slate-200" />
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Phản hồi từ shop</p>
              {review.shopReply ? (
                <div className="mt-3 rounded-2xl bg-white p-4 border border-slate-200">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{review.shopReply}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {review.shopReplyBy ? `Bởi ${review.shopReplyBy}` : "Shop phản hồi"}
                    {review.shopReplyAtLabel ? ` • ${review.shopReplyAtLabel}` : ""}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Chưa có phản hồi từ shop.</p>
              )}
            </div>

            {canReply ? (
              <>
                <Input
                  label="Nội dung phản hồi"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  textarea
                  rows={4}
                />
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSaveReply} loading={submitting}>
                    {review.shopReply ? "Cập nhật phản hồi" : "Gửi phản hồi"}
                  </Button>
                  {review.shopReply ? (
                    <Button variant="outline" onClick={handleDeleteReply} loading={submitting}>
                      Xóa phản hồi
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
            {canUpdate ? (
              <Button
                variant={review.visible ? "outline" : "secondary"}
                onClick={() => onToggleVisibility?.(!review.visible)}
                loading={submitting}
              >
                {review.visible ? "Ẩn đánh giá" : "Hiện lại đánh giá"}
              </Button>
            ) : null}
            {canDelete ? (
              <Button variant="danger" onClick={handleDeleteReview} loading={submitting}>
                Xóa đánh giá
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default ReviewDetailModal;
