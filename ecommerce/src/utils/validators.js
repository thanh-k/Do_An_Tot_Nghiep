export const validateEmail = (email = "") => {
  const value = `${email}`.trim();
  if (!value) return true;
  if (value.length < 3 || value.length > 320) return false;
  const atIndex = value.indexOf("@");
  if (atIndex <= 0) return false;
  const dotIndex = value.indexOf(".", atIndex + 2);
  if (dotIndex === -1 || dotIndex === value.length - 1) return false;
  return true;
};

export const validatePassword = (password = "") => password.trim().length >= 6;

export const validateRequired = (value) =>
  value !== undefined && value !== null && `${value}`.trim().length > 0;

export const validateFullName = (value = "") =>
  /^[\p{L} ]{2,100}$/u.test(`${value}`.trim()) && `${value}`.trim().length >= 2;

export const validatePhone = (value = "") => /^\d{10}$/.test(`${value}`.trim());

export const validatePhonePrefix = (value = "", prefixes = []) => {
  const phone = `${value}`.trim();
  if (phone.length < 3) return false;
  return prefixes.some((item) => item.prefix === phone.slice(0, 3) && item.active !== false);
};
