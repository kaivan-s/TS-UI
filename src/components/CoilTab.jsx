import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { CoilBar, HeadCell, Note, PageIntro } from "./ui.jsx";
import { C } from "../theme.js";
import { num, pct } from "../format.js";
import { MISSING_REASON } from "../glossary.js";

export default function CoilTab({ hits, misses, coilReady, onOpenSector, onOpenStock }) {
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return hits;
    return hits.filter(
      (r) =>
        (r.symbol || "").toLowerCase().includes(query) ||
        (r.sector || "").toLowerCase().includes(query),
    );
  }, [hits, q]);

  const nNew = useMemo(
    () => hits.filter((r) => r.coil_days === 1).length,
    [hits],
  );

  if (!coilReady) {
    return (
      <Note>
        This tab measures each stock against its 200-day trend, which needs
        about 220 sessions of history to compute. Set the window at the top to
        220 sessions and press Reload data.
      </Note>
    );
  }

  return (
    <Box>
      <PageIntro
        title="Coiled bases"
        action={
          <TextField
            size="small"
            placeholder="Symbol or sector"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ width: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: C.muted }} />
                </InputAdornment>
              ),
            }}
          />
        }
      >
        {hits.length} stocks sitting quiet and tight near their highs — every
        name that cleared all seven filters, not a top slice of them. The order
        carries no meaning: ranking by coil score showed no relationship with
        forward returns, so the top row is not a better buy than the bottom.
        "Coiled" counts consecutive sessions a name has qualified
        {nNew > 0
          ? `, and ${nNew} ${nNew === 1 ? "name" : "names"} qualified for the first time today`
          : ""}
        . Hover any column heading for what it measures.
      </PageIntro>

      {hits.length === 0 ? (
        <Note>
          No stock is in a coil today. This scan is meant to return nothing on
          most days — it only fires when price, trend, volume and range all
          line up at once.
        </Note>
      ) : (
        <TableContainer sx={{ mb: 5 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <HeadCell label="Symbol" />
                <HeadCell
                  label="Coiled"
                  help="Consecutive sessions this name has cleared all seven filters. 1 means it qualified today for the first time. A long run means the base has been sitting a while without resolving."
                  align="right"
                />
                <HeadCell
                  label="Sector"
                  help="Click to open the sector's full history and see whether money is rotating into it."
                />
                <HeadCell k="adj" align="right" />
                <HeadCell k="coil" sx={{ minWidth: 140 }} />
                <HeadCell k="pos_hi" align="right" />
                <HeadCell k="to_trigger" align="right" />
                <HeadCell k="rsi" align="right" />
                <HeadCell k="vol_ratio" align="right" />
                <HeadCell k="range20" align="right" />
                <HeadCell k="cmf" align="right" />
                <HeadCell k="deliv_quality_rel" align="right" />
                <HeadCell k="base_days" align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((r) => (
                <TableRow
                  key={r.symbol}
                  hover
                  sx={
                    r.recommended
                      ? { "& td:first-of-type": { boxShadow: `inset 2px 0 0 ${C.good}` } }
                      : undefined
                  }
                >
                  <TableCell
                    className={onOpenStock ? "linkish" : undefined}
                    sx={{ fontWeight: 500 }}
                    onClick={() => onOpenStock?.(r.symbol)}
                  >
                    {r.symbol}
                    {r.recommended && (
                      <Tooltip
                        title="This stock's sector is also waking up or resting after waking up, so it appears on the Setups tab too."
                        placement="top"
                        arrow
                      >
                        <Chip
                          size="small"
                          label="Sector agrees"
                          sx={{
                            ml: 1,
                            bgcolor: "rgba(125,186,150,0.12)",
                            color: C.good,
                            cursor: "help",
                          }}
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="right" className="num">
                    {r.coil_days === 1 ? (
                      <Chip
                        size="small"
                        label="New"
                        sx={{
                          bgcolor: "rgba(142,180,196,0.16)",
                          color: C.accent,
                        }}
                      />
                    ) : (
                      (r.coil_days ?? "—")
                    )}
                  </TableCell>
                  <TableCell
                    className="row-click linkish"
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenSector(r.sector)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onOpenSector(r.sector);
                    }}
                    sx={{ maxWidth: 240 }}
                  >
                    {r.sector}
                  </TableCell>
                  <TableCell align="right" className="num">{num(r.adj, 2)}</TableCell>
                  <TableCell>
                    <CoilBar value={r.coil} />
                  </TableCell>
                  <TableCell align="right" className="num">{pct(r.pos_hi, 1)}</TableCell>
                  <TableCell align="right" className="num">{pct(r.to_trigger, 1)}</TableCell>
                  <TableCell align="right" className="num">{num(r.rsi, 1)}</TableCell>
                  <TableCell align="right" className="num">{num(r.vol_ratio)}</TableCell>
                  <TableCell align="right" className="num">{pct(r.range20, 1)}</TableCell>
                  <TableCell align="right" className="num">{num(r.cmf)}</TableCell>
                  <TableCell align="right" className="num">{num(r.deliv_quality_rel)}</TableCell>
                  <TableCell align="right" className="num">{num(r.base_days, 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="h2" sx={{ mb: 0.5, fontSize: 18 }}>
        Almost there
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2, fontSize: 14 }}>
        Stocks that failed exactly one of the seven filters. Worth watching —
        one more quiet week often fixes it.
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <HeadCell label="Symbol" />
              <HeadCell label="Sector" />
              <HeadCell k="missing" />
              <HeadCell k="adj" align="right" />
              <HeadCell k="pos_hi" align="right" />
              <HeadCell k="rsi" align="right" />
              <HeadCell k="vol_ratio" align="right" />
              <HeadCell k="range20" align="right" />
              <HeadCell k="cmf" align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {misses.map((r) => (
              <TableRow key={r.symbol} hover>
                <TableCell sx={{ fontWeight: 500 }}>{r.symbol}</TableCell>
                <TableCell
                  className="row-click linkish"
                  onClick={() => onOpenSector(r.sector)}
                >
                  {r.sector}
                </TableCell>
                <TableCell sx={{ color: C.warn, fontWeight: 500 }}>
                  {MISSING_REASON[r.missing] || r.missing}
                </TableCell>
                <TableCell align="right" className="num">{num(r.adj, 2)}</TableCell>
                <TableCell align="right" className="num">{pct(r.pos_hi, 1)}</TableCell>
                <TableCell align="right" className="num">{num(r.rsi, 1)}</TableCell>
                <TableCell align="right" className="num">{num(r.vol_ratio)}</TableCell>
                <TableCell align="right" className="num">{pct(r.range20, 1)}</TableCell>
                <TableCell align="right" className="num">{num(r.cmf)}</TableCell>
              </TableRow>
            ))}
            {misses.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} sx={{ color: "text.secondary", py: 5 }}>
                  none
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
