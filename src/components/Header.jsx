import {
  Autocomplete,
  Box,
  TextField,
  Typography,
} from "@mui/material";
import { C } from "../theme.js";
import { fmtDate } from "../format.js";

export default function Header({
  status,
  loading,
  symbols = [],
  onLookup,
}) {
  return (
    <Box
      sx={{
        bgcolor: C.paper,
        borderBottom: `1px solid ${C.line}`,
        px: 3,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        minHeight: 56,
      }}
    >
      <Typography sx={{ fontSize: 13, color: C.muted }}>
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

      <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.5 }}>
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
          sx={{ width: 260 }}
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
