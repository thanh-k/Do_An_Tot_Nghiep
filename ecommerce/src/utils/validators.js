export const validateEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password = "") => password.length >= 6;

export const validateRequired = (value) =>
  value !== undefined && value !== null && `${value}`.trim().length > 0;
