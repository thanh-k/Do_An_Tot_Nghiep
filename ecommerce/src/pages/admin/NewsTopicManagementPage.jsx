import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/admin/DataTable";
import NewsTopicFormModal from "@/components/admin/NewsTopicFormModal";
import newsService from "@/services/newsService";
import useAuth from "@/hooks/useAuth";
import { hasAnyPermission } from "@/utils/permission";

function NewsTopicManagementPage() {
  const { currentUser } = useAuth();
  const [topics, setTopics] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ open: false, topic: null });
  const [selectedIds, setSelectedIds] = useState([]);

  const canView = hasAnyPermission(currentUser, ["NEWS_TOPIC_VIEW"]);
  const canCreate = hasAnyPermission(currentUser, ["NEWS_TOPIC_CREATE"]);
  const canUpdate = hasAnyPermission(currentUser, ["NEWS_TOPIC_UPDATE"]);
  const canDelete = hasAnyPermission(currentUser, ["NEWS_TOPIC_DELETE"]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicData, postData] = await Promise.all([
        newsService.getAdminTopics(),
        newsService.getAdminPosts(),
      ]);
      const counts = postData.reduce((acc, post) => {
        if (post.topicId) acc[post.topicId] = (acc[post.topicId] || 0) + 1;
        return acc;
      }, {});
      setTopics(topicData.map((topic) => ({ ...topic, postCount: counts[topic.id] || topic.postCount || 0 })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (canView) loadData(); }, [canView]);

  const filtered = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return topics;
    return topics.filter((topic) =>
      [topic.name, topic.slug, topic.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [keyword, topics]);

  const visibleIds = filtered.map((topic) => topic.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const selectedTopics = topics.filter((topic) => selectedIds.includes(topic.id));

  const handleToggleTopic = async (topic, force = null) => {
    const shouldForce = force ?? (topic.postCount > 0 && topic.active);
    await newsService.toggleTopicStatus(topic.id, shouldForce);
  };

  const handleDeleteTopic = async (topic, force = null) => {
    const shouldForce = force ?? topic.postCount > 0;
    await newsService.deleteTopic(topic.id, shouldForce);
  };

  const runBulkToggle = async () => {
    if (!selectedTopics.length) return;
    const affected = selectedTopics.filter((topic) => topic.active && topic.postCount > 0);
    const confirmed = affected.length
      ? window.confirm(`Có ${affected.length} chủ đề đang có bài viết. Nếu tiếp tục ẩn, toàn bộ bài viết thuộc các chủ đề này cũng sẽ bị ẩn. Bạn có đồng ý không?`)
      : window.confirm(`Ẩn/hiện ${selectedTopics.length} chủ đề đã chọn?`);
    if (!confirmed) return;
    try {
      for (const topic of selectedTopics) {
        await handleToggleTopic(topic, topic.active && topic.postCount > 0);
      }
      toast.success("Đã cập nhật trạng thái các chủ đề đã chọn");
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      toast.error(error.message || "Ẩn/hiện chủ đề thất bại");
    }
  };

  const runBulkDelete = async () => {
    if (!selectedTopics.length) return;
    const affected = selectedTopics.filter((topic) => topic.postCount > 0);
    const confirmed = affected.length
      ? window.confirm(`Có ${affected.length} chủ đề đang có bài viết. Nếu tiếp tục xóa, toàn bộ bài viết thuộc các chủ đề này cũng sẽ bị xóa. Bạn có đồng ý không?`)
      : window.confirm(`Xóa ${selectedTopics.length} chủ đề đã chọn?`);
    if (!confirmed) return;
    try {
      for (const topic of selectedTopics) {
        await handleDeleteTopic(topic, topic.postCount > 0);
      }
      toast.success("Đã xóa các chủ đề đã chọn");
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      toast.error(error.message || "Xóa chủ đề thất bại");
    }
  };

  const columns = [
    {
      key: "select",
      title: (
        <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
      ),
      render: (row) => (
        <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleOne(row.id)} />
      ),
    },
    { key: "stt", title: "STT", render: (_, index) => index + 1 },
    {
      key: "name",
      title: "Chủ đề",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.slug}</p>
        </div>
      ),
    },
    {
      key: "description",
      title: "Mô tả",
      render: (row) => (
        <p className="max-w-xl text-sm text-slate-500 line-clamp-2">{row.description || "Chưa có mô tả"}</p>
      ),
    },
    {
      key: "active",
      title: "Trạng thái",
      render: (row) => row.active ? <span className="font-semibold text-emerald-600">Đang dùng</span> : <span className="font-semibold text-rose-600">Đã ẩn</span>,
    },
    { key: "displayOrder", title: "Thứ tự", render: (row) => <span className="font-semibold text-brand-700">{row.displayOrder}</span> },
    { key: "postCount", title: "Số bài viết", render: (row) => <span className="font-semibold text-slate-700">{row.postCount || 0}</span> },
    {
      key: "actions",
      title: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          {canUpdate ? <Button size="sm" variant="outline" onClick={() => setModalState({ open: true, topic: row })}><Pencil size={14} />Sửa</Button> : null}
          {canUpdate ? <Button size="sm" variant="secondary" onClick={async () => {
            try {
              if (row.postCount > 0 && row.active) {
                const confirmed = window.confirm(`Chủ đề "${row.name}" hiện có ${row.postCount} bài viết. Nếu tiếp tục ẩn, toàn bộ bài viết thuộc chủ đề này cũng sẽ bị ẩn. Bạn có đồng ý không?`);
                if (!confirmed) return;
              }
              await handleToggleTopic(row);
              toast.success("Đã cập nhật trạng thái chủ đề");
              await loadData();
            } catch (error) {
              toast.error(error.message || "Ẩn/hiện chủ đề thất bại");
            }
          }}><Power size={14} />{row.active ? "Ẩn" : "Bật lại"}</Button> : null}
          {canDelete ? <Button size="sm" variant="danger" onClick={async () => {
            try {
              const confirmed = row.postCount > 0
                ? window.confirm(`Chủ đề "${row.name}" hiện có ${row.postCount} bài viết. Nếu tiếp tục xóa, toàn bộ bài viết thuộc chủ đề này cũng sẽ bị xóa. Bạn có đồng ý không?`)
                : window.confirm(`Bạn có chắc muốn xóa chủ đề "${row.name}" không?`);
              if (!confirmed) return;
              await handleDeleteTopic(row);
              toast.success("Đã xóa chủ đề");
              await loadData();
            } catch (error) {
              toast.error(error.message || "Xóa chủ đề thất bại");
            }
          }}><Trash2 size={14} />Xóa</Button> : null}
        </div>
      ),
    },
  ];

  const handleSave = async (payload) => {
    try {
      await newsService.saveTopic(payload);
      toast.success(payload.id ? "Cập nhật chủ đề thành công" : "Tạo chủ đề thành công");
      setModalState({ open: false, topic: null });
      await loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!canView) return <div className="card p-8 text-center text-sm font-medium text-rose-600">Bạn không đủ quyền hạn để dùng chức năng này.</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý chủ đề tin tức" description="Quản lý nhóm chủ đề hiển thị trên trang Tin tức và dùng để lọc bài viết." actions={canCreate ? <Button onClick={() => setModalState({ open: true, topic: null })}><Plus size={16} />Thêm chủ đề</Button> : null} />
      <div className="card p-4"><Input placeholder="Tìm theo tên chủ đề hoặc slug..." value={keyword} onChange={(e) => setKeyword(e.target.value)} /></div>
      {selectedIds.length > 0 ? (
        <div className="card flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-medium text-slate-600">Đã chọn {selectedIds.length} chủ đề</span>
          {canUpdate ? <Button size="sm" variant="secondary" onClick={runBulkToggle}><Power size={14} />Ẩn/Bật đã chọn</Button> : null}
          {canDelete ? <Button size="sm" variant="danger" onClick={runBulkDelete}><Trash2 size={14} />Xóa đã chọn</Button> : null}
        </div>
      ) : null}
      {loading ? <div className="card p-8 text-center text-sm text-slate-500">Đang tải chủ đề tin tức...</div> : <DataTable columns={columns} data={filtered} pagination={{ enabled: true, pageSize: 8, itemLabel: "chủ đề" }} />}
      <NewsTopicFormModal isOpen={modalState.open} onClose={() => setModalState({ open: false, topic: null })} initialTopic={modalState.topic} onSubmit={handleSave} />
    </div>
  );
}

export default NewsTopicManagementPage;
