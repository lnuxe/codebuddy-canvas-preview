import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export { useEffect, useMemo, useRef, useState };

const DARK = {
  bg: { editor: "#181818", chrome: "#141414", elevated: "#1E1E1E" },
  text: {
    primary: "#F0F0F0",
    secondary: "rgba(240,240,240,0.74)",
    tertiary: "rgba(240,240,240,0.60)",
    quaternary: "rgba(240,240,240,0.36)",
    link: "#7EB6FF",
    onAccent: "#FFFFFF",
  },
  stroke: {
    primary: "rgba(240,240,240,0.20)",
    secondary: "rgba(240,240,240,0.12)",
    tertiary: "rgba(240,240,240,0.08)",
    focused: "#3B82F6",
  },
  fill: {
    primary: "rgba(240,240,240,0.20)",
    secondary: "rgba(240,240,240,0.14)",
    tertiary: "rgba(240,240,240,0.08)",
    quaternary: "rgba(240,240,240,0.06)",
  },
  accent: { primary: "#3B82F6", control: "#2563EB", controlHover: "#1D4ED8" },
  diff: {
    insertedLine: "rgba(31,138,101,0.22)",
    removedLine: "rgba(192,72,72,0.22)",
    stripAdded: "rgba(31,138,101,0.55)",
    stripRemoved: "rgba(192,72,72,0.55)",
  },
  category: {
    gray: "#9CA3AF",
    purple: "#A78BFA",
    green: "#34D399",
    yellow: "#FBBF24",
    cyan: "#22D3EE",
    pink: "#F472B6",
    blue: "#60A5FA",
    orange: "#FB923C",
    red: "#F87171",
  },
};

const LIGHT = {
  bg: { editor: "#FFFFFF", chrome: "#F4F4F5", elevated: "#FFFFFF" },
  text: {
    primary: "#141414",
    secondary: "rgba(20,20,20,0.74)",
    tertiary: "rgba(20,20,20,0.60)",
    quaternary: "rgba(20,20,20,0.36)",
    link: "#2563EB",
    onAccent: "#FFFFFF",
  },
  stroke: {
    primary: "rgba(20,20,20,0.20)",
    secondary: "rgba(20,20,20,0.12)",
    tertiary: "rgba(20,20,20,0.08)",
    focused: "#2563EB",
  },
  fill: {
    primary: "rgba(20,20,20,0.12)",
    secondary: "rgba(20,20,20,0.08)",
    tertiary: "rgba(20,20,20,0.05)",
    quaternary: "rgba(20,20,20,0.03)",
  },
  accent: { primary: "#2563EB", control: "#1D4ED8", controlHover: "#1E40AF" },
  diff: {
    insertedLine: "rgba(31,138,101,0.14)",
    removedLine: "rgba(192,72,72,0.14)",
    stripAdded: "rgba(31,138,101,0.45)",
    stripRemoved: "rgba(192,72,72,0.45)",
  },
  category: {
    gray: "#6B7280",
    purple: "#7C3AED",
    green: "#059669",
    yellow: "#D97706",
    cyan: "#0891B2",
    pink: "#DB2777",
    blue: "#2563EB",
    orange: "#EA580C",
    red: "#DC2626",
  },
};

function withStrokeToString(tokens) {
  const stroke = {
    ...tokens.stroke,
    toString() {
      return this.primary;
    },
    valueOf() {
      return this.primary;
    },
  };
  return { ...tokens, stroke };
}

function buildTheme(kind) {
  const tokens = withStrokeToString(kind === "light" ? LIGHT : DARK);
  return {
    kind,
    ...tokens,
    tokens,
    palette: {
      foreground: tokens.text.primary,
      editor: tokens.bg.editor,
      accent: tokens.accent.primary,
    },
  };
}

const ThemeContext = createContext(buildTheme("dark"));

export const canvasTokens = DARK;
export const canvasTokensLight = LIGHT;
export const canvasPaletteDark = DARK;
export const canvasPaletteLight = LIGHT;
export const categoryPaletteDark = DARK.category;
export const categoryPaletteLight = LIGHT.category;
export const colorPalette = DARK.category;
export const usageColorSequence = [
  "blue",
  "green",
  "orange",
  "purple",
  "cyan",
  "pink",
  "yellow",
  "red",
  "gray",
];

export function useHostTheme() {
  return useContext(ThemeContext);
}

const canvasStateStore = new Map();

export function useCanvasState(key, initial) {
  const [value, setValue] = useState(() => {
    if (canvasStateStore.has(key)) return canvasStateStore.get(key);
    return typeof initial === "function" ? initial() : initial;
  });
  const set = (action) => {
    setValue((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      canvasStateStore.set(key, next);
      return next;
    });
  };
  return [value, set];
}

export function useCanvasAction() {
  return () => {};
}

export function mergeStyle(base, override) {
  return { ...(base || {}), ...(override || {}) };
}

export function Stack({ children, gap = 0, style }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Row({
  children,
  gap = 0,
  align,
  cross,
  justify = "start",
  wrap = false,
  style,
}) {
  const map = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
    "space-between": "space-between",
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap,
        alignItems: map[align || cross || "stretch"] || align || cross,
        justifyContent: map[justify] || justify,
        flexWrap: wrap ? "wrap" : "nowrap",
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Grid({ children, columns, gap = 0, align, style }) {
  const template =
    typeof columns === "number"
      ? `repeat(${columns}, minmax(0, 1fr))`
      : columns;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: template,
        gap,
        alignItems: align || "stretch",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Divider({ style }) {
  const theme = useHostTheme();
  return (
    <div
      style={{
        height: 1,
        background: theme.stroke.tertiary,
        width: "100%",
        ...style,
      }}
    />
  );
}

export function Spacer() {
  return <div style={{ flex: 1, minWidth: 0 }} />;
}

export function Text({
  children,
  tone = "primary",
  size = "body",
  as,
  weight = "normal",
  italic,
  truncate,
  style,
}) {
  const theme = useHostTheme();
  const Tag = as || "p";
  const weights = { normal: 400, medium: 500, semibold: 590, bold: 700 };
  return (
    <Tag
      style={{
        margin: 0,
        color: theme.text[tone] || theme.text.primary,
        fontSize: size === "small" ? 12 : 14,
        lineHeight: size === "small" ? "16px" : "20px",
        fontWeight: weights[weight] || 400,
        fontStyle: italic ? "italic" : undefined,
        overflow: truncate ? "hidden" : undefined,
        textOverflow: truncate ? "ellipsis" : undefined,
        whiteSpace: truncate ? "nowrap" : undefined,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export function H1({ children, style }) {
  const theme = useHostTheme();
  return (
    <h1
      style={{
        margin: 0,
        fontSize: 24,
        lineHeight: "30px",
        fontWeight: 590,
        color: theme.text.primary,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function H2({ children, style }) {
  const theme = useHostTheme();
  return (
    <h2
      style={{
        margin: 0,
        fontSize: 18,
        lineHeight: "24px",
        fontWeight: 590,
        color: theme.text.primary,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

export function H3({ children, style }) {
  const theme = useHostTheme();
  return (
    <h3
      style={{
        margin: 0,
        fontSize: 16,
        lineHeight: "22px",
        fontWeight: 590,
        color: theme.text.primary,
        ...style,
      }}
    >
      {children}
    </h3>
  );
}

export function Code({ children, style }) {
  const theme = useHostTheme();
  return (
    <code
      style={{
        fontSize: "0.92em",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        background: theme.fill.tertiary,
        padding: "1px 5px",
        borderRadius: 4,
        ...style,
      }}
    >
      {children}
    </code>
  );
}

export function Link({ children, href, style }) {
  const theme = useHostTheme();
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ color: theme.text.link, textDecoration: "none", ...style }}
    >
      {children}
    </a>
  );
}

export function Card({ children, variant = "default", style }) {
  const theme = useHostTheme();
  const tinted = variant === "tinted";
  const borderless = variant === "borderless";
  return (
    <div
      style={{
        background: tinted ? theme.fill.tertiary : theme.bg.elevated,
        border: borderless ? "none" : `1px solid ${theme.stroke.secondary}`,
        borderRadius: borderless ? 0 : 8,
        overflow: "hidden",
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, children, trailing, style }) {
  const theme = useHostTheme();
  const label = title != null ? title : children;
  const trail = trailing != null ? trailing : title != null ? children : null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "10px 14px",
        minHeight: 28,
        borderBottom: `1px solid ${theme.stroke.tertiary}`,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 590,
          color: theme.text.secondary,
          lineHeight: "16px",
        }}
      >
        {label}
      </div>
      {trail ? <div style={{ display: "flex", alignItems: "center" }}>{trail}</div> : null}
    </div>
  );
}

export function CardBody({ children, style }) {
  return <div style={{ padding: 14, ...style }}>{children}</div>;
}

export function Button({
  children,
  variant = "secondary",
  disabled,
  type = "button",
  style,
  onClick,
}) {
  const theme = useHostTheme();
  const styles =
    variant === "primary"
      ? { background: theme.accent.control, color: theme.text.onAccent, border: "none" }
      : variant === "ghost"
        ? { background: "transparent", color: theme.text.secondary, border: "none" }
        : {
            background: theme.fill.tertiary,
            color: theme.text.primary,
            border: `1px solid ${theme.stroke.secondary}`,
          };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        height: 24,
        padding: "0 10px",
        borderRadius: 6,
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...styles,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const PILL_TONES = {
  accent: { bg: "rgba(59,130,246,0.18)", fg: "#93C5FD", bd: "rgba(59,130,246,0.35)" },
  info: { bg: "rgba(96,165,250,0.16)", fg: "#93C5FD", bd: "rgba(96,165,250,0.30)" },
  success: { bg: "rgba(52,211,153,0.16)", fg: "#6EE7B7", bd: "rgba(52,211,153,0.30)" },
  warning: { bg: "rgba(251,191,36,0.16)", fg: "#FCD34D", bd: "rgba(251,191,36,0.30)" },
  danger: { bg: "rgba(248,113,113,0.16)", fg: "#FCA5A5", bd: "rgba(248,113,113,0.30)" },
  added: { bg: "rgba(52,211,153,0.16)", fg: "#6EE7B7", bd: "rgba(52,211,153,0.30)" },
  deleted: { bg: "rgba(248,113,113,0.16)", fg: "#FCA5A5", bd: "rgba(248,113,113,0.30)" },
  renamed: { bg: "rgba(96,165,250,0.16)", fg: "#93C5FD", bd: "rgba(96,165,250,0.30)" },
  neutral: { bg: "transparent", fg: "", bd: "" },
};

export function Pill({
  children,
  active,
  tone = "neutral",
  size = "md",
  leadingContent,
  keyboardHint,
  disabled,
  title,
  style,
  onClick,
}) {
  const theme = useHostTheme();
  const t = PILL_TONES[tone] || PILL_TONES.neutral;
  const sm = size === "sm";
  return (
    <span
      title={title}
      onClick={disabled ? undefined : onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        height: sm ? 18 : 22,
        padding: sm ? "0 6px" : "0 8px",
        borderRadius: 999,
        fontSize: sm ? 11 : 12,
        lineHeight: 1,
        color: active ? theme.text.onAccent : t.fg || theme.text.secondary,
        background: active ? theme.accent.primary : t.bg || theme.fill.quaternary,
        border: sm ? "none" : `1px solid ${active ? "transparent" : t.bd || theme.stroke.secondary}`,
        cursor: onClick && !disabled ? "pointer" : "default",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {leadingContent}
      {children}
      {keyboardHint ? (
        <span style={{ opacity: 0.7, fontSize: 10 }}>{keyboardHint}</span>
      ) : null}
    </span>
  );
}

export function Stat({ value, label, tone, style }) {
  const theme = useHostTheme();
  const colors = {
    success: theme.category.green,
    danger: theme.category.red,
    warning: theme.category.yellow,
    info: theme.category.blue,
  };
  return (
    <div style={{ minWidth: 0, ...style }}>
      <div
        style={{
          fontSize: 18,
          fontWeight: 590,
          lineHeight: "24px",
          color: (tone && colors[tone]) || theme.text.primary,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: theme.text.tertiary, marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

export function Callout({ children, tone = "info", title, style }) {
  const theme = useHostTheme();
  const colors = {
    info: theme.category.blue,
    success: theme.category.green,
    warning: theme.category.yellow,
    danger: theme.category.red,
    neutral: theme.text.secondary,
  };
  return (
    <div
      style={{
        border: `1px solid ${theme.stroke.secondary}`,
        borderLeft: `3px solid ${colors[tone] || colors.info}`,
        borderRadius: 8,
        padding: 12,
        background: theme.fill.quaternary,
        ...style,
      }}
    >
      {title ? (
        <div style={{ fontWeight: 590, marginBottom: 4, color: theme.text.primary }}>
          {title}
        </div>
      ) : null}
      <div style={{ color: theme.text.secondary, fontSize: 13 }}>{children}</div>
    </div>
  );
}

export function Table({
  headers = [],
  rows = [],
  columnAlign,
  framed = true,
  striped,
  emptyMessage,
  style,
}) {
  const theme = useHostTheme();
  return (
    <div
      style={{
        overflow: "auto",
        border: framed ? `1px solid ${theme.stroke.secondary}` : "none",
        borderRadius: framed ? 8 : 0,
        ...style,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: (columnAlign && columnAlign[i]) || "left",
                  padding: "8px 10px",
                  color: theme.text.tertiary,
                  fontWeight: 500,
                  borderBottom: `1px solid ${theme.stroke.tertiary}`,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: 12, color: theme.text.tertiary }}>
                {emptyMessage || ""}
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr
                key={ri}
                style={{
                  background: striped && ri % 2 === 1 ? theme.fill.quaternary : undefined,
                }}
              >
                {headers.map((_, ci) => (
                  <td
                    key={ci}
                    style={{
                      textAlign: (columnAlign && columnAlign[ci]) || "left",
                      padding: "8px 10px",
                      color: theme.text.primary,
                      borderBottom: `1px solid ${theme.stroke.tertiary}`,
                    }}
                  >
                    {row[ci]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Swatch({ color, label, style }) {
  const theme = useHostTheme();
  const hex = theme.category[color] || color || theme.accent.primary;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, ...style }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          background: hex,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}

export function UsageBar({ segments = [], style }) {
  const theme = useHostTheme();
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;
  return (
    <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", ...style }}>
      {segments.map((seg, i) => (
        <div
          key={i}
          title={seg.label}
          style={{
            width: `${((seg.value || 0) / total) * 100}%`,
            background: theme.category[seg.color] || theme.accent.primary,
          }}
        />
      ))}
    </div>
  );
}

export function TodoList({ items = [] }) {
  return (
    <Stack gap={6}>
      {items.map((item, i) => (
        <Row key={i} gap={8} cross="center">
          <span>{item.status === "done" ? "☑" : "☐"}</span>
          <Text>{item.label || item.title || item.text}</Text>
        </Row>
      ))}
    </Stack>
  );
}

export function TodoListCard(props) {
  return (
    <Card>
      <CardHeader title="Todos" />
      <CardBody>
        <TodoList {...props} />
      </CardBody>
    </Card>
  );
}

export function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          padding: "6px 0",
          cursor: "pointer",
          fontWeight: 590,
        }}
      >
        {open ? "▾" : "▸"} {title}
      </button>
      {open ? children : null}
    </div>
  );
}

export function IconButton({ children, onClick, style }) {
  const theme = useHostTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 24,
        height: 24,
        border: "none",
        background: "transparent",
        color: theme.text.secondary,
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function TextInput({ value, onChange, placeholder, style }) {
  const theme = useHostTheme();
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange && onChange(e.target.value)}
      style={{
        height: 28,
        borderRadius: 6,
        border: `1px solid ${theme.stroke.secondary}`,
        background: theme.bg.editor,
        color: theme.text.primary,
        padding: "0 8px",
        ...style,
      }}
    />
  );
}

export function TextArea(props) {
  const theme = useHostTheme();
  return (
    <textarea
      {...props}
      onChange={(e) => props.onChange && props.onChange(e.target.value)}
      style={{
        borderRadius: 6,
        border: `1px solid ${theme.stroke.secondary}`,
        background: theme.bg.editor,
        color: theme.text.primary,
        padding: 8,
        minHeight: 72,
        ...(props.style || {}),
      }}
    />
  );
}

export function Select({ options = [], value, onChange, style }) {
  const theme = useHostTheme();
  return (
    <select
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      style={{
        height: 28,
        borderRadius: 6,
        border: `1px solid ${theme.stroke.secondary}`,
        background: theme.bg.editor,
        color: theme.text.primary,
        ...(style || {}),
      }}
    >
      {options.map((opt) => {
        const v = typeof opt === "string" ? opt : opt.value;
        const l = typeof opt === "string" ? opt : opt.label;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

export function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange && onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <Checkbox checked={checked} onChange={onChange} />
  );
}

export const chartColorSequence = [
  "#2E79B5E0",
  "#1F8A65E8",
  "#F0A040E0",
  "#7B64B8F0",
  "#2A9A8AE0",
  "#C85898E0",
  "#E8C030E0",
  "#C04848E0",
  "#5A6CC0F0",
];

function toneColor(theme, tone, index) {
  const map = {
    success: theme.category.green,
    danger: theme.category.red,
    warning: theme.category.yellow,
    info: theme.category.blue,
    neutral: theme.category.gray,
  };
  if (tone && map[tone]) return map[tone];
  return chartColorSequence[index % chartColorSequence.length];
}

function formatVal(n, prefix = "", suffix = "") {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  const text =
    abs >= 1000 && abs % 1 === 0
      ? n.toLocaleString()
      : abs >= 10
        ? String(Math.round(n * 10) / 10)
        : String(Math.round(n * 100) / 100);
  return `${prefix}${text}${suffix}`;
}

function resolveXY(props) {
  if (props.categories && props.series) {
    return {
      categories: props.categories,
      series: props.series.map((s) => ({
        name: s.name || "series",
        data: (s.data || []).map((n) => Number(n) || 0),
        tone: s.tone,
      })),
    };
  }
  const rows = Array.isArray(props.data) ? props.data : [];
  const categories = rows.map((r) => String(r.label ?? r.name ?? r.x ?? ""));
  if (props.series && Array.isArray(props.series) && typeof props.series[0] === "object" && props.series[0].data) {
    return { categories, series: props.series };
  }
  const keys = rows[0]
    ? Object.keys(rows[0]).filter((k) => k !== "label" && k !== "name" && k !== "x")
    : ["value"];
  return {
    categories,
    series: keys.map((k) => ({
      name: k,
      data: rows.map((r) => Number(r[k] ?? r.value ?? 0) || 0),
    })),
  };
}

function valueDomain(series, { beginAtZero = true, yMin, yMax, stacked, normalized, referenceLines }) {
  if (normalized) return { min: 0, max: 100 };
  let min = Infinity;
  let max = -Infinity;
  const len = Math.max(0, ...series.map((s) => s.data.length));
  if (stacked) {
    for (let i = 0; i < len; i++) {
      const sum = series.reduce((acc, s) => acc + (Number(s.data[i]) || 0), 0);
      min = Math.min(min, 0, sum);
      max = Math.max(max, sum);
    }
  } else {
    for (const s of series) {
      for (const n of s.data) {
        min = Math.min(min, n);
        max = Math.max(max, n);
      }
    }
  }
  if (referenceLines) {
    for (const line of referenceLines) {
      min = Math.min(min, Number(line.value) || 0);
      max = Math.max(max, Number(line.value) || 0);
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0;
    max = 1;
  }
  if (yMin != null) min = yMin;
  else if (beginAtZero !== false) min = Math.min(0, min);
  if (yMax != null) max = yMax;
  if (max === min) max = min + 1;
  return { min, max };
}

function Legend({ series, theme }) {
  if (!series || series.length < 2) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
      {series.map((s, i) => (
        <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.text.secondary }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: toneColor(theme, s.tone, i) }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

export function BarChart(props) {
  const theme = useHostTheme();
  const {
    height = 220,
    stacked = false,
    horizontal = false,
    normalized = false,
    valueSuffix = "",
    valuePrefix = "",
    showValues,
    beginAtZero = true,
    yMin,
    yMax,
    referenceLines = [],
    style,
    title,
  } = props;
  const { categories, series } = resolveXY(props);
  const n = categories.length || 1;
  const stackOn = stacked || normalized;
  const domain = valueDomain(series, { beginAtZero, yMin, yMax, stacked: stackOn, normalized, referenceLines });
  const pad = { l: horizontal ? 88 : 36, r: 12, t: 12, b: horizontal ? 28 : 36 };
  const W = 560;
  const H = height;
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;
  const autoLabels = showValues == null ? series.length === 1 && n <= 8 && !stackOn : !!showValues;
  const groupW = pw / n;
  const innerGap = 4;
  const seriesN = Math.max(1, series.length);

  function scale(v) {
    return ((v - domain.min) / (domain.max - domain.min)) * (horizontal ? pw : ph);
  }

  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => domain.min + ((domain.max - domain.min) * i) / ticks);

  return (
    <div style={style}>
      {title ? <div style={{ fontSize: 12, color: theme.text.tertiary, marginBottom: 8 }}>{title}</div> : null}
      <Legend series={series} theme={theme} />
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {tickVals.map((tv, i) => {
          const pos = horizontal ? pad.l + scale(tv) : pad.t + ph - scale(tv);
          return (
            <g key={i}>
              <line
                x1={horizontal ? pos : pad.l}
                y1={horizontal ? pad.t : pos}
                x2={horizontal ? pos : W - pad.r}
                y2={horizontal ? H - pad.b : pos}
                stroke={theme.stroke.tertiary}
              />
              <text
                x={horizontal ? pos : pad.l - 6}
                y={horizontal ? H - pad.b + 14 : pos + 3}
                textAnchor={horizontal ? "middle" : "end"}
                fontSize="10"
                fill={theme.text.quaternary}
              >
                {formatVal(tv, valuePrefix, normalized ? "%" : valueSuffix)}
              </text>
            </g>
          );
        })}
        {categories.map((cat, ci) => {
          const stacks = [];
          let accPos = 0;
          let accNeg = 0;
          const bars = series.map((s, si) => {
            let raw = Number(s.data[ci]) || 0;
            if (normalized) {
              const tot = series.reduce((a, x) => a + Math.abs(Number(x.data[ci]) || 0), 0) || 1;
              raw = (raw / tot) * 100;
            }
            const color = series.length === 1 ? toneColor(theme, s.tone, ci) : toneColor(theme, s.tone, si);
            if (stackOn) {
              const start = raw >= 0 ? accPos : accNeg;
              if (raw >= 0) accPos += raw;
              else accNeg += raw;
              return { raw, start, color, name: s.name };
            }
            return { raw, start: 0, color, name: s.name };
          });
          stacks.push(bars);
          return (
            <g key={cat + ci}>
              {horizontal ? (
                bars.map((b, si) => {
                  const y = pad.t + ci * (ph / n) + (stackOn ? 4 : (ph / n) * (si / seriesN)) + 2;
                  const bh = stackOn ? ph / n - 8 : Math.max(4, ph / n / seriesN - innerGap);
                  const x0 = pad.l + scale(Math.min(b.start, b.start + b.raw));
                  const bw = Math.abs(scale(b.start + b.raw) - scale(b.start));
                  return (
                    <g key={si}>
                      <rect x={x0} y={y} width={Math.max(bw, 0)} height={bh} fill={b.color} rx="2">
                        <title>{`${b.name} · ${cat}: ${formatVal(b.raw, valuePrefix, valueSuffix)}`}</title>
                      </rect>
                    </g>
                  );
                })
              ) : (
                bars.map((b, si) => {
                  const x = pad.l + ci * groupW + (stackOn ? groupW * 0.18 : groupW * (si / seriesN) + groupW * 0.08);
                  const bw = stackOn ? groupW * 0.64 : Math.max(4, groupW / seriesN - innerGap);
                  const yVal = scale(b.start + b.raw);
                  const y0 = pad.t + ph - scale(Math.max(b.start, b.start + b.raw));
                  const bh = Math.abs(scale(b.start + b.raw) - scale(b.start));
                  return (
                    <g key={si}>
                      <rect x={x} y={y0} width={bw} height={Math.max(bh, 0)} fill={b.color} rx="2">
                        <title>{`${b.name} · ${cat}: ${formatVal(b.raw, valuePrefix, valueSuffix)}`}</title>
                      </rect>
                      {autoLabels ? (
                        <text
                          x={x + bw / 2}
                          y={y0 - 4}
                          textAnchor="middle"
                          fontSize="10"
                          fill={theme.text.secondary}
                        >
                          {formatVal(b.raw, valuePrefix, valueSuffix)}
                        </text>
                      ) : null}
                    </g>
                  );
                })
              )}
              <text
                x={horizontal ? 8 : pad.l + (ci + 0.5) * groupW}
                y={horizontal ? pad.t + (ci + 0.5) * (ph / n) + 4 : H - 10}
                textAnchor={horizontal ? "start" : "middle"}
                fontSize="10"
                fill={theme.text.tertiary}
              >
                {cat}
              </text>
            </g>
          );
        })}
        {referenceLines.map((line, i) => {
          const v = Number(line.value) || 0;
          const pos = horizontal ? pad.l + scale(v) : pad.t + ph - scale(v);
          const color = toneColor(theme, line.tone, i);
          return (
            <g key={`ref-${i}`}>
              <line
                x1={horizontal ? pos : pad.l}
                y1={horizontal ? pad.t : pos}
                x2={horizontal ? pos : W - pad.r}
                y2={horizontal ? H - pad.b : pos}
                stroke={color}
                strokeDasharray="4 3"
              />
              {line.label ? (
                <text
                  x={horizontal ? pos + 4 : W - pad.r}
                  y={horizontal ? pad.t + 12 : pos - 4}
                  textAnchor="end"
                  fontSize="10"
                  fill={color}
                >
                  {line.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function LineChart(props) {
  const theme = useHostTheme();
  const {
    height = 220,
    fill = false,
    valueSuffix = "",
    valuePrefix = "",
    showValues,
    showHoverGuide = true,
    beginAtZero = true,
    yMin,
    yMax,
    referenceLines = [],
    style,
    title,
  } = props;
  const { categories, series } = resolveXY(props);
  const n = Math.max(1, categories.length);
  const domain = valueDomain(series, { beginAtZero, yMin, yMax, referenceLines });
  const pad = { l: 40, r: 12, t: 12, b: 36 };
  const W = 560;
  const H = height;
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;
  const [hover, setHover] = useState(null);
  const autoLabels = showValues == null ? n <= 20 && series.length === 1 : !!showValues;

  function xAt(i) {
    return pad.l + (n <= 1 ? pw / 2 : (i / (n - 1)) * pw);
  }
  function yAt(v) {
    return pad.t + ph - ((v - domain.min) / (domain.max - domain.min)) * ph;
  }

  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => domain.min + ((domain.max - domain.min) * i) / ticks);

  return (
    <div style={style}>
      {title ? <div style={{ fontSize: 12, color: theme.text.tertiary, marginBottom: 8 }}>{title}</div> : null}
      <Legend series={series} theme={theme} />
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - box.left) / box.width) * W;
          let best = 0;
          let dist = Infinity;
          for (let i = 0; i < n; i++) {
            const d = Math.abs(xAt(i) - x);
            if (d < dist) {
              dist = d;
              best = i;
            }
          }
          setHover(best);
        }}
      >
        {tickVals.map((tv, i) => {
          const y = yAt(tv);
          return (
            <g key={i}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke={theme.stroke.tertiary} />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="10" fill={theme.text.quaternary}>
                {formatVal(tv, valuePrefix, valueSuffix)}
              </text>
            </g>
          );
        })}
        {series.map((s, si) => {
          const color = toneColor(theme, s.tone, si);
          const pts = s.data.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
          const line = s.data.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(v)}`).join(" ");
          const area =
            fill && s.data.length
              ? `${line} L${xAt(s.data.length - 1)},${yAt(domain.min)} L${xAt(0)},${yAt(domain.min)} Z`
              : null;
          return (
            <g key={s.name}>
              {area ? <path d={area} fill={color} opacity="0.16" /> : null}
              <path d={line} fill="none" stroke={color} strokeWidth="2" />
              {s.data.map((v, i) => (
                <circle key={i} cx={xAt(i)} cy={yAt(v)} r="3" fill={color}>
                  <title>{`${s.name} · ${categories[i]}: ${formatVal(v, valuePrefix, valueSuffix)}`}</title>
                </circle>
              ))}
              {autoLabels
                ? s.data.map((v, i) => (
                    <text key={`t${i}`} x={xAt(i)} y={yAt(v) - 8} textAnchor="middle" fontSize="10" fill={theme.text.secondary}>
                      {formatVal(v, valuePrefix, valueSuffix)}
                    </text>
                  ))
                : null}
            </g>
          );
        })}
        {showHoverGuide && hover != null ? (
          <line x1={xAt(hover)} y1={pad.t} x2={xAt(hover)} y2={pad.t + ph} stroke={theme.stroke.secondary} />
        ) : null}
        {referenceLines.map((line, i) => {
          const y = yAt(Number(line.value) || 0);
          const color = toneColor(theme, line.tone, i);
          return (
            <g key={`ref-${i}`}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke={color} strokeDasharray="4 3" />
              {line.label ? (
                <text x={W - pad.r} y={y - 4} textAnchor="end" fontSize="10" fill={color}>
                  {line.label}
                </text>
              ) : null}
            </g>
          );
        })}
        {categories.map((cat, i) => (
          <text key={cat + i} x={xAt(i)} y={H - 10} textAnchor="middle" fontSize="10" fill={theme.text.tertiary}>
            {cat}
          </text>
        ))}
      </svg>
      {hover != null ? (
        <div style={{ fontSize: 12, color: theme.text.secondary, marginTop: 6 }}>
          {categories[hover]}
          {series.map((s) => ` · ${s.name} ${formatVal(s.data[hover], valuePrefix, valueSuffix)}`).join("")}
        </div>
      ) : null}
    </div>
  );
}

export function PieChart({ data = [], size = 200, donut = false, height, title, style }) {
  const theme = useHostTheme();
  const [hover, setHover] = useState(null);
  const points = Array.isArray(data) ? data : [];
  const total = points.reduce((s, p) => s + Number(p.value || 0), 0) || 1;
  const dim = size || height || 200;
  const cx = dim / 2 + 8;
  const cy = dim / 2 + 8;
  const r = dim / 2 - 8;
  const inner = donut ? r * 0.58 : 0;
  let acc = 0;
  const slices = points.map((p, i) => {
    const value = Number(p.value || 0);
    const frac = value / total;
    const a0 = acc * Math.PI * 2 - Math.PI / 2;
    acc += frac;
    const a1 = acc * Math.PI * 2 - Math.PI / 2;
    const large = frac > 0.5 ? 1 : 0;
    const color = toneColor(theme, p.tone, i);
    function pt(a, rad) {
      return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
    }
    const [x0, y0] = pt(a0, r);
    const [x1, y1] = pt(a1, r);
    let d;
    if (donut) {
      const [ix0, iy0] = pt(a0, inner);
      const [ix1, iy1] = pt(a1, inner);
      d = `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${ix1},${iy1} A${inner},${inner} 0 ${large} 0 ${ix0},${iy0} Z`;
    } else {
      d = `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`;
    }
    return { d, color, label: p.label, value, frac, i };
  });

  return (
    <div style={style}>
      {title ? <div style={{ fontSize: 12, color: theme.text.tertiary, marginBottom: 8 }}>{title}</div> : null}
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <svg width={dim + 16} height={dim + 16} viewBox={`0 0 ${dim + 16} ${dim + 16}`}>
          {slices.map((s) => (
            <path
              key={s.i}
              d={s.d}
              fill={s.color}
              opacity={hover == null || hover === s.i ? 1 : 0.35}
              transform={hover === s.i ? `translate(0,0)` : undefined}
              onMouseEnter={() => setHover(s.i)}
              onMouseLeave={() => setHover(null)}
            >
              <title>{`${s.label}: ${s.value} (${Math.round(s.frac * 100)}%)`}</title>
            </path>
          ))}
          {donut ? (
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight="590" fill={theme.text.primary}>
              {total}
            </text>
          ) : null}
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {slices.map((s) => (
            <div
              key={s.i}
              onMouseEnter={() => setHover(s.i)}
              onMouseLeave={() => setHover(null)}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.text.secondary }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
              {s.label} · {Math.round(s.frac * 100)}%
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DiffView({
  lines = [],
  path: filePath,
  language,
  showLineNumbers = true,
  coloredLineNumbers = true,
  showAccentStrip = true,
  style,
}) {
  const theme = useHostTheme();
  return (
    <pre
      style={{
        margin: 0,
        fontSize: 12,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        overflow: "auto",
        ...style,
      }}
    >
      {lines.map((line, i) => {
        const t = line.type || (String(line).startsWith("+") ? "added" : String(line).startsWith("-") ? "removed" : "unchanged");
        const added = t === "added" || t === "add" || t === "inserted";
        const removed = t === "removed" || t === "del" || t === "deleted";
        const bg = added ? theme.diff.insertedLine : removed ? theme.diff.removedLine : "transparent";
        const strip = added ? theme.diff.stripAdded : removed ? theme.diff.stripRemoved : "transparent";
        const numColor = coloredLineNumbers
          ? added
            ? theme.category.green
            : removed
              ? theme.category.red
              : theme.text.quaternary
          : theme.text.quaternary;
        return (
          <div key={i} style={{ display: "flex", background: bg }}>
            {showAccentStrip ? (
              <span style={{ width: 3, background: strip, flex: "0 0 3px" }} />
            ) : null}
            {showLineNumbers ? (
              <span style={{ width: 36, textAlign: "right", padding: "0 8px", color: numColor, userSelect: "none" }}>
                {line.lineNumber || i + 1}
              </span>
            ) : null}
            <span style={{ padding: "0 8px", whiteSpace: "pre" }}>
              {line.text || line.content || line}
            </span>
          </div>
        );
      })}
    </pre>
  );
}

export function DiffStats({ additions = 0, deletions = 0, style }) {
  if (!additions && !deletions) return null;
  return (
    <Row gap={8} style={style}>
      <Text size="small" style={{ color: "#34D399" }}>
        +{additions}
      </Text>
      <Text size="small" style={{ color: "#F87171" }}>
        −{deletions}
      </Text>
    </Row>
  );
}

export function computeDAGLayout(options = {}) {
  const {
    nodes = [],
    edges = [],
    direction = "vertical",
    nodeWidth = 160,
    nodeHeight = 40,
    rankGap = 64,
    nodeGap = 48,
    padding = 24,
  } = options;
  const ids = nodes.map((n) => n.id);
  const incoming = new Map(ids.map((id) => [id, []]));
  const outgoing = new Map(ids.map((id) => [id, []]));
  for (const e of edges) {
    if (outgoing.has(e.from) && incoming.has(e.to)) {
      outgoing.get(e.from).push(e.to);
      incoming.get(e.to).push(e.from);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const back = new Set();
  function dfs(id) {
    visiting.add(id);
    for (const to of outgoing.get(id) || []) {
      const key = `${id}->${to}`;
      if (visiting.has(to)) back.add(key);
      else if (!visited.has(to)) dfs(to);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of ids) if (!visited.has(id)) dfs(id);

  const rank = new Map(ids.map((id) => [id, 0]));
  let changed = true;
  let guard = 0;
  while (changed && guard < ids.length + 2) {
    changed = false;
    guard += 1;
    for (const e of edges) {
      if (back.has(`${e.from}->${e.to}`)) continue;
      const next = (rank.get(e.from) || 0) + 1;
      if (next > (rank.get(e.to) || 0)) {
        rank.set(e.to, next);
        changed = true;
      }
    }
  }
  const byRank = new Map();
  for (const id of ids) {
    const r = rank.get(id) || 0;
    if (!byRank.has(r)) byRank.set(r, []);
    byRank.get(r).push(id);
  }
  const ranks = [...byRank.keys()].sort((a, b) => a - b);
  const placed = [];
  const pos = new Map();
  for (const r of ranks) {
    const row = byRank.get(r);
    row.forEach((id, order) => {
      const x =
        direction === "vertical"
          ? padding + order * (nodeWidth + nodeGap)
          : padding + r * (nodeWidth + rankGap);
      const y =
        direction === "vertical"
          ? padding + r * (nodeHeight + rankGap)
          : padding + order * (nodeHeight + nodeGap);
      const node = { id, x, y, rank: r, order };
      placed.push(node);
      pos.set(id, node);
    });
  }
  const layoutEdges = edges.map((e) => {
    const a = pos.get(e.from);
    const b = pos.get(e.to);
    if (!a || !b) {
      return { ...e, sourceX: 0, sourceY: 0, targetX: 0, targetY: 0, isBackEdge: true };
    }
    const vertical = direction === "vertical";
    return {
      from: e.from,
      to: e.to,
      sourceX: vertical ? a.x + nodeWidth / 2 : a.x + nodeWidth,
      sourceY: vertical ? a.y + nodeHeight : a.y + nodeHeight / 2,
      targetX: vertical ? b.x + nodeWidth / 2 : b.x,
      targetY: vertical ? b.y : b.y + nodeHeight / 2,
      isBackEdge: back.has(`${e.from}->${e.to}`),
    };
  });
  const rankBoxes = ranks.map((r) => {
    const row = byRank.get(r).map((id) => pos.get(id));
    const xs = row.map((n) => n.x);
    const ys = row.map((n) => n.y);
    return {
      rank: r,
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs) + nodeWidth,
      height: Math.max(...ys) - Math.min(...ys) + nodeHeight,
      nodeIds: byRank.get(r),
    };
  });
  const width = Math.max(nodeWidth, ...placed.map((n) => n.x + nodeWidth)) + padding;
  const height = Math.max(nodeHeight, ...placed.map((n) => n.y + nodeHeight)) + padding;
  return { nodes: placed, edges: layoutEdges, ranks: rankBoxes, direction, width, height };
}

export function CanvasThemeRoot({ kind = "dark", children }) {
  const theme = useMemo(() => buildTheme(kind), [kind]);
  return (
    <ThemeContext.Provider value={theme}>
      <div
        style={{
          minHeight: "100%",
          background: theme.bg.editor,
          color: theme.text.primary,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          "--accent": theme.accent.primary,
          "--danger": theme.category.red,
          "--stroke": theme.stroke.primary,
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

if (typeof window !== "undefined") {
  window.__canvasPreview = { CanvasThemeRoot, buildTheme };
}
