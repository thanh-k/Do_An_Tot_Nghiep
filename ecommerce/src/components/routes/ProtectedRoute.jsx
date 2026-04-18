import { Navigate, useLocation } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

function ProtectedRoute({ children, roles = [] }) {
  const { currentUser, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles.length && !roles.map((item) => item.toLowerCase()).includes(String(currentUser.role).toLowerCase())) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
