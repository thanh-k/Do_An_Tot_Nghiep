import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Eye, Send, RefreshCcw } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import PageHeader from "@/components/common/PageHeader";
import { useDebounce } from "@/hooks/useDebounce";
import useAuth from "@/hooks/useAuth";
import { hasAnyPermission } from "@/utils/permission";
import contactService from "@/services/contactService";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "NEW", label: "Mới" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "REPLIED", label: "Đã phản hồi" },
  { value: "CLOSED", label: "Đã đóng" },
];

const STATUS_LABELS = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  REPLIED: "Đã phản hồi",
  CLOSED: "Đã đóng",
};

function ContactManagementPage() {
  const { currentUser } = useAuth();
  const canView = hasAnyPermission(currentUser, ["CONTACT_VIEW"]);
  const canReply = hasAnyPermission(currentUser, ["CONTACT_REPLY"]);
  const canUpdate = hasAnyPermission(currentUser, ["CONTACT_UPDATE"]);

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalState, setModalState] = useState({ open: false, contact: null, mode: "view" });
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const debouncedKeyword = useDebounce(keyword, 300);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await contactService.getAdminContacts({
        keyword: debouncedKeyword,
        status: statusFilter,
      });
      setContacts(data);
    } catch (error) {
      toast.error(error.message || "Tải danh sách liên hệ thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) loadContacts();
  }, [canView, debouncedKeyword, statusFilter]);

  const selectedContact = modalState.contact;

  useEffect(() => {
    setReplyContent(selectedContact?.replyContent || "");
  }, [selectedContact, modalState.open]);

  const summary = useMemo(() => ({
    total: contacts.length,
    pending: contacts.filter((item) => item.status === "NEW" || item.status === "IN_PROGRESS").length,
    replied: contacts.filter((item) => item.status === "REPLIED").length,
  }), [contacts]);

  const columns = [
    { key: "stt", title: "STT", render: (_row, index) => index + 1 },
    {
      key: "person",
      title: "Khách liên hệ",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.fullName}</p>
          <p className="text-xs text-slate-500">{row.phone}</p>
        </div>
      ),
    },
    {
      key: "email",
      title: "Email",
      render: (row) => row.email,
    },
    {
      key: "message",
      title: "Nội dung",
      render: (row) => <p className="max-w-md line-clamp-2 text-sm text-slate-600">{row.message}</p>,
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (row) => {
        const styles = {
          NEW: "text-amber-600",
          IN_PROGRESS: "text-blue-600",
          REPLIED: "text-emerald-600",
          CLOSED: "text-slate-500",
        };
        return <span className={`font-semibold ${styles[row.status] || "text-slate-700"}`}>{STATUS_LABELS[row.status] || row.status}</span>;
      },
    },
    {
      key: "createdAt",
      title: "Ngày gửi",
      render: (row) => row.createdAtLabel,
    },
    {
      key: "actions",
      title: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setModalState({ open: true, contact: row, mode: "view" })}>
            <Eye size={14} />Xem
          </Button>
          {canReply ? (
            <Button size="sm" variant="secondary" onClick={() => setModalState({ open: true, contact: row, mode: "reply" })}>
              <Send size={14} />Phản hồi
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const handleUpdateStatus = async (status) => {
    if (!selectedContact) return;
    setSubmitting(true);
    try {
      await contactService.updateStatus(selectedContact.id, status);
      toast.success("Đã cập nhật trạng thái liên hệ");
      setModalState({ open: false, contact: null, mode: "view" });
      await loadContacts();
    } catch (error) {
      toast.error(error.message || "Cập nhật trạng thái thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedContact) return;
    if (!replyContent.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    setSubmitting(true);
    try {
      await contactService.reply(selectedContact.id, replyContent.trim());
      toast.success("Đã gửi phản hồi qua email");
      setModalState({ open: false, contact: null, mode: "view" });
      await loadContacts();
    } catch (error) {
      toast.error(error.message || "Gửi phản hồi thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canView) {
    return <div className="card p-8 text-center text-sm font-medium text-rose-600">Bạn không đủ quyền hạn để dùng chức năng này.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý liên hệ"
        description="Tiếp nhận, theo dõi và phản hồi các liên hệ gửi từ trang client."
        actions={
          <Button variant="secondary" onClick={loadContacts}>
            <RefreshCcw size={16} />Làm mới
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Tổng liên hệ</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.total}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Đang chờ xử lý</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{summary.pending}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Đã phản hồi</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{summary.replied}</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_240px]">
          <Input
            label="Tìm kiếm liên hệ"
            placeholder="Tìm theo tên, email hoặc số điện thoại"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Lọc trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-500">Đang tải danh sách liên hệ...</div>
      ) : (
        <DataTable columns={columns} data={contacts} pagination={{ enabled: true, pageSize: 8, itemLabel: "liên hệ" }} />
      )}

      <Modal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, contact: null, mode: "view" })}
        title={modalState.mode === "reply" ? "Phản hồi liên hệ" : "Chi tiết liên hệ"}
        description="Theo dõi nội dung khách hàng gửi từ form liên hệ ngoài client."
        size="lg"
      >
        {selectedContact ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Họ và tên</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{selectedContact.fullName}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Số điện thoại</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{selectedContact.phone}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Email</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{selectedContact.email}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Trạng thái</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{STATUS_LABELS[selectedContact.status] || selectedContact.status}</p>
              </div>
            </div>

            <Input label="Nội dung khách gửi" value={selectedContact.message} textarea rows={5} readOnly />

            {selectedContact.replyContent ? (
              <Input label="Nội dung phản hồi gần nhất" value={selectedContact.replyContent} textarea rows={4} readOnly />
            ) : null}

            {modalState.mode === "reply" ? (
              <Input
                label="Nội dung phản hồi"
                textarea
                rows={5}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Nhập nội dung phản hồi gửi cho khách hàng"
              />
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              {canUpdate ? (
                <>
                  <Button variant="ghost" onClick={() => handleUpdateStatus("IN_PROGRESS")} loading={submitting}>
                    Đánh dấu đang xử lý
                  </Button>
                  <Button variant="secondary" onClick={() => handleUpdateStatus("CLOSED")} loading={submitting}>
                    Đóng liên hệ
                  </Button>
                </>
              ) : null}
              {modalState.mode === "reply" && canReply ? (
                <Button onClick={handleReply} loading={submitting}>
                  Gửi phản hồi
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => setModalState({ open: false, contact: null, mode: "view" })}>
                Đóng
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default ContactManagementPage;
