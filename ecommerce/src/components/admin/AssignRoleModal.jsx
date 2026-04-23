import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { formatPermissionLabel } from "@/utils/permissionLabels";

function AssignRoleModal({ user, roles, isOpen, onClose, onSubmit }) {
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  useEffect(() => {
    if (!user) return;
    const current = roles
      .filter((role) => user.roles?.includes(role.code) || user.role === role.code)
      .map((role) => role.id);
    setSelectedRoleIds(current);
  }, [user, roles]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gán vai trò cho người dùng" description="Chọn một hoặc nhiều vai trò cho tài khoản này.">
      {!user ? null : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Đang chỉnh quyền cho <span className="font-semibold text-slate-900">{user.fullName}</span> ({user.email})
          </div>
          <div className="grid gap-3">
            {roles.map((role) => {
              const checked = selectedRoleIds.includes(role.id);
              return (
                <label key={role.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      if (event.target.checked) setSelectedRoleIds((prev) => [...prev, role.id]);
                      else setSelectedRoleIds((prev) => prev.filter((id) => id !== role.id));
                    }}
                  />
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900">
                      {role.name} <span className="text-xs text-slate-500">({role.code})</span>
                    </p>
                    <p className="text-sm text-slate-500">{role.description || "Không có mô tả"}</p>
                    <div className="flex flex-wrap gap-2">
                      {(role.permissions?.length ? role.permissions : []).map((permission) => (
                        <span key={permission.id || permission.code} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                          {formatPermissionLabel(permission.code || permission)}
                        </span>
                      ))}
                      {!role.permissions?.length ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Chưa có nhiệm vụ</span>
                      ) : null}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Hủy</Button>
            <Button onClick={() => onSubmit(selectedRoleIds)} disabled={!selectedRoleIds.length}>Lưu quyền</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default AssignRoleModal;
