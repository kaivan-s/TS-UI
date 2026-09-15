import {
  Autocomplete,
  Box,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { C } from "../theme.js";
import { fmtDate } from "../format.js";

export default function Header({
  status,
  loading,
  symbols = [],
  onLookup,
  onMenuClick,
  showMenuButton,
}) {
  return (
    <Box
      sx={{
        bgcolor: C.paper,
        borderBottom: `1px solid ${C.line}`,
        px: { xs: 2, sm: 3 },
        py: 1.5,
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.5, sm: 2 },
        minHeight: 56,
      }}
    >
      {/* Hamburger menu for mobile */}
      {showMenuButton && (
        <IconButton
          onClick={onMenuClick}
          sx={{ color: C.text, p: 1, ml: -1 }}
          aria-label="open navigation"
        >
          <MenuIcon />
        </IconButton>
      )}

      <Typography sx={{ fontSize: { xs: 12, sm: 13 }, color: C.muted, display: { xs: "none", sm: "block" } }}>
        {status?.as_of ? (
          <>
            As of{" "}
            <Box component="span" sx={{ color: C.text, fontWeight: 500 }}>
              {fmtDate(status.as_of)}
            </Box>
            {status.n_stocks
              ? ` · ${status.n_stocks.toLocaleString()} stocks · ${status.n_sectors} sectors`
              : ""}
          </>
        ) : (
          "Loading…"
        )}
        {status?.regime_ok === false && (
          <Box
            component="span"
            sx={{
              ml: 1.5,
              px: 1,
              py: 0.25,
              bgcolor: "rgba(232,168,124,0.15)",
              color: C.warn,
              borderRadius: 0.5,
              fontSize: 11.5,
              fontWeight: 500,
            }}
          >
            ⚠ Weak breadth ({status.bullish_sectors}/{status.total_sectors})
          </Box>
        )}
      </Typography>

      <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.5, flex: { xs: 1, sm: "none" } }}>
        <Autocomplete
          size="small"
          options={symbols}
          getOptionLabel={(o) => (typeof o === "string" ? o : o.symbol || "")}
          isOptionEqualToValue={(a, b) => (a.symbol || a) === (b.symbol || b)}
          filterOptions={(opts, state) => {
            const q = (state.inputValue || "").trim().toLowerCase();
            const hit = !q
              ? opts
              : opts.filter((o) => {
                  const sym = String(o.symbol || o).toLowerCase();
                  const sec = String(o.sector || "").toLowerCase();
                  return sym.includes(q) || sec.includes(q);
                });
            return hit.slice(0, 40);
          }}
          onChange={(_, v) => {
            if (!v) return;
            onLookup?.(typeof v === "string" ? v : v.symbol);
          }}
          disabled={loading || !onLookup}
          autoHighlight
          autoComplete
          includeInputInList
          openOnFocus
          freeSolo
          sx={{ width: { xs: "100%", sm: 260 }, minWidth: { xs: 140, sm: 260 } }}
          noOptionsText={symbols.length ? "No match" : "Symbols still loading…"}
          renderOption={(props, o) => (
            <li {...props} key={o.symbol || o}>
              <Box sx={{ py: 0.25 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                  {o.symbol || o}
                </Typography>
                {o.sector && (
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    {o.sector}
                  </Typography>
                )}
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Look up a stock…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = e.target.value?.trim();
                  if (v) onLookup?.(v);
                }
              }}
            />
          )}
        />
      </Box>
    </Box>
  );
}
