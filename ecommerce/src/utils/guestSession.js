const GUEST_SESSION_KEY = "insightshop_behavior_session";
const LEGACY_GUEST_SESSION_KEY = "novashop_guest_session_id";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 ngày

function canUseDocumentCookie() {
  return typeof document !== "undefined" && typeof document.cookie === "string";
}

function readCookie(name) {
  if (!canUseDocumentCookie()) return "";
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const prefix = `${encodeURIComponent(name)}=`;
  const found = cookies.find((item) => item.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : "";
}

function writeCookie(name, value) {
  if (!canUseDocumentCookie()) return;
  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "path=/",
    `max-age=${COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ].join("; ");
}

function createGuestSessionId() {
  const randomPart =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replaceAll("-", "").slice(0, 16)
      : Math.random().toString(36).slice(2, 14);

  return `guest_${Date.now()}_${randomPart}`;
}

export function getGuestSessionId() {
  const cookieSessionId = readCookie(GUEST_SESSION_KEY);
  if (cookieSessionId) return cookieSessionId;

  const legacySessionId =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(GUEST_SESSION_KEY) ||
        localStorage.getItem(LEGACY_GUEST_SESSION_KEY)
      : "";

  const sessionId = legacySessionId || createGuestSessionId();

  writeCookie(GUEST_SESSION_KEY, sessionId);

  try {
    localStorage.setItem(GUEST_SESSION_KEY, sessionId);
    localStorage.removeItem(LEGACY_GUEST_SESSION_KEY);
  } catch {}

  return sessionId;
}

export function setGuestSessionId(sessionId) {
  if (!sessionId) return;
  writeCookie(GUEST_SESSION_KEY, sessionId);
  try {
    localStorage.setItem(GUEST_SESSION_KEY, sessionId);
  } catch {}
}

export function getBehaviorCookieName() {
  return GUEST_SESSION_KEY;
}

export default getGuestSessionId;
