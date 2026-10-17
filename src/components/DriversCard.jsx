/**
 * Stock page section: commodity/macro drivers measured in this stock's price,
 * then drivers its industry is expected to be exposed to, each with headlines.
 */

import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import OilBarrelRoundedIcon from "@mui/icons-material/OilBarrelRounded";
import { getStockDrivers } from "../api.js";
import { C } from "../theme.js";
import { Change, MONO, NewsList, Sparkline, fmtPrice, scaleFor } from "./DriverParts.jsx";

function DriverRow({ d, symbol }) {
  const m = d.market;
  const measured = d.beta != null;
  const scale = scaleFor(d.key);
  const move = measured ? d.beta * scale : null;
  return (
    <Box sx={{ py: 1.75, borderTop: `1px solid ${C.line}`, "&:first-of-type": { borderTop: 0, pt: 0 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: C.text }}>
            {d.label}
            <Box component="span" sx={{ fontFamily: MONO, fontSize: 12, color: C.muted, ml: 1, fontWeight: 400 }}>
              {fmtPrice(m, d.unit)}{d.unit !== "%" ? ` ${d.unit}` : ""}
            </Box>
          </Typography>
          {measured ? (
            <Typography sx={{ fontSize: 12.5, color: C.muted, mt: 0.4, lineHeight: 1.5 }}>
              A {scale}% rise has gone with{" "}
              <Box component="span" sx={{ color: move > 0 ? C.good : C.bad, fontFamily: MONO, fontWeight: 600 }}>
                {move > 0 ? "+" : ""}{move.toFixed(1)}%
              </Box>{" "}
              in {symbol} beyond the Nifty&apos;s move
              {d.basis === "peers" ? ", and an industry peer shows the same link." : "."}
            </Typography>
          ) : (
            <Typography sx={{ fontSize: 12.5, color: C.muted, mt: 0.4, lineHeight: 1.5 }}>
              Expected for the industry, but not visible in {symbol}&apos;s own prices.
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Change label="1W" v={m?.chg_1w} points={m?.points} />
          <Change label="1M" v={m?.chg_1m} points={m?.points} />
          <Sparkline data={m?.spark} width={90} height={28} />
        </Box>
      </Box>
      <Box sx={{ mt: 1.25, pl: 1.5, borderLeft: `2px solid ${C.line}` }}>
        <NewsList news={d.news} max={3} />
      </Box>
    </Box>
  );
}

export default function DriversCard({ symbol, hideEmpty }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return undefined;
    let stop = false;
    setData(null);
    setLoading(true);
    getStockDrivers(symbol)
      .then((d) => !stop && setData(d))
      .catch(() => !stop && setData({ measured: [], expected: [] }))
      .finally(() => !stop && setLoading(false));
    return () => {
      stop = true;
    };
  }, [symbol]);

  const rows = data ? [...data.measured, ...data.expected] : [];
  if (hideEmpty && !loading && !rows.length) return null;

  return (
    <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: "#15161b", border: `1px solid ${C.line}` }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
        <OilBarrelRoundedIcon sx={{ fontSize: 17, color: C.accent }} />
        <Typography sx={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Market Drivers
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 12, color: C.muted, mb: 2, lineHeight: 1.5 }}>
        Commodities and macro factors that can move this stock, with the latest news on each. This is
        news about the driver, not about the company.
      </Typography>
      {loading && !data ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={20} sx={{ color: C.accent }} />
        </Box>
      ) : rows.length ? (
        rows.map((d) => <DriverRow key={d.key} d={d} symbol={symbol} />)
      ) : (
        <Typography sx={{ fontSize: 12.5, color: C.muted }}>
          No commodity or macro driver measured for this stock or expected for its industry
          {data?.industry ? ` (${data.industry})` : ""}.
        </Typography>
      )}
    </Box>
  );
}
