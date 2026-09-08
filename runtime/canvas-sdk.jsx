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

function ChartFrame({ title, children, style }) {
  const theme = useHostTheme();
  return (
    <div style={{ ...style }}>
      {title ? (
        <div style={{ fontSize: 12, color: theme.text.tertiary, marginBottom: 8 }}>
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function BarChart({ data = [], series, categories, height = 180, title, style }) {
  const theme = useHostTheme();
  const points = Array.isArray(data) ? data : [];
  const keys = series
    ? series.map((s) => s.key || s.name)
    : points[0]
      ? Object.keys(points[0]).filter((k) => k !== "label" && k !== "name" && k !== "x")
      : ["value"];
  const max = Math.max(
    1,
    ...points.flatMap((p) => keys.map((k) => Number(p[k] ?? p.value ?? 0)))
  );
  return (
    <ChartFrame title={title} style={style}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height }}>
        {points.map((p, i) => (
          <div key={i} style={{ flex: 1, display: "flex", gap: 2, alignItems: "flex-end", height: "100%" }}>
            {keys.map((k, ki) => (
              <div
                key={k}
                title={`${p.label || p.name || i}: ${p[k] ?? p.value}`}
                style={{
                  flex: 1,
                  height: `${((Number(p[k] ?? p.value ?? 0) / max) * 100).toFixed(1)}%`,
                  background: theme.category[usageColorSequence[ki]] || theme.accent.primary,
                  borderRadius: 3,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}

export function LineChart({ data = [], height = 180, title, style }) {
  const theme = useHostTheme();
  const points = Array.isArray(data) ? data : [];
  const vals = points.map((p) => Number(p.value ?? p.y ?? 0));
  const max = Math.max(1, ...vals);
  const w = 320;
  const h = height;
  const d = vals
    .map((v, i) => {
      const x = vals.length <= 1 ? 0 : (i / (vals.length - 1)) * w;
      const y = h - (v / max) * h;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  return (
    <ChartFrame title={title} style={style}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <path d={d} fill="none" stroke={theme.accent.primary} strokeWidth="2" />
      </svg>
    </ChartFrame>
  );
}

export function PieChart({ data = [], height = 180, title, style }) {
  const theme = useHostTheme();
  const points = Array.isArray(data) ? data : [];
  const total = points.reduce((s, p) => s + Number(p.value || 0), 0) || 1;
  let acc = 0;
  const r = 70;
  const c = 90;
  const arcs = points.map((p, i) => {
    const frac = Number(p.value || 0) / total;
    const a0 = acc * Math.PI * 2 - Math.PI / 2;
    acc += frac;
    const a1 = acc * Math.PI * 2 - Math.PI / 2;
    const x0 = c + r * Math.cos(a0);
    const y0 = c + r * Math.sin(a0);
    const x1 = c + r * Math.cos(a1);
    const y1 = c + r * Math.sin(a1);
    const large = frac > 0.5 ? 1 : 0;
    return (
      <path
        key={i}
        d={`M${c},${c} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`}
        fill={theme.category[usageColorSequence[i % usageColorSequence.length]]}
      />
    );
  });
  return (
    <ChartFrame title={title} style={style}>
      <svg width={height} height={height} viewBox="0 0 180 180">
        {arcs}
      </svg>
    </ChartFrame>
  );
}

export function DiffView({ lines = [] }) {
  const theme = useHostTheme();
  return (
    <pre
      style={{
        margin: 0,
        fontSize: 12,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        overflow: "auto",
      }}
    >
      {lines.map((line, i) => {
        const t = line.type || (String(line).startsWith("+") ? "add" : String(line).startsWith("-") ? "del" : "ctx");
        const bg =
          t === "add" || t === "inserted"
            ? theme.diff.insertedLine
            : t === "del" || t === "removed"
              ? theme.diff.removedLine
              : "transparent";
        return (
          <div key={i} style={{ background: bg, padding: "0 8px" }}>
            {line.text || line.content || line}
          </div>
        );
      })}
    </pre>
  );
}

export function DiffStats({ additions = 0, deletions = 0 }) {
  return (
    <Row gap={8}>
      <Text size="small" style={{ color: "#34D399" }}>
        +{additions}
      </Text>
      <Text size="small" style={{ color: "#F87171" }}>
        −{deletions}
      </Text>
    </Row>
  );
}

export function computeDAGLayout() {
  return { nodes: [], edges: [] };
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
