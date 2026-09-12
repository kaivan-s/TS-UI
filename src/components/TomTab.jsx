import { Fragment, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { AccentRow, CoilBar, HeadCell, Note, PageIntro, WhyRow } from "./ui.jsx";
import { PremiumOverlay } from "./Premium.jsx";
import { useAuth } from "../auth.jsx";
import { C } from "../theme.js";
import { byScoreDesc, fmtDate, num, pct } from "../format.js";
import { TOM_FILTER_HELP } from "../glossary.js";

const FREE_PREVIEW_COUNT = 3;

function isThrough(r) {
  return r.kind === "through" || (r.to_trigger ?? 1) <= 0;
}

// Set to true to restore the 15:20 IST gate on Refresh live.
const ENFORCE_REFRESH_TIME = false;

/** Returns true if current IST time is 15:20 or later */
function isRefreshTime() {
  const now = new Date();
  // IST = UTC + 5:30
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  const hhmm = ist.getHours() * 100 + ist.getMinutes();
  return hhmm >= 1520;
}

export default function TomTab({
  rows, liveAt, liveN, liveSource, sectorsLive,
  onOpenSector, onOpenStock, onRefresh, scanning, scanMessage, preview = [],
}) {
  const [throughOnly, setThroughOnly] = useState(false);
  const { isPremium } = useAuth();
  const canRefresh = !ENFORCE_REFRESH_TIME || isRefreshTime();
  // "eod" is the session's official close and is trustworthy. Only
  // "eod_stale" means the feed failed on a day-old panel.
  const staleEod = liveSource === "eod_stale";
  const earlyLive = liveSource === "live" && !isRefreshTime();
  const sorted = useMemo(() => [...rows].sort(byScoreDesc), [rows]);
  const throughCount = useMemo(
    () => sorted.filter(isThrough).length,
    [sorted],
  );
  const shown = throughOnly ? sorted.filter(isThrough) : sorted;
  const SOURCE_LABEL = {
    live: "live", close: "closing prices", eod: "official close",
    eod_stale: "EOD close (stale)", saved: "saved",
  };

  return (
    <Box>
      <PageIntro
        title="For tomorrow"
        action={
          canRefresh ? (
            <Button
              variant="contained"
              onClick={onRefresh}
              disabled={scanning}
              sx={{ height: 38, px: 2, whiteSpace: "nowrap" }}
            >
              {scanning ? "Scanning…" : "Scan now"}
            </Button>
          ) : (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
            >
              Available after 15:20 IST
            </Typography>
          )
        }
      >
        Stocks sitting near their breakout level, ranked by momentum. Press{" "}
        <strong>Scan now</strong> to refresh with the latest prices — live
        during market hours (9:15–15:30) or official closing prices after the
        session. "THROUGH" means the price has already closed above the
        breakout level and is the strongest signal. Everything else is still
        building towards it.
      </PageIntro>

      {staleEod && (
        <Box
          sx={{
            mb: 3,
            px: 2,
            py: 1.25,
            borderLeft: `2px solid ${C.warn}`,
            bgcolor: "rgba(232,168,124,0.08)",
          }}
        >
          <Typography sx={{ fontSize: 14.5, lineHeight: 1.6, color: C.warn }}>
            No prices — the feed failed and this session's bhavcopy is not out
            yet, so this list is the previous close re-scored. Positions against
            the trigger are a day stale and nothing was written to Track Record.
            Treat it as a preview, not a prediction.
          </Typography>
        </Box>
      )}

      {earlyLive && (
        <Box
          sx={{
            mb: 3,
            px: 2,
            py: 1.25,
            borderLeft: `2px solid ${C.warn}`,
            bgcolor: "rgba(232,168,124,0.08)",
          }}
        >
          <Typography sx={{ fontSize: 14.5, lineHeight: 1.6, color: C.warn }}>
            Taken mid-session, before 15:20. Intraday moves can fade by the
            close, and the method was validated on closing prices — treat this
            as a preview of where the list is heading.
          </Typography>
        </Box>
      )}

      <Typography variant="caption" sx={{ display: "block", mb: 3 }}>
        {liveAt
          ? `Last scan ${fmtDate(liveAt.slice(0, 10))} ${liveAt.slice(11, 19)} · ${liveN?.toLocaleString?.() || liveN} stocks · ${SOURCE_LABEL[liveSource] || "unknown source"}${sectorsLive ? " · sectors reclassified" : ""}`
          : canRefresh
            ? "No saved list yet — hit Scan."
            : "No scan yet. Refresh available after 15:20 IST."}
      </Typography>

      {scanning && (
        <>
          <Box
            sx={{
              mb: 2,
              px: 2,
              py: 1.5,
              borderLeft: `2px solid ${C.accent}`,
              bgcolor: "rgba(92,157,228,0.08)",
              fontFamily: "monospace",
            }}
          >
            <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: C.accent }}>
              {scanMessage || "Starting scan…"}
            </Typography>
          </Box>
          {preview.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: C.good,
                    animation: "pulse 1.5s ease-in-out infinite",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1, transform: "scale(1)" },
                      "50%": { opacity: 0.5, transform: "scale(0.8)" },
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Top gainers streaming in — preliminary
                </Typography>
              </Box>
              <PreviewTable rows={preview} onOpenStock={onOpenStock} />
            </Box>
          )}
        </>
      )}

      {!scanning && rows.length === 0 ? (
        <Note>
          {liveAt
            ? "Nothing scored on this snapshot."
            : canRefresh
              ? "Hit Scan to pull current prices, or wait — a saved list loads with the panel."
              : "Refresh available after 15:20 IST."}
        </Note>
      ) : !scanning && (
        <>
          <Box
            sx={{
              display: "flex",
              gap: 0.75,
              flexWrap: "wrap",
              mb: 2.5,
              alignItems: "center",
            }}
          >
            {[
              { id: "all", label: "All", count: sorted.length, on: !throughOnly },
              { id: "through", label: "Broke out", count: throughCount, on: throughOnly },
            ].map((f) => (
              <Tooltip key={f.id} title={TOM_FILTER_HELP[f.id] || ""} placement="top" arrow enterDelay={300}>
                <Chip
                  label={`${f.label}  ${f.count}`}
                  onClick={() => setThroughOnly(f.id === "through")}
                  variant={f.on ? "filled" : "outlined"}
                  sx={{
                    borderColor: f.on ? "transparent" : "rgba(238,234,227,0.10)",
                    bgcolor: f.on ? C.text : "transparent",
                    color: f.on ? C.bg : C.muted,
                    "&:hover": {
                      bgcolor: f.on ? "#d8d4cd" : "rgba(238,234,227,0.04)",
                    },
                  }}
                />
              </Tooltip>
            ))}
          </Box>
          {shown.length === 0 ? (
            <Note>
              No stock closed through its breakout level on this snapshot.
              Switch to "All" to see names still building up to it.
            </Note>
          ) : isPremium ? (
            <ScanTable
              rows={shown}
              onOpenSector={onOpenSector}
              onOpenStock={onOpenStock}
            />
          ) : (
            <PremiumOverlay
              previewCount={FREE_PREVIEW_COUNT}
              totalCount={shown.length}
              feature="Full momentum list"
            >
              <ScanTable
                rows={shown.slice(0, FREE_PREVIEW_COUNT)}
                onOpenSector={onOpenSector}
                onOpenStock={onOpenStock}
              />
            </PremiumOverlay>
          )}
        </>
      )}
    </Box>
  );
}

function ScanTable({ rows, onOpenSector, onOpenStock }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <HeadCell label="Symbol" />
            <HeadCell
              label="Sector"
              help="Click to open the sector's full history and see whether money is rotating into it."
            />
            <HeadCell k="score" sx={{ minWidth: 120 }} />
            <HeadCell k="ltp" align="right" />
            <HeadCell k="trigger" align="right" />
            <HeadCell k="to_trigger" align="right" />
            <HeadCell k="vol_ratio" align="right" />
            <HeadCell k="rsi" align="right" />
            <HeadCell k="pchange" align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => {
            const through = isThrough(r);
            return (
              <Fragment key={r.symbol}>
                <AccentRow color={through ? C.warn : C.accent}>
                  <TableCell
                    className={onOpenStock ? "linkish" : undefined}
                    sx={{ fontWeight: 500 }}
                    onClick={() => onOpenStock?.(r.symbol)}
                  >
                    {r.symbol}
                    {through && (
                      <Tooltip
                        title="Closed above its 20-day high — the breakout already happened."
                        placement="top"
                        arrow
                      >
                        <Typography
                          component="span"
                          sx={{
                            ml: 1,
                            px: 0.6,
                            py: 0.1,
                            fontSize: 10,
                            fontWeight: 500,
                            borderRadius: 0.4,
                            bgcolor: "rgba(232,168,124,0.15)",
                            color: C.warn,
                            cursor: "help",
                          }}
                        >
                          BROKE OUT
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell
                    className="row-click linkish"
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenSector(r.sector)}
                    sx={{ maxWidth: 240 }}
                  >
                    {r.sector}
                  </TableCell>
                  <TableCell>
                    <CoilBar value={(r.score ?? 0) * 100} />
                  </TableCell>
                  <TableCell align="right" className="num">{num(r.ltp, 2)}</TableCell>
                  <TableCell align="right" className="num">{num(r.trigger, 2)}</TableCell>
                  <TableCell align="right" className="num">{pct(r.to_trigger, 1)}</TableCell>
                  <TableCell align="right" className="num">
                    {r.vol_ratio != null
                      ? `${num(r.vol_ratio, 2)}×`
                      : r.vol_expand != null
                        ? `${num(r.vol_expand, 2)}×`
                        : "—"}
                  </TableCell>
                  <TableCell align="right" className="num">{num(r.rsi, 1)}</TableCell>
                  <TableCell align="right" className="num">{pct((r.pchange || 0) / 100, 1)}</TableCell>
                </AccentRow>
                {r.why && <WhyRow cols={9}>{r.why}</WhyRow>}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** Animated preview showing top movers as data streams in */
function PreviewTable({ rows, onOpenStock }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 1.5,
      }}
    >
      {rows.slice(0, 12).map((r, i) => (
        <Box
          key={r.symbol}
          onClick={() => onOpenStock?.(r.symbol)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1,
            borderRadius: 1.5,
            bgcolor: "rgba(125,186,150,0.06)",
            border: "1px solid rgba(125,186,150,0.15)",
            cursor: onOpenStock ? "pointer" : "default",
            animation: "popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            animationFillMode: "both",
            animationDelay: `${i * 40}ms`,
            "@keyframes popIn": {
              from: { opacity: 0, transform: "scale(0.9)" },
              to: { opacity: 1, transform: "scale(1)" },
            },
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "rgba(125,186,150,0.12)",
              borderColor: "rgba(125,186,150,0.3)",
              transform: "translateY(-2px)",
            },
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: C.good,
              opacity: 0.7,
              minWidth: 18,
            }}
          >
            {i + 1}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: C.text,
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.symbol}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: C.good,
                fontWeight: 600,
                fontFamily: "monospace",
              }}
            >
              +{num(r.pchange, 1)}%
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
