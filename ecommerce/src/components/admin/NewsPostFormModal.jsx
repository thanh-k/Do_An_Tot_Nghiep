import { useEffect, useMemo, useState } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

const getInitialState = (post) => ({
  id: post?.id || "",
  title: post?.title || "",
  summary: post?.summary || "",
  content: post?.content || "",
  thumbnail: post?.thumbnail || "",
  topicId: post?.topicId || "",
  status: post?.status || "DRAFT",
  featured: post?.featured || false,
});

function NewsPostFormModal({ isOpen, onClose, initialPost, topics = [], onSubmit }) {
  const [form, setForm] = useState(getInitialState(initialPost));
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(getInitialState(initialPost));
    setFile(null);
  }, [initialPost, isOpen]);

  const previewUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return form.thumbnail || "";
  }, [file, form.thumbnail]);

  useEffect(() => {
    return () => {
      if (file && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, previewUrl]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        topicId: Number(form.topicId),
        file,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialPost ? "Cập nhật bài viết" : "Thêm bài viết mới"}
      description="Quản lý bài viết hiển thị tại trang Tin tức ngoài client."
      size="xl"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Input label="Tiêu đề" value={form.title} onChange={(e) => updateField("title", e.target.value)} required />
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Chủ đề</label>
            <select
              value={form.topicId}
              onChange={(e) => updateField("topicId", e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              required
            >
              <option value="">Chọn chủ đề</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </div>
        </div>

        <Input label="Mô tả ngắn" textarea rows={3} value={form.summary} onChange={(e) => updateField("summary", e.target.value)} />

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Ảnh thumbnail</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
          <p className="text-xs text-slate-500">Chọn ảnh từ máy tính, hệ thống sẽ upload lên server giống luồng category/user.</p>
          {previewUrl ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <img src={previewUrl} alt="Thumbnail preview" className="h-48 w-full rounded-xl object-cover" />
            </div>
          ) : null}
        </div>

        <Input label="Nội dung bài viết (HTML hỗ trợ)" textarea rows={10} value={form.content} onChange={(e) => updateField("content", e.target.value)} required />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            >
              <option value="DRAFT">Bản nháp</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="HIDDEN">Ẩn</option>
            </select>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 lg:mt-8">
            <input type="checkbox" checked={form.featured} onChange={(e) => updateField("featured", e.target.checked)} />
            Đặt làm bài viết nổi bật
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
          <Button type="submit" loading={submitting}>{initialPost ? "Lưu thay đổi" : "Tạo bài viết"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default NewsPostFormModal;
