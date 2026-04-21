export const ADMIN_ENTRY_PERMISSIONS = [
  "USER_VIEW",
  "CUSTOMER_VIEW",
  "STAFF_VIEW",
  "PRODUCT_VIEW",
  "CATEGORY_VIEW",
  "ORDER_VIEW",
  "ROLE_MANAGE",
  "ROLE_ASSIGN",
  "PHONE_PREFIX_VIEW",
  "PHONE_PREFIX_MANAGE",
  "ANALYTICS_VIEW",
];

export function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

export function normalizePermissions(user) {
  if (!user || !Array.isArray(user.permissions)) return [];
  return user.permissions.map((permission) => String(permission || "").trim().toUpperCase());
}

export function hasPermission(user, permission) {
  const permissions = normalizePermissions(user);
  return permissions.includes(String(permission || "").trim().toUpperCase());
}

export function hasAnyPermission(user, requiredPermissions = []) {
  if (!requiredPermissions.length) return true;

  const role = normalizeRole(user?.role);
  if (role === "SUPER_ADMIN") {
    return true;
  }

  const permissions = normalizePermissions(user);
  const normalizedRequired = requiredPermissions.map((item) => String(item || "").trim().toUpperCase());
  return normalizedRequired.some((permission) => permissions.includes(permission));
}

export function canAccessAdminPanel(user) {
  return hasAnyPermission(user, ADMIN_ENTRY_PERMISSIONS);
}
