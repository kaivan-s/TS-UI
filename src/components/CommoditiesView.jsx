/**
 * Commodities — each driver's trend, the stocks measured to move with or
 * against it, and the latest headlines about it.
 */

import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { getCommodities } from "../api.js";
import { C } from "../theme.js";
import { Change, LinkChip, MONO, NewsList, Sparkline, fmtPrice } from "./DriverParts.jsx";

function DriverCard({ d, onOpenStock }) {
  const m = d.market;
  const none = !d.with.length && !d.against.length;
  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 2.5,
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        display: "flex",
        flexDirection: "column",
        gap: 1.75,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", color: C.accent, textTransform: "uppercase" }}>
            {d.group}
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.text, mt: 0.2 }}>{d.label}</Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.4 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: C.text }}>
              {fmtPrice(m, d.unit)}
            </Typography>
            {d.unit !== "%" && (
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>{d.unit}</Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ flexShrink: 0, textAlign: "right" }}>
          <Sparkline data={m?.spark} />
          <Typography sx={{ fontFamily: MONO, fontSize: 9.5, color: C.muted, mt: 0.3 }}>3 months</Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2.5, pb: 1.5, borderBottom: `1px solid ${C.line}` }}>
        <Change label="1D" v={m?.chg_1d} points={m?.points} />
        <Change label="1W" v={m?.chg_1w} points={m?.points} />
        <Change label="1M" v={m?.chg_1m} points={m?.points} />
        <Change label="3M" v={m?.chg_3m} points={m?.points} />
      </Box>

      <Box>
        <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: C.muted, mb: 0.85 }}>
          STOCKS THAT MOVE WITH IT
        </Typography>
        {none ? (
          <Typography sx={{ fontSize: 12, color: C.muted }}>
            No stock showed a stable link over the measured window.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[["Rises with", d.with], ["Falls when it rises", d.against]].map(([lab, rows]) =>
              rows.length ? (
                <Box key={lab}>
                  <Typography sx={{ fontSize: 11.5, color: C.muted, mb: 0.5 }}>{lab}</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.65 }}>
                    {rows.map((r) => (
                      <LinkChip key={r.symbol} r={r} driverKey={d.key} driverLabel={d.label} onOpenStock={onOpenStock} />
                    ))}
                  </Box>
                </Box>
              ) : null,
            )}
          </Box>
        )}
      </Box>

      <Box>
        <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: C.muted, mb: 0.85 }}>
          LATEST HEADLINES
        </Typography>
        <NewsList news={d.news} />
      </Box>
    </Box>
  );
}

export default function CommoditiesView({ onOpenStock }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let stop = false;
    getCommodities()
      .then((d) => !stop && setData(d))
      .catch((e) => !stop && setErr(e.message));
    return () => {
      stop = true;
    };
  }, []);

  const w = data?.window;

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5, borderRadius: 2.5, bgcolor: "#15161b", border: `1px solid ${C.line}` }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: C.accent }}>
          COMMODITIES &amp; MACRO DRIVERS
        </Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: 20, sm: 23 }, fontWeight: 600, color: C.text, mt: 0.4 }}>
          What&apos;s moving, and who it moves
        </Typography>
        <Typography sx={{ fontSize: 13, color: C.muted, mt: 0.5, maxWidth: 760, lineHeight: 1.6 }}>
          Stocks are listed only where the link shows up in their own prices: weekly returns with the
          Nifty&apos;s move removed, strong over the whole window and pointing the same way in both
          halves of it. Figures are the stock&apos;s move for a 10% move in the commodity (1% for the
          rupee). They describe how stocks have moved together with each driver, not a forecast.
          {w ? ` Window: ${w.start} to ${w.end} (${w.weeks} weeks).` : ""}
        </Typography>
      </Box>

      {err && (
        <Typography sx={{ color: C.bad, fontSize: 13, mb: 2 }}>{err}</Typography>
      )}
      {!data && !err && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={26} sx={{ color: C.accent }} />
        </Box>
      )}
      {data && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
          {data.drivers.map((d) => (
            <DriverCard key={d.key} d={d} onOpenStock={onOpenStock} />
          ))}
        </Box>
      )}
    </Box>
  );
}
