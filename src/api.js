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
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
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


// Base episodes — what happened to each base since it appeared.
export const getEpisodes = () => json("/api/episodes");

// Upper-circuit carry: latest list, track record, per-session history.
export const getCarry = () => json("/api/carry");

// Intraday circuit scanner: stocks approaching the upper circuit.
export const getCarryIntraday = (asOf = null) =>
  json(asOf ? `/api/carry/intraday?as_of=${asOf}` : "/api/carry/intraday");

// Broader market scanners.
export const getScanners = () => json("/api/scanners");
export const getScannersIntraday = () => json("/api/scanners/intraday");
export const getScannersEod = () => json("/api/scanners/eod");

// Fundamentals screen
export const getFundamentalsScreen = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.min_mcap) qs.set("min_mcap", params.min_mcap);
  if (params.max_pe) qs.set("max_pe", params.max_pe);
  if (params.min_growth) qs.set("min_growth", params.min_growth);
  if (params.sector) qs.set("sector", params.sector);
  if (params.sort) qs.set("sort", params.sort);
  if (params.order) qs.set("order", params.order);
  qs.set("limit", params.limit || 500);
  return json(`/api/fundamentals/screen?${qs}`);
};

// Results calendar
export const getResultsCalendar = (days = 45) =>
  json(`/api/results-calendar?days=${days}`);

// Chart data. Raw fetch, but through apiUrl so it hits the backend
// rather than the UI host (which 404s on /api/chart-data).
export const getChartData = async (symbol, period = "1y") => {
  const res = await fetch(
    apiUrl(`/api/chart-data?symbol=${encodeURIComponent(symbol)}&period=${period}`),
  );
  if (!res.ok) throw new Error(`Chart data: HTTP ${res.status}`);
  return res.json();
};

// Watchlist
export const getWatchlist = () => json("/api/watchlist");
export const addToWatchlist = (symbol, notes) =>
  json("/api/watchlist", {
    method: "POST",
    body: JSON.stringify({ symbol, notes }),
  });
export const removeFromWatchlist = (symbol) =>
  json("/api/watchlist", {
    method: "DELETE",
    body: JSON.stringify({ symbol }),
  });
