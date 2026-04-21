import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/routes/ProtectedRoute";
import AuthLayout from "@/layouts/AuthLayout";
import MainLayout from "@/layouts/MainLayout";
import AdminLayout from "@/layouts/AdminLayout";
import { authRoutes } from "@/routes/authRoutes";
import { userRoutes } from "@/routes/userRoutes";
import { adminRoutes } from "@/routes/adminRoutes";
import NotFoundPage from "@/pages/shared/NotFoundPage";

function renderRoute(route) {
  const Element = route.component;
  const element = <Element />;

  const content = route.permissions?.length ? (
    <ProtectedRoute permissions={route.permissions}>{element}</ProtectedRoute>
  ) : route.roles?.length ? (
    <ProtectedRoute roles={route.roles}>{element}</ProtectedRoute>
  ) : (
    element
  );

  if (route.index) {
    return <Route key={`index-${Element.name}`} index element={content} />;
  }

  return <Route key={route.path} path={route.path} element={content} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        {authRoutes.map((route) => {
          const Element = route.component;
          return <Route key={route.path} path={route.path} element={<Element />} />;
        })}
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {adminRoutes.map(renderRoute)}
      </Route>

      <Route element={<MainLayout />}>
        {userRoutes.map(renderRoute)}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
