import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  canvasRadius,
  canvasSpacing,
  canvasTypography,
  chartColorSequence,
  chartPalette,
  mergeStyle,
} from "./tokens.js";
import { useHostTheme } from "./theme.jsx";

const FALLBACK_CHART_WIDTH = 480;
const DEFAULT_CHART_HEIGHT = 240;
const DEFAULT_PIE_SIZE = 200;
const VERTICAL_MARGINS = { top: 16, right: 12, bottom: 40, left: 48 };
const HORIZONTAL_BAR_MARGINS = { top: 12, right: 28, bottom: 24, left: 96 };

function useMeasuredWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(FALLBACK_CHART_WIDTH);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const apply = (next) => {
      const w = Math.round(next ?? el.getBoundingClientRect().width ?? el.clientWidth);
      if (w > 0) setWidth(w);
    };
    apply();
    const ro = new ResizeObserver((entries) => apply(entries[0]?.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

function sanitize(v) {
  return Number.isFinite(v) && v >= 0 ? v : 0;
}
function sanitizeFinite(v) {
  return Number.isFinite(v) ? v : 0;
}
function trimZeros(s) {
  return s.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}
function formatValue(v) {
  const n = Math.abs(v);
  if (n >= 1e6) return `${trimZeros((v / 1e6).toFixed(n >= 1e7 ? 0 : 1))}M`;
  if (n >= 1e3) return `${trimZeros((v / 1e3).toFixed(n >= 1e4 ? 0 : 1))}K`;
  if (Number.isInteger(v)) return `${v}`;
  return trimZeros(v.toFixed(n >= 10 ? 1 : 2));
}
function formatPercent(v) {
  return v >= 10 ? `${Math.round(v)}%` : `${trimZeros(v.toFixed(1))}%`;
}
function formatWithAffix(v, prefix = "", suffix = "") {
  return `${prefix}${formatValue(v)}${suffix}`;
}
function truncateLabel(s, n = 12) {
  return s.length <= n ? s : `${s.slice(0, Math.max(1, n - 3))}…`;
}
function estLabelWidthPx(labels, maxChars) {
  let t = 1;
  for (const a of labels) t = Math.max(t, Math.min(a.length, maxChars));
  return 7 * t + 14;
}
function fitStride(count, px, minPx) {
  const a = Math.max(1, Math.floor(px / Math.max(minPx, 1)));
  return count <= a ? 1 : Math.ceil(count / a);
}
function niceStep(raw) {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const n = 10 ** Math.floor(Math.log10(raw));
  const t = raw / n;
  if (t <= 1) return n;
  if (t <= 2) return 2 * n;
  if (t <= 5) return 5 * n;
  return 10 * n;
}
function buildScale(minIn, maxIn, opts = {}, tickHint = 4) {
  const { beginAtZero = true, yMin, yMax, extra = [] } = opts;
  let lo = Number.isFinite(minIn) ? minIn : 0;
  let hi = Number.isFinite(maxIn) ? maxIn : 1;
  for (const e of extra) {
    if (Number.isFinite(e)) {
      lo = Math.min(lo, e);
      hi = Math.max(hi, e);
    }
  }
  let u = yMin ?? (beginAtZero ? Math.min(0, lo) : lo);
  let p = yMax ?? hi;
  if (!Number.isFinite(u)) u = 0;
  if (!Number.isFinite(p) || p <= u) p = u + 1;
  const m = niceStep((p - u) / Math.max(tickHint - 1, 1));
  if (yMin == null) u = Math.floor(u / m) * m;
  if (yMax == null) p = Math.ceil(p / m) * m;
  if (p <= u) p = u + m;
  const ticks = [];
  for (let e = u; e <= p + m / 2; e += m) ticks.push(Number(e.toFixed(10)));
  const last = ticks[ticks.length - 1];
  if (last == null || last < p - 1e-6 * m) ticks.push(Number(p.toFixed(10)));
  return { ticks, min: u, max: p };
}
function valueFrac(scale, v) {
  const t = scale.max - scale.min;
  if (t <= 0) return 0;
  const a = (sanitizeFinite(v) - scale.min) / t;
  return a < 0 ? 0 : a > 1 ? 1 : a;
}
function toneToColor(tone) {
  if (tone == null) return undefined;
  if (tone === "success") return chartPalette.lightGreen;
  if (tone === "danger") return chartPalette.darkAmber;
  if (tone === "warning") return chartPalette.brightOrange;
  if (tone === "info") return chartPalette.lightBlue;
  if (tone === "neutral") return chartPalette.muted;
  return undefined;
}
function seriesColor(i, tone) {
  return toneToColor(tone) ?? chartColorSequence[i % chartColorSequence.length];
}
function barColor(series, si, ci) {
  const a = toneToColor(series[si].tone);
  if (a != null) return a;
  if (series.length === 1) return chartColorSequence[ci % chartColorSequence.length];
  return chartColorSequence[si % chartColorSequence.length];
}
function svgTextProps(tokens) {
  return { fill: tokens.text.secondary, fontFamily: "inherit", fontSize: canvasTypography.small.fontSize };
}

function renderYAxis(width, height, margin, scale, tokens, suffix = "", prefix = "") {
  const plotH = Math.max(height - margin.top - margin.bottom, 1);
  const l = svgTextProps(tokens);
  return scale.ticks.map((n) => {
    const y = margin.top + plotH - valueFrac(scale, n) * plotH;
    return (
      <g key={n}>
        {n > scale.min ? (
          <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke={tokens.stroke.tertiary} strokeWidth={1} />
        ) : null}
        <text x={margin.left - canvasSpacing[2]} y={y + 4} textAnchor="end" {...l}>
          {formatWithAffix(n, prefix, suffix)}
        </text>
      </g>
    );
  });
}

function refLabelChip(label, x, y, anchor, color, tokens) {
  const w = 6.5 * label.length + 8;
  const ox = anchor === "end" ? x - w : x - w / 2;
  return (
    <g>
      <rect x={ox} y={y - 11} width={w} height={14} fill={tokens.bg.editor} rx={2} />
      <text x={x} y={y} textAnchor={anchor} fill={color} fontFamily="inherit" fontSize={canvasTypography.small.fontSize} fontWeight={500}>
        {label}
      </text>
    </g>
  );
}

function renderReferenceLines(orientation, width, height, margin, scale, lines, tokens) {
  if (!lines || lines.length === 0) return null;
  const plotW = Math.max(width - margin.left - margin.right, 1);
  const plotH = Math.max(height - margin.top - margin.bottom, 1);
  return lines.map((line) => {
    if (!Number.isFinite(line.value) || line.value < scale.min || line.value > scale.max) return null;
    const color = toneToColor(line.tone) ?? tokens.text.tertiary;
    const key = `ref-${line.value}-${line.label ?? ""}`;
    if (orientation === "horizontal") {
      const y = margin.top + plotH - valueFrac(scale, line.value) * plotH;
      return (
        <g key={key}>
          <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke={color} strokeWidth={1} strokeDasharray="4 3" />
          {line.label ? refLabelChip(line.label, width - margin.right, y - 3, "end", color, tokens) : null}
        </g>
      );
    }
    const x = margin.left + valueFrac(scale, line.value) * plotW;
    return (
      <g key={key}>
        <line x1={x} x2={x} y1={margin.top} y2={height - margin.bottom} stroke={color} strokeWidth={1} strokeDasharray="4 3" />
        {line.label ? refLabelChip(line.label, x, margin.top - 2, "middle", color, tokens) : null}
      </g>
    );
  });
}

function emptyState(height, tokens, style) {
  return (
    <div
      style={mergeStyle(
        {
          width: "100%",
          minWidth: 0,
          height: `${height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: `${canvasRadius.md}px`,
          border: `1px solid ${tokens.stroke.secondary}`,
          background: tokens.fill.quaternary,
          color: tokens.text.secondary,
          fontSize: canvasTypography.small.fontSize,
          lineHeight: canvasTypography.small.lineHeight,
        },
        style
      )}
    >
      No data
    </div>
  );
}

function useTooltip() {
  const [tip, setTip] = useState(null);
  return {
    tip,
    show: useCallback((x, y, label, entries, total) => setTip({ x, y, label, entries, total }), []),
    hide: useCallback(() => setTip(null), []),
  };
}

function TooltipOverlay({ tip, tokens, containerWidth, suffix, prefix }) {
  const left = tip.x + 180 + 16 > containerWidth ? Math.max(0, tip.x - 180 - 12) : tip.x + 12;
  return (
    <div
      style={{
        position: "absolute",
        top: `${Math.max(tip.y - 8, 0)}px`,
        left: `${left}px`,
        minWidth: "180px",
        maxWidth: "260px",
        pointerEvents: "none",
        zIndex: 10,
        padding: `${canvasSpacing[1.5]}px ${canvasSpacing[2]}px`,
        background: tokens.bg.chrome,
        border: `1px solid ${tokens.stroke.primary}`,
        borderRadius: `${canvasRadius.lg}px`,
        fontSize: canvasTypography.small.fontSize,
        lineHeight: canvasTypography.small.lineHeight,
        color: tokens.text.primary,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: `${canvasSpacing[0.5]}px` }}>{tip.label}</div>
      {tip.entries.map((e) => (
        <div
          key={e.name}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: `${canvasSpacing[3]}px`,
            marginBottom: "1px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: `${canvasSpacing[1]}px`, color: tokens.text.secondary }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: canvasRadius.full, background: e.color, flexShrink: 0 }} />
            <span>{e.name}</span>
          </div>
          <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: tokens.text.primary }}>
            {formatWithAffix(e.value, prefix ?? "", suffix ?? "")}
          </span>
        </div>
      ))}
      {tip.total != null ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: `${canvasSpacing[3]}px`,
            marginTop: `${canvasSpacing[0.5]}px`,
            paddingTop: `${canvasSpacing[0.5]}px`,
            borderTop: `1px solid ${tokens.stroke.secondary}`,
          }}
        >
          <span style={{ color: tokens.text.secondary }}>Total</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: tokens.text.primary }}>
            {formatWithAffix(tip.total, prefix ?? "", suffix ?? "")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Legend({ items, tokens }) {
  if (items.length <= 1) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: `${canvasSpacing[2]}px ${canvasSpacing[3]}px`,
        marginTop: `${canvasSpacing[2]}px`,
        fontSize: canvasTypography.small.fontSize,
        lineHeight: canvasTypography.small.lineHeight,
        color: tokens.text.secondary,
      }}
    >
      {items.map((e) => (
        <div key={e.name} style={{ display: "inline-flex", alignItems: "center", gap: `${canvasSpacing[1]}px` }}>
          <span style={{ width: 8, height: 8, borderRadius: canvasRadius.full, background: e.color, flexShrink: 0 }} />
          <span>{e.name}</span>
        </div>
      ))}
    </div>
  );
}

export function BarChart({
  categories = [],
  series: seriesIn = [],
  height = DEFAULT_CHART_HEIGHT,
  stacked = false,
  horizontal = false,
  normalized = false,
  valueSuffix = "",
  valuePrefix = "",
  showValues,
  beginAtZero = true,
  yMin,
  yMax,
  referenceLines,
  style,
}) {
  const { tokens } = useHostTheme();
  const { ref, width } = useMeasuredWidth();
  const { tip, show, hide } = useTooltip();
  const series = seriesIn.map((s) => ({ ...s, data: s.data ?? [] }));
  const stackOn = stacked || normalized;
  const nCat = categories.length;
  const nSer = series.length;
  if (nCat === 0 || nSer === 0) return emptyState(height, tokens, style);

  const labelsOn = !stackOn && (showValues ?? (nSer === 1 && nCat <= 8));
  const W = Math.max(width, 1);
  const margin = horizontal
    ? { ...HORIZONTAL_BAR_MARGINS, right: labelsOn ? 48 : HORIZONTAL_BAR_MARGINS.right }
    : VERTICAL_MARGINS;
  const plotW = Math.max(W - margin.left - margin.right, 1);
  const plotH = Math.max(height - margin.top - margin.bottom, 1);
  const stride = horizontal ? fitStride(nCat, plotH, 18) : fitStride(nCat, plotW, estLabelWidthPx(categories, 12));

  const stackTotals = [];
  if (stackOn) {
    for (let i = 0; i < nCat; i++) {
      let sum = 0;
      for (const s of series) sum += sanitize(s.data[i] ?? 0);
      stackTotals.push(sum);
    }
  }
  const extras = (referenceLines ?? []).map((l) => l.value).filter((v) => Number.isFinite(v));
  let scale;
  if (normalized) scale = buildScale(0, 100, { yMin: 0, yMax: 100, extra: extras });
  else if (stackOn) scale = buildScale(0, Math.max(...stackTotals, 0), { beginAtZero: true, extra: extras });
  else {
    let lo = Number.POSITIVE_INFINITY;
    let hi = 0;
    for (const s of series) {
      for (const v of s.data) {
        const n = sanitize(v);
        lo = Math.min(lo, n);
        hi = Math.max(hi, n);
      }
    }
    if (!Number.isFinite(lo)) lo = 0;
    scale = buildScale(lo, hi, { beginAtZero, yMin, yMax, extra: extras });
  }
  const suffix = normalized ? "%" : valueSuffix;
  const prefix = normalized ? "" : valuePrefix;

  const onHover = (ci, x, y) => {
    const entries = series.map((s, si) => {
      const raw = sanitize(s.data[ci] ?? 0);
      const value = normalized && stackTotals[ci] > 0 ? (raw / stackTotals[ci]) * 100 : raw;
      return { color: barColor(series, si, ci), name: s.name, value };
    });
    show(x, y, categories[ci], entries, stackOn && !normalized ? stackTotals[ci] : undefined);
  };

  const svgProps = {
    width: W,
    height,
    viewBox: `0 0 ${W} ${height}`,
    role: "img",
    "aria-label": "Bar chart",
    style: { display: "block", width: "100%", height: `${height}px` },
  };

  if (horizontal) {
    const rowH = plotH / Math.max(nCat, 1);
    const text = svgTextProps(tokens);
    return (
      <div ref={ref} style={mergeStyle({ width: "100%", minWidth: 0, position: "relative" }, style)} onMouseLeave={hide}>
        <svg {...svgProps}>
          {scale.ticks.map((tick) => {
            const x = margin.left + valueFrac(scale, tick) * plotW;
            return (
              <g key={tick}>
                {tick > scale.min ? (
                  <line x1={x} x2={x} y1={margin.top} y2={height - margin.bottom} stroke={tokens.stroke.tertiary} strokeWidth={1} />
                ) : null}
                <text x={x} y={height - canvasSpacing[1]} textAnchor="middle" {...text}>
                  {formatWithAffix(tick, prefix, suffix)}
                </text>
              </g>
            );
          })}
          {categories.map((cat, ci) => {
            const y0 = margin.top + ci * rowH;
            const label = (nCat - 1 - ci) % stride === 0 ? (
              <text x={margin.left - canvasSpacing[2]} y={y0 + rowH / 2} textAnchor="end" dominantBaseline="middle" {...text}>
                {truncateLabel(cat, 14)}
              </text>
            ) : null;
            const hover = (e) => {
              const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
              onHover(ci, e.clientX - box.left, e.clientY - box.top);
            };
            if (stackOn) {
              const total = stackTotals[ci];
              let acc = 0;
              return (
                <g key={cat} onMouseMove={hover}>
                  {label}
                  {series.map((s, si) => {
                    const raw = sanitize(s.data[ci] ?? 0);
                    const w = (total > 0 ? (normalized ? raw / total : raw / scale.max) : 0) * plotW;
                    const x = margin.left + acc;
                    acc += w;
                    return (
                      <rect key={s.name} x={x} y={y0 + 0.15 * rowH} width={Math.max(w, 0)} height={0.7 * rowH} fill={barColor(series, si, ci)} rx={ci === 0 || ci === nCat - 1 ? 2 : 0} />
                    );
                  })}
                </g>
              );
            }
            const barH = (0.7 * rowH) / nSer;
            return (
              <g key={cat} onMouseMove={hover}>
                {label}
                {series.map((s, si) => {
                  const raw = sanitize(s.data[ci] ?? 0);
                  const w = valueFrac(scale, raw) * plotW;
                  const y = y0 + 0.15 * rowH + si * barH;
                  return (
                    <g key={s.name}>
                      <rect x={margin.left} y={y} width={w} height={Math.max(barH - 1, 1)} fill={barColor(series, si, ci)} />
                      {labelsOn && raw > 0 ? (
                        <text
                          x={margin.left + w + canvasSpacing[1.5]}
                          y={y + barH / 2}
                          textAnchor="start"
                          dominantBaseline="middle"
                          fill={tokens.text.primary}
                          fontFamily="inherit"
                          fontSize={canvasTypography.small.fontSize}
                          fontWeight={500}
                        >
                          {formatWithAffix(raw, prefix, suffix)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            );
          })}
          {renderReferenceLines("vertical", W, height, margin, scale, referenceLines, tokens)}
        </svg>
        {tip ? <TooltipOverlay tip={tip} tokens={tokens} containerWidth={W} suffix={suffix} prefix={prefix} /> : null}
      </div>
    );
  }

  const colW = plotW / Math.max(nCat, 1);
  const text = svgTextProps(tokens);
  return (
    <div ref={ref} style={mergeStyle({ width: "100%", minWidth: 0, position: "relative" }, style)} onMouseLeave={hide}>
      <svg {...svgProps}>
        {renderYAxis(W, height, margin, scale, tokens, suffix, prefix)}
        {categories.map((cat, ci) => {
          const x0 = margin.left + ci * colW;
          const hover = (e) => {
            const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
            onHover(ci, e.clientX - box.left, e.clientY - box.top);
          };
          const catLabel =
            (nCat - 1 - ci) % stride === 0 ? (
              <text x={x0 + colW / 2} y={height - canvasSpacing[1]} textAnchor="middle" {...text}>
                {truncateLabel(cat)}
              </text>
            ) : null;
          if (stackOn) {
            const total = stackTotals[ci];
            let acc = 0;
            const bw = Math.min(0.7 * colW, 56);
            const bx = x0 + (colW - bw) / 2;
            return (
              <g key={cat} onMouseMove={hover}>
                <rect x={x0} y={margin.top} width={colW} height={plotH} fill="transparent" />
                {[...series].reverse().map((s, rev) => {
                  const si = nSer - 1 - rev;
                  const raw = sanitize(s.data[ci] ?? 0);
                  const h = (total > 0 ? (normalized ? raw / total : raw / scale.max) : 0) * plotH;
                  const y = margin.top + plotH - acc - h;
                  acc += h;
                  return <rect key={s.name} x={bx} y={y} width={bw} height={Math.max(h, 0)} fill={barColor(series, si, ci)} />;
                })}
                {nSer > 1
                  ? (() => {
                      let e = 0;
                      return [...series].reverse().map((s, t) => {
                        const raw = sanitize(s.data[ci] ?? 0);
                        const frac = total > 0 ? (normalized ? raw / total : raw / scale.max) : 0;
                        e += frac * plotH;
                        if (t === nSer - 1) return null;
                        const y = margin.top + plotH - e;
                        return <line key={`sep-${s.name}`} x1={bx} x2={bx + bw} y1={y} y2={y} stroke={tokens.bg.editor} strokeWidth={0.5} strokeOpacity={0.4} />;
                      });
                    })()
                  : null}
                {catLabel}
              </g>
            );
          }
          const groupW = 0.7 * colW;
          const barW = groupW / nSer;
          const gx = x0 + (colW - groupW) / 2;
          return (
            <g key={cat} onMouseMove={hover}>
              <rect x={x0} y={margin.top} width={colW} height={plotH} fill="transparent" />
              {series.map((s, si) => {
                const raw = sanitize(s.data[ci] ?? 0);
                const h = valueFrac(scale, raw) * plotH;
                const x = gx + si * barW;
                const y = margin.top + plotH - h;
                const show = labelsOn && (nSer === 1 || barW >= 14) && raw > 0;
                return (
                  <g key={s.name}>
                    <rect x={x} y={y} width={Math.max(barW - 1, 1)} height={h} fill={barColor(series, si, ci)} />
                    {show ? (
                      <text
                        x={x + barW / 2}
                        y={Math.max(y - 4, margin.top)}
                        textAnchor="middle"
                        fill={tokens.text.primary}
                        fontFamily="inherit"
                        fontSize={canvasTypography.small.fontSize}
                        fontWeight={500}
                      >
                        {formatWithAffix(raw, prefix, suffix)}
                      </text>
                    ) : null}
                  </g>
                );
              })}
              {catLabel}
            </g>
          );
        })}
        {renderReferenceLines("horizontal", W, height, margin, scale, referenceLines, tokens)}
      </svg>
      {tip ? <TooltipOverlay tip={tip} tokens={tokens} containerWidth={W} suffix={suffix} prefix={prefix} /> : null}
      <Legend items={series.map((s, i) => ({ name: s.name, color: seriesColor(i, s.tone) }))} tokens={tokens} />
    </div>
  );
}

export function LineChart({
  categories = [],
  series: seriesIn = [],
  height = DEFAULT_CHART_HEIGHT,
  fill = false,
  valueSuffix = "",
  valuePrefix = "",
  showValues = false,
  showHoverGuide = true,
  beginAtZero = true,
  yMin,
  yMax,
  referenceLines,
  style,
}) {
  const { tokens } = useHostTheme();
  const { ref, width } = useMeasuredWidth();
  const series = seriesIn.map((s) => ({ ...s, data: s.data ?? [] }));
  const { tip, show, hide } = useTooltip();
  const nCat = categories.length;
  const nSer = series.length;
  if (nCat === 0 || nSer === 0) return emptyState(height, tokens, style);

  const W = Math.max(width, 1);
  const margin = VERTICAL_MARGINS;
  const plotW = Math.max(W - margin.left - margin.right, 1);
  const plotH = Math.max(height - margin.top - margin.bottom, 1);
  const stride = fitStride(nCat, plotW, estLabelWidthPx(categories, 12));
  const extras = (referenceLines ?? []).map((l) => l.value).filter((v) => Number.isFinite(v));
  let lo = Number.POSITIVE_INFINITY;
  let hi = 0;
  for (const s of series) {
    for (const v of s.data) {
      const n = sanitize(v);
      lo = Math.min(lo, n);
      hi = Math.max(hi, n);
    }
  }
  if (!Number.isFinite(lo)) lo = 0;
  const scale = buildScale(lo, hi, { beginAtZero, yMin, yMax, extra: extras });
  const colors = series.map((s, i) => seriesColor(i, s.tone));
  const text = svgTextProps(tokens);
  const xAt = (i) => (nCat === 1 ? margin.left + plotW / 2 : margin.left + (plotW * i) / (nCat - 1));
  const yAt = (v) => margin.top + plotH - valueFrac(scale, v) * plotH;
  const guideX = showHoverGuide && tip ? Math.max(margin.left, Math.min(margin.left + plotW, tip.x)) : null;

  return (
    <div ref={ref} style={mergeStyle({ width: "100%", minWidth: 0, position: "relative" }, style)} onMouseLeave={hide}>
      <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} role="img" aria-label="Line chart" style={{ display: "block", width: "100%", height: `${height}px` }}>
        {renderYAxis(W, height, margin, scale, tokens, valueSuffix, valuePrefix)}
        {series.map((s, si) => {
          const color = colors[si];
          const pts = s.data.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
          if (pts.length === 0) return null;
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
          const area =
            fill && pts.length >= 2
              ? [`M ${pts[0].x} ${margin.top + plotH}`, ...pts.map((p) => `L ${p.x} ${p.y}`), `L ${pts[pts.length - 1].x} ${margin.top + plotH}`, "Z"].join(" ")
              : null;
          return (
            <g key={s.name}>
              {area ? <path d={area} fill={color} fillOpacity={0.12} stroke="none" /> : null}
              <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {nCat <= 20
                ? pts.map((p, i) => <circle key={`${s.name}-${categories[i] ?? i}`} cx={p.x} cy={p.y} r={2.5} fill={color} />)
                : null}
              {showValues && nCat <= 20
                ? pts.map((p, i) => (
                    <text
                      key={`label-${s.name}-${categories[i] ?? i}`}
                      x={p.x}
                      y={Math.max(p.y - 7, margin.top + 2)}
                      textAnchor="middle"
                      fill={tokens.text.primary}
                      fontFamily="inherit"
                      fontSize={canvasTypography.small.fontSize}
                      fontWeight={500}
                    >
                      {formatWithAffix(sanitize(s.data[i] ?? 0), valuePrefix, valueSuffix)}
                    </text>
                  ))
                : null}
            </g>
          );
        })}
        {categories.map((cat, i) => {
          const x = nCat === 1 ? margin.left : xAt(i);
          const band = nCat === 1 ? plotW : plotW / (nCat - 1);
          return (
            <g key={cat}>
              <rect
                x={x - band / 2}
                y={margin.top}
                width={band}
                height={plotH}
                fill="transparent"
                onMouseMove={(e) => {
                  const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                  show(
                    e.clientX - box.left,
                    e.clientY - box.top,
                    categories[i],
                    series.map((s, si) => ({ color: colors[si], name: s.name, value: sanitize(s.data[i] ?? 0) }))
                  );
                }}
              />
              {(nCat - 1 - i) % stride === 0 ? (
                <text x={x} y={height - canvasSpacing[1]} textAnchor="middle" {...text}>
                  {truncateLabel(cat)}
                </text>
              ) : null}
            </g>
          );
        })}
        {renderReferenceLines("horizontal", W, height, margin, scale, referenceLines, tokens)}
        {guideX != null ? (
          <line
            x1={guideX}
            x2={guideX}
            y1={margin.top}
            y2={margin.top + plotH}
            stroke={tokens.stroke.focused}
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeWidth={1.5}
            opacity={0.72}
            pointerEvents="none"
          />
        ) : null}
      </svg>
      {tip ? <TooltipOverlay tip={tip} tokens={tokens} containerWidth={W} suffix={valueSuffix} prefix={valuePrefix} /> : null}
      <Legend items={series.map((s, i) => ({ name: s.name, color: colors[i] }))} tokens={tokens} />
    </div>
  );
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arcPath(cx, cy, r, a0, a1) {
  const p = polarToCartesian(cx, cy, r, a1);
  return `A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p.x} ${p.y}`;
}
function slicePath(donut, cx, cy, outer, inner, a0, a1) {
  if (!donut) {
    const p = polarToCartesian(cx, cy, outer, a0);
    return [`M ${cx} ${cy}`, `L ${p.x} ${p.y}`, arcPath(cx, cy, outer, a0, a1), "Z"].join(" ");
  }
  const o0 = polarToCartesian(cx, cy, outer, a0);
  const i1 = polarToCartesian(cx, cy, inner, a1);
  const i0 = polarToCartesian(cx, cy, inner, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return [`M ${o0.x} ${o0.y}`, arcPath(cx, cy, outer, a0, a1), `L ${i1.x} ${i1.y}`, `A ${inner} ${inner} 0 ${large} 0 ${i0.x} ${i0.y}`, "Z"].join(" ");
}

export function PieChart({ data = [], size = DEFAULT_PIE_SIZE, donut = false, style }) {
  const { tokens } = useHostTheme();
  const [hover, setHover] = useState(null);
  const points = data.map((p, i) => ({
    ...p,
    value: sanitize(p.value),
    color: toneToColor(p.tone) ?? chartColorSequence[i % chartColorSequence.length],
  }));
  const total = points.reduce((s, p) => s + p.value, 0);
  if (points.length === 0 || total <= 0) return emptyState(size, tokens, style);

  const cx = size / 2;
  const cy = size / 2;
  const r = Math.max(size / 2 - canvasSpacing[2], 16);
  const inner = donut ? 0.55 * r : 0;
  const rHover = r + 4;
  const nonzero = points.filter((p) => p.value > 0);
  const single = nonzero.length === 1;
  const singleIndex = single ? points.findIndex((p) => p.value > 0) : null;
  const slices = [];
  if (!single) {
    let acc = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const next = acc + (p.value / total) * 360;
      if (p.value > 0) {
        slices.push({
          d: slicePath(donut, cx, cy, r, inner, acc, next),
          dHover: slicePath(donut, cx, cy, rHover, inner, acc, next),
          color: p.color,
          label: p.label,
          value: p.value,
          dataIndex: i,
        });
      }
      acc = next;
    }
  }
  const active = hover != null ? points[hover] : undefined;

  return (
    <div
      style={mergeStyle(
        {
          width: "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: `${canvasSpacing[3]}px`,
          position: "relative",
        },
        style
      )}
      onMouseLeave={() => setHover(null)}
    >
      <svg width={size + 8} height={size + 8} viewBox={`-4 -4 ${size + 8} ${size + 8}`} role="img" aria-label="Pie chart" style={{ display: "block" }}>
        {single ? (
          <g onMouseEnter={() => setHover(singleIndex)} onMouseLeave={() => setHover(null)}>
            <circle cx={cx} cy={cy} r={hover === singleIndex ? rHover : r} fill={nonzero[0].color} style={{ transition: "r 120ms ease" }} />
            {donut ? <circle cx={cx} cy={cy} r={inner} fill={tokens.bg.editor} /> : null}
          </g>
        ) : (
          slices.map((s) => (
            <path
              key={s.label}
              d={hover === s.dataIndex ? s.dHover : s.d}
              fill={s.color}
              fillOpacity={hover == null || hover === s.dataIndex ? 1 : 0.4}
              style={{ transition: "d 120ms ease, fill-opacity 120ms ease" }}
              onMouseEnter={() => setHover(s.dataIndex)}
              onMouseLeave={() => setHover(null)}
            />
          ))
        )}
        {donut ? (
          <g style={{ pointerEvents: "none" }}>
            <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle" fill={tokens.text.primary} fontFamily="inherit" fontSize={canvasTypography.body.fontSize} fontWeight={600}>
              {formatValue(total)}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" fill={tokens.text.tertiary} fontFamily="inherit" fontSize={canvasTypography.small.fontSize}>
              Total
            </text>
          </g>
        ) : null}
      </svg>
      {active && active.value > 0 ? (
        <div
          style={{
            position: "absolute",
            top: `${size + 12}px`,
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 10,
            padding: `${canvasSpacing[1.5]}px ${canvasSpacing[2]}px`,
            background: tokens.bg.chrome,
            border: `1px solid ${tokens.stroke.primary}`,
            borderRadius: `${canvasRadius.lg}px`,
            fontSize: canvasTypography.small.fontSize,
            lineHeight: canvasTypography.small.lineHeight,
            color: tokens.text.primary,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: `${canvasSpacing[1.5]}px`,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: canvasRadius.full, background: active.color, flexShrink: 0 }} />
          <span style={{ color: tokens.text.secondary }}>{active.label}</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatValue(active.value)}</span>
          <span style={{ color: tokens.text.tertiary }}>{formatPercent((active.value / total) * 100)}</span>
        </div>
      ) : null}
      <div style={{ width: "100%", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `${canvasSpacing[2]}px ${canvasSpacing[3]}px` }}>
        {points.map((p, i) => {
          const pct = total > 0 ? (p.value / total) * 100 : 0;
          const on = hover == null || hover === i;
          return (
            <div
              key={p.label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: `${canvasSpacing[1.5]}px`,
                color: tokens.text.secondary,
                fontSize: canvasTypography.small.fontSize,
                lineHeight: canvasTypography.small.lineHeight,
                opacity: on ? 1 : 0.4,
                transition: "opacity 120ms ease",
                cursor: "default",
              }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <span style={{ width: canvasSpacing[2], height: canvasSpacing[2], borderRadius: canvasRadius.full, background: p.color }} />
              <span>{truncateLabel(p.label, 18)}</span>
              <span style={{ color: tokens.text.tertiary }}>{formatPercent(pct)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
