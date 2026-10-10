/** Backend origin. Empty = same host (Vite proxy locally, Flask in prod). */
export const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

/** Telegram bot link. Set VITE_TELEGRAM_BOT in env to override. */
export const TELEGRAM_BOT = import.meta.env.VITE_TELEGRAM_BOT || "https://t.me/morrow_desk_bot";
export const TELEGRAM_CHANNEL = import.meta.env.VITE_TELEGRAM_CHANNEL || "https://t.me/morrow_desk_free";
