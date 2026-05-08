import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { formatPermissionLabel } from "@/utils/permissionLabels";
import { Crown, CalendarClock, ShieldCheck, User } from "lucide-react";
import { formatDate } from "@/utils/format";

function UserDetailModal({ user, isOpen, onClose, onAssignRole, type = "customer" }) {
  if (!user) return null;

  const roleItems = user.roles?.length ? user.roles : [user.role].filter(Boolean);
  const showPermissions = type === "staff";
  const isVip = Boolean(user.vip);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết ${type === "staff" ? "nhân sự" : "khách hàng"}`}
      description={type === "staff" ? "Thông tin tài khoản và quyền hiện có." : "Thông tin tài khoản khách hàng và trạng thái hội viên."}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Họ và tên</p>
          <p className="mt-1 font-semibold text-slate-900">{user.fullName}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Email</p>
          <p className="mt-1 font-semibold text-slate-900">{user.email || "Chưa có email"}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Vai trò chính</p>
          <p className="mt-1 font-semibold text-slate-900">{user.role || roleItems[0] || "USER"}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Trạng thái</p>
          <p className="mt-1 font-semibold text-slate-900">{user.active ? "Hoạt động" : "Đã khóa"}</p>
        </div>
      </div>

      {type === "customer" ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Loại khách hàng</h4>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {isVip ? user.membershipName || "Khách hàng VIP" : "Khách hàng thường"}
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${isVip ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-700"}`}>
              {isVip ? <Crown size={14} /> : <User size={14} />}
              {isVip ? "VIP" : "THƯỜNG"}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-sm text-slate-500">Mã gói</p>
              <p className="mt-1 font-semibold text-slate-900">{user.membershipCode || "REGULAR"}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-sm text-slate-500">Trạng thái hội viên</p>
              <p className="mt-1 font-semibold text-slate-900">{user.membershipStatus || (isVip ? "ACTIVE" : "REGULAR")}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-sm text-slate-500 inline-flex items-center gap-2"><CalendarClock size={14} /> Bắt đầu</p>
              <p className="mt-1 font-semibold text-slate-900">{user.membershipStartedAt ? formatDate(user.membershipStartedAt) : "Chưa có"}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-sm text-slate-500 inline-flex items-center gap-2"><CalendarClock size={14} /> Hết hạn</p>
              <p className="mt-1 font-semibold text-slate-900">{user.membershipEndedAt ? formatDate(user.membershipEndedAt) : "Chưa có"}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`mt-6 grid gap-4 ${showPermissions ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Roles</h4>
          <div className="flex flex-wrap gap-2">
            {roleItems.length ? roleItems.map((role) => (
              <span key={role} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {role}
              </span>
            )) : <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Chưa có role</span>}
          </div>
        </div>

        {showPermissions ? (
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Nhiệm vụ được giao</h4>
            <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto">
              {(user.permissions?.length ? user.permissions : ["Chưa có quyền chi tiết"]).map((permission) => (
                <span key={permission} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  {permission === "Chưa có quyền chi tiết" ? permission : formatPermissionLabel(permission)}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {type === "staff" && onAssignRole ? <Button onClick={() => onAssignRole(user)}>Đổi quyền</Button> : null}
        <Button variant="secondary" onClick={onClose}>Đóng</Button>
      </div>
    </Modal>
  );
}

export default UserDetailModal;
