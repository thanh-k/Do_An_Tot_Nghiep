const GUEST_SESSION_KEY = "novashop_guest_session_id";

export function getGuestSessionId() {
  let sessionId = localStorage.getItem(GUEST_SESSION_KEY);
  if (!sessionId) {
    const randomPart = Math.random().toString(36).slice(2, 12);
    sessionId = `guest_${Date.now()}_${randomPart}`;
    localStorage.setItem(GUEST_SESSION_KEY, sessionId);
  }
  return sessionId;
}

export default getGuestSessionId;
