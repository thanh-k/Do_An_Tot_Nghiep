import { Navigate, useLocation } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { canAccessAdminPanel, hasAnyPermission, normalizeRole } from "@/utils/permission";

function ProtectedRoute({
  children,
  roles = [],
  permissions = [],
  requireAdmin = false,
}) {
  const { currentUser, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && !canAccessAdminPanel(currentUser)) {
    return <Navigate to="/" replace />;
  }

  if (roles.length) {
    const currentRole = normalizeRole(currentUser.role);
    const normalizedRoles = roles.map((item) => normalizeRole(item));

    if (!normalizedRoles.includes(currentRole)) {
      return <Navigate to="/" replace />;
    }
  }

  if (permissions.length && !hasAnyPermission(currentUser, permissions)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Bạn không đủ quyền hạn để dùng chức năng này.
          </h2>
          <p className="mt-3 text-slate-500">
            Vui lòng liên hệ quản trị viên nếu bạn cần được cấp quyền truy cập.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
