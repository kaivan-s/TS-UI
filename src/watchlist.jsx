/**
 * Watchlist context — shared bookmark state across the app.
 *
 * Any component can check if a symbol is bookmarked and toggle it.
 * The watchlist is loaded once on mount and kept in sync with the API.
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import { C } from "./theme.js";
import { useAuth } from "./auth.jsx";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "./api.js";

const WatchlistCtx = createContext({
  symbols: new Set(),
  count: 0,
  toggle: () => {},
  has: () => false,
  loading: false,
});

export function WatchlistProvider({ children }) {
  const { session } = useAuth();
  const [symbols, setSymbols] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load on mount / session change
  useEffect(() => {
    if (!session) {
      setSymbols(new Set());
      return;
    }
    setLoading(true);
    getWatchlist()
      .then((d) => {
        const syms = new Set((d.rows || []).map((r) => r.symbol));
        setSymbols(syms);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  const has = useCallback((sym) => symbols.has(sym?.toUpperCase()), [symbols]);

  const toggle = useCallback(
    async (sym) => {
      const s = sym?.toUpperCase();
      if (!s) return;
      const wasIn = symbols.has(s);

      // Optimistic update
      setSymbols((prev) => {
        const next = new Set(prev);
        if (wasIn) next.delete(s);
        else next.add(s);
        return next;
      });

      try {
        if (wasIn) {
          await removeFromWatchlist(s);
        } else {
          await addToWatchlist(s);
        }
      } catch {
        // Revert on failure
        setSymbols((prev) => {
          const next = new Set(prev);
          if (wasIn) next.add(s);
          else next.delete(s);
          return next;
        });
      }
    },
    [symbols],
  );

  return (
    <WatchlistCtx.Provider value={{ symbols, count: symbols.size, toggle, has, loading }}>
      {children}
    </WatchlistCtx.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistCtx);
}

/**
 * Bookmark button — drop this anywhere with a symbol prop.
 * Shows filled icon if bookmarked, outline if not.
 */
export function BookmarkButton({ symbol, size = "small", sx }) {
  const { has, toggle } = useWatchlist();
  if (!symbol) return null;
  const saved = has(symbol);

  return (
    <Tooltip title={saved ? "Remove from watchlist" : "Add to watchlist"} arrow>
      <IconButton
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          toggle(symbol);
        }}
        sx={{
          color: saved ? C.warn : C.muted,
          "&:hover": { color: saved ? C.bad : C.warn },
          ...sx,
        }}
      >
        {saved ? (
          <BookmarkRoundedIcon sx={{ fontSize: size === "small" ? 18 : 22 }} />
        ) : (
          <BookmarkBorderRoundedIcon sx={{ fontSize: size === "small" ? 18 : 22 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
