export function hasPermission(user, code) {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(code);
}

export function hasAnyPermission(user, codes = []) {
  return codes.some((code) => hasPermission(user, code));
}
