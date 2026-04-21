import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Star, Trash2, Power } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/admin/DataTable";
import NewsPostFormModal from "@/components/admin/NewsPostFormModal";
import newsService from "@/services/newsService";
import useAuth from "@/hooks/useAuth";
import { hasAnyPermission } from "@/utils/permission";
import { formatDate } from "@/utils/format";

function NewsPostManagementPage() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [topics, setTopics] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [topicSlug, setTopicSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ open: false, post: null });
  const [selectedIds, setSelectedIds] = useState([]);

  const canView = hasAnyPermission(currentUser, ["NEWS_POST_VIEW"]);
  const canCreate = hasAnyPermission(currentUser, ["NEWS_POST_CREATE"]);
  const canUpdate = hasAnyPermission(currentUser, ["NEWS_POST_UPDATE"]);
  const canDelete = hasAnyPermission(currentUser, ["NEWS_POST_DELETE"]);
  const canPublish = hasAnyPermission(currentUser, ["NEWS_POST_PUBLISH"]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicData, postData] = await Promise.all([
        newsService.getAdminTopics(),
        newsService.getAdminPosts({ keyword, status, topicSlug }),
      ]);
      setTopics(topicData);
      setPosts(postData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (canView) loadData(); }, [canView, status, topicSlug]);

  const filtered = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    return posts.filter((post) => {
      return !search || [post.title, post.summary, post.topicName].filter(Boolean).join(" ").toLowerCase().includes(search);
    });
  }, [keyword, posts]);

  const visibleIds = filtered.map((post) => post.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };
  const toggleOne = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  const selectedPosts = posts.filter((post) => selectedIds.includes(post.id));

  const updateOneStatus = async (row) => {
    const nextStatus = row.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
    await newsService.updatePostStatus(row.id, nextStatus);
  };

  const runBulkStatus = async () => {
    if (!selectedPosts.length) return;
    const willHide = selectedPosts.some((post) => post.status === "PUBLISHED");
    const confirmed = window.confirm(willHide ? `Ẩn ${selectedPosts.length} bài viết đã chọn khỏi client?` : `Xuất bản ${selectedPosts.length} bài viết đã chọn?`);
    if (!confirmed) return;
    try {
      for (const post of selectedPosts) {
        const nextStatus = post.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
        await newsService.updatePostStatus(post.id, nextStatus);
      }
      toast.success("Đã cập nhật trạng thái các bài viết đã chọn");
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      toast.error(error.message || "Cập nhật trạng thái bài viết thất bại");
    }
  };

  const runBulkDelete = async () => {
    if (!selectedPosts.length) return;
    const confirmed = window.confirm(`Xóa ${selectedPosts.length} bài viết đã chọn?`);
    if (!confirmed) return;
    try {
      for (const post of selectedPosts) {
        await newsService.deletePost(post.id);
      }
      toast.success("Đã xóa các bài viết đã chọn");
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      toast.error(error.message || "Xóa bài viết thất bại");
    }
  };

  const columns = [
    { key: "select", title: <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />, render: (row) => <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleOne(row.id)} /> },
    { key: "stt", title: "STT", render: (_, index) => index + 1 },
    { key: "post", title: "Bài viết", render: (row) => <div className="flex gap-3"><img src={row.thumbnail} alt={row.title} className="h-14 w-14 rounded-xl object-cover" /><div><p className="max-w-md font-semibold text-slate-900 line-clamp-2">{row.title}</p><p className="text-xs text-slate-500">{row.slug}</p></div></div> },
    { key: "topic", title: "Chủ đề", render: (row) => row.topicName },
    { key: "status", title: "Trạng thái", render: (row) => <span className={row.status === "PUBLISHED" ? "font-semibold text-emerald-600" : row.status === "DRAFT" ? "font-semibold text-amber-600" : "font-semibold text-slate-500"}>{row.status === "PUBLISHED" ? "Đã xuất bản" : row.status === "DRAFT" ? "Bản nháp" : "Đã ẩn"}</span> },
    { key: "featured", title: "Nổi bật", render: (row) => row.featured ? <span className="font-semibold text-rose-600">Tiêu điểm</span> : <span className="text-slate-400">Bình thường</span> },
    { key: "publishedAt", title: "Ngày đăng", render: (row) => formatDate(row.publishedAt || row.createdAt) },
    { key: "viewCount", title: "Lượt xem", render: (row) => row.viewCount || 0 },
    {
      key: "actions",
      title: "Thao tác",
      align: "right",
      render: (row) => <div className="flex justify-end gap-2">{canUpdate ? <Button size="sm" variant="outline" onClick={() => setModalState({ open: true, post: row })}><Pencil size={14} />Sửa</Button> : null}{canPublish ? <Button size="sm" variant="secondary" onClick={async()=>{ try { await updateOneStatus(row); toast.success("Đã cập nhật trạng thái bài viết"); await loadData(); } catch (error) { toast.error(error.message || "Cập nhật trạng thái bài viết thất bại"); } }}><Power size={14} />{row.status === "PUBLISHED" ? "Ẩn khỏi client" : "Xuất bản"}</Button> : null}{canUpdate ? <Button size="sm" variant="ghost" onClick={async()=>{ await newsService.toggleFeatured(row.id); toast.success("Đã cập nhật bài viết nổi bật"); loadData(); }}><Star size={14} className={row.featured ? "fill-current text-yellow-500" : ""} />Nổi bật</Button> : null}{canDelete ? <Button size="sm" variant="danger" onClick={async()=>{ if(!window.confirm(`Xóa bài viết "${row.title}"?`)) return; await newsService.deletePost(row.id); toast.success("Đã xóa bài viết"); loadData(); }}><Trash2 size={14} />Xóa</Button> : null}</div>,
    },
  ];

  const handleSave = async (payload) => {
    try {
      await newsService.savePost(payload);
      toast.success(payload.id ? "Cập nhật bài viết thành công" : "Tạo bài viết thành công");
      setModalState({ open: false, post: null });
      await loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!canView) return <div className="card p-8 text-center text-sm font-medium text-rose-600">Bạn không đủ quyền hạn để dùng chức năng này.</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý bài viết tin tức" description="Quản lý bài viết hiển thị tại trang Tin tức ngoài client, bao gồm trạng thái và bài viết nổi bật." actions={canCreate ? <Button onClick={() => setModalState({ open: true, post: null })}><Plus size={16} />Thêm bài viết</Button> : null} />
      <div className="card grid gap-4 p-4 lg:grid-cols-[1fr_220px_220px]">
        <Input placeholder="Tìm theo tiêu đề, mô tả hoặc chủ đề..." value={keyword} onChange={(e)=>setKeyword(e.target.value)} />
        <select value={topicSlug} onChange={(e)=>setTopicSlug(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100">
          <option value="">Tất cả chủ đề</option>
          {topics.map((topic) => <option key={topic.id} value={topic.slug}>{topic.name}</option>)}
        </select>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100">
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="HIDDEN">Đã ẩn</option>
        </select>
      </div>
      {selectedIds.length > 0 ? (
        <div className="card flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-medium text-slate-600">Đã chọn {selectedIds.length} bài viết</span>
          {canPublish ? <Button size="sm" variant="secondary" onClick={runBulkStatus}><Power size={14} />Ẩn/Xuất bản đã chọn</Button> : null}
          {canDelete ? <Button size="sm" variant="danger" onClick={runBulkDelete}><Trash2 size={14} />Xóa đã chọn</Button> : null}
        </div>
      ) : null}
      {loading ? <div className="card p-8 text-center text-sm text-slate-500">Đang tải bài viết...</div> : <DataTable columns={columns} data={filtered} pagination={{ enabled: true, pageSize: 8, itemLabel: "bài viết" }} />}
      <NewsPostFormModal isOpen={modalState.open} onClose={() => setModalState({ open: false, post: null })} initialPost={modalState.post} topics={topics.filter((item) => item.active)} onSubmit={handleSave} />
    </div>
  );
}

export default NewsPostManagementPage;
