import { apiUrl } from "./config.js";
import { getAccessToken, signOut } from "./supabase.js";

async function json(path, opts) {
  const token = await getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(opts?.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    await signOut();
    throw new Error(data.error || "Session expired. Sign in again.");
  }
  if (!res.ok && res.status !== 202 && res.status !== 409) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const getStatus = () => json("/api/status");
export const getDashboard = () => json("/api/dashboard");
export const refresh = (days, end) =>
  json("/api/refresh", {
    method: "POST",
    body: JSON.stringify({ days, end }),
  });
export const getSector = (name) =>
  json(`/api/sector?name=${encodeURIComponent(name)}`);
export const getSymbols = () => json("/api/symbols");
export const getStock = (q, entry) => {
  const qs = new URLSearchParams({ q });
  if (entry != null && entry !== "") qs.set("entry", String(entry));
  return json(`/api/stock?${qs}`);
};

// Sector Lookouts
export const getSectorLookouts = (date = null) => {
  const q = date ? `?date=${date}` : "";
  return json(`/api/sector-lookouts${q}`);
};

export const getSectorHistory = (sector, days = 20) =>
  json(`/api/sector-lookouts/history?sector=${encodeURIComponent(sector)}&days=${days}`);

export const getSectorConstituents = (sector, top = 15) =>
  json(`/api/sector-lookouts/constituents?sector=${encodeURIComponent(sector)}&top=${top}`);

