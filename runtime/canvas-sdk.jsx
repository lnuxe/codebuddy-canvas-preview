import React, {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CANVAS_MONO_FONT,
  DIFF_GREEN,
  DIFF_RED,
  calloutToneColors,
  canvasRadius,
  canvasSpacing,
  canvasTypography,
  categoryPaletteDark,
  categoryPaletteLight,
  chartColorSequence,
  chartPalette,
  colorPalette,
  mergeStyle,
  statToneColors,
  usageColorSequence,
  canvasPaletteDark,
  canvasPaletteLight,
  canvasTokens,
  canvasTokensLight,
  applyPrimaryColor,
  applyWorkbenchSurfaces,
  buildHostTokens,
} from "./sdk/tokens.js";
import { BarChart, LineChart, PieChart } from "./sdk/charts.jsx";
import { normalizeLanguage, tokenizeLine } from "./sdk/highlight.js";
import { CanvasThemeRoot, useCanvasAction, useCanvasState, useHostTheme } from "./sdk/theme.jsx";

export {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
export {
  canvasPaletteDark,
  canvasPaletteLight,
  canvasTokens,
  canvasTokensLight,
  canvasTypography,
  canvasSpacing,
  canvasRadius,
  categoryPaletteDark,
  categoryPaletteLight,
  chartColorSequence,
  chartPalette,
  colorPalette,
  mergeStyle,
  usageColorSequence,
  applyPrimaryColor,
  applyWorkbenchSurfaces,
  buildHostTokens,
};
export { BarChart, LineChart, PieChart };
export { CanvasThemeRoot, useCanvasAction, useCanvasState, useHostTheme };

const typographyInlineContext = createContext(false);
const textWeightMap = { normal: 400, medium: 500, semibold: 590, bold: 650 };

export function Stack({ children, gap = 12, style }) {
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "column", gap: `${gap}px`, width: "100%", minWidth: 0 }, style)}>
      {children}
    </div>
  );
}

const justifyMap = { start: "flex-start", center: "center", end: "flex-end", "space-between": "space-between" };

export function Row({ children, gap = 8, align = "center", justify = "start", wrap = false, style }) {
  return (
    <div
      style={mergeStyle(
        {
          display: "flex",
          flexDirection: "row",
          flexWrap: wrap ? "wrap" : "nowrap",
          alignItems: align,
          justifyContent: justifyMap[justify] || justify,
          gap: `${gap}px`,
          width: "100%",
          minWidth: 0,
        },
        style
      )}
    >
      {children}
    </div>
  );
}

export function Grid({ children, columns, gap = 12, align = "stretch", style }) {
  const template = typeof columns === "number" ? `repeat(${columns}, minmax(0, 1fr))` : columns;
  return (
    <div
      style={mergeStyle(
        { display: "grid", gridTemplateColumns: template, gap: `${gap}px`, alignItems: align, width: "100%", minWidth: 0 },
        style
      )}
    >
      {children}
    </div>
  );
}

export function Divider({ style }) {
  const { tokens } = useHostTheme();
  return <hr style={mergeStyle({ width: "100%", border: "none", borderTop: `1px solid ${tokens.stroke.tertiary}`, margin: 0 }, style)} />;
}

export function Spacer() {
  return <div style={{ flex: 1, minWidth: 0 }} />;
}

const tableCellPadding = { padding: `${canvasSpacing[2]}px ${canvasSpacing[3]}px` };
const rowToneMarkerColors = {
  success: chartPalette.lightGreen,
  danger: chartPalette.darkAmber,
  warning: chartPalette.brightOrange,
  info: chartPalette.lightBlue,
  neutral: chartPalette.muted,
};
const rowToneMarkerSizePx = canvasSpacing[1.5];
const rowToneMarkerOffsetTopPx = (parseInt(canvasTypography.body.lineHeight, 10) - rowToneMarkerSizePx) / 2;

function RowToneMarker({ tone }) {
  return (
    <span
      aria-hidden
      style={{
        width: rowToneMarkerSizePx,
        height: rowToneMarkerSizePx,
        marginTop: rowToneMarkerOffsetTopPx,
        borderRadius: "50%",
        background: rowToneMarkerColors[tone],
        flexShrink: 0,
      }}
    />
  );
}

export function Table({
  headers = [],
  rows = [],
  columnAlign,
  rowTone,
  framed = true,
  striped = false,
  stickyHeader = false,
  style,
  emptyMessage = "No rows.",
}) {
  const { tokens } = useHostTheme();
  if (headers.length === 0) {
    return (
      <div style={{ padding: `${canvasSpacing[3]}px`, color: tokens.text.secondary, fontSize: canvasTypography.body.fontSize }}>
        Add at least one header.
      </div>
    );
  }
  const colCount = headers.length;
  const tableStyle = mergeStyle(
    {
      minWidth: "100%",
      borderCollapse: stickyHeader ? "separate" : "collapse",
      ...(stickyHeader ? { borderSpacing: 0 } : {}),
      tableLayout: "auto",
      fontSize: canvasTypography.body.fontSize,
      lineHeight: canvasTypography.body.lineHeight,
      color: tokens.text.primary,
    },
    style
  );
  const alignAt = (i) => columnAlign?.[i] ?? "left";
  const thStyle = (i) => ({
    ...tableCellPadding,
    textAlign: alignAt(i),
    fontWeight: 600,
    color: tokens.text.primary,
    borderBottom: `1px solid ${tokens.stroke.secondary}`,
    ...(stickyHeader
      ? {
          position: "sticky",
          top: 0,
          zIndex: 2,
          backgroundColor: tokens.bg.editor,
          backgroundImage: `linear-gradient(${tokens.fill.quaternary}, ${tokens.fill.quaternary})`,
        }
      : {}),
  });
  const tdStyle = (i) => ({ ...tableCellPadding, textAlign: alignAt(i), verticalAlign: "top" });
  const table = (
    <table style={tableStyle}>
      <thead style={stickyHeader ? undefined : { background: tokens.fill.quaternary }}>
        <tr>
          {headers.map((h, i) => (
            <th key={i} scope="col" style={thStyle(i)}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={colCount} style={mergeStyle(tdStyle(0), { color: tokens.text.secondary, borderBottom: `1px solid ${tokens.stroke.tertiary}` })}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row, ri) => {
            const tone = rowTone?.[ri];
            return (
              <tr
                key={ri}
                style={{
                  ...(ri < rows.length - 1 ? { borderBottom: `1px solid ${tokens.stroke.tertiary}` } : {}),
                  ...(striped && ri % 2 === 1 ? { background: tokens.fill.quaternary } : {}),
                }}
              >
                {Array.from({ length: colCount }, (_, ci) => {
                  const cell = row[ci] ?? null;
                  return (
                    <td key={ci} style={tdStyle(ci)}>
                      {tone && ci === 0 ? (
                        <span style={{ display: "inline-flex", alignItems: "flex-start", gap: `${canvasSpacing[1.5]}px`, minWidth: 0, maxWidth: "100%" }}>
                          <RowToneMarker tone={tone} />
                          <span style={{ minWidth: 0, flex: 1 }}>{cell}</span>
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
  if (!framed) return table;
  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        ...(stickyHeader ? { height: "100%", maxHeight: "100%", minHeight: 0 } : {}),
        border: `1px solid ${tokens.stroke.tertiary}`,
        borderRadius: `${canvasRadius.lg}px`,
        background: tokens.bg.editor,
        overflowX: "auto",
        overflowY: stickyHeader ? "auto" : "clip",
      }}
    >
      {table}
    </div>
  );
}

export function Text({ children, tone = "primary", size = "body", as, weight = "normal", italic = false, truncate = false, style }) {
  const { tokens } = useHostTheme();
  const nested = useContext(typographyInlineContext);
  const Tag = as ?? (nested ? "span" : "p");
  const colors = {
    primary: tokens.text.primary,
    secondary: tokens.text.secondary,
    tertiary: tokens.text.tertiary,
    quaternary: tokens.text.quaternary,
  };
  const type = size === "small" ? canvasTypography.small : canvasTypography.body;
  const trunc = truncate === true ? "end" : truncate === false ? null : truncate;
  const truncStyle =
    trunc != null
      ? {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          ...(Tag === "span" ? { display: "inline-block", maxWidth: "100%" } : {}),
          ...(trunc === "start" ? { direction: "rtl", textAlign: "left" } : {}),
        }
      : undefined;
  const parsed = renderInlineMarkdown(children);
  const body = trunc === "start" ? <bdi>{parsed}</bdi> : parsed;
  const css = mergeStyle(
    {
      margin: 0,
      color: colors[tone],
      fontSize: type.fontSize,
      lineHeight: type.lineHeight,
      fontWeight: textWeightMap[weight],
      fontStyle: italic ? "italic" : undefined,
      ...truncStyle,
    },
    style
  );
  return (
    <typographyInlineContext.Provider value={true}>
      {Tag === "span" ? <span style={css}>{body}</span> : <p style={css}>{body}</p>}
    </typographyInlineContext.Provider>
  );
}

function Heading({ tag: Tag, preset, children, style }) {
  const { tokens } = useHostTheme();
  return (
    <typographyInlineContext.Provider value={true}>
      <Tag
        style={mergeStyle(
          {
            margin: 0,
            color: tokens.text.primary,
            fontSize: preset.fontSize,
            lineHeight: preset.lineHeight,
            fontWeight: preset.fontWeight,
          },
          style
        )}
      >
        {children}
      </Tag>
    </typographyInlineContext.Provider>
  );
}

export function H1({ children, style }) {
  return <Heading tag="h1" preset={canvasTypography.h1} style={style}>{children}</Heading>;
}
export function H2({ children, style }) {
  return <Heading tag="h2" preset={canvasTypography.h2} style={style}>{children}</Heading>;
}
export function H3({ children, style }) {
  return <Heading tag="h3" preset={canvasTypography.h3} style={style}>{children}</Heading>;
}

export function Code({ children, style }) {
  const { tokens } = useHostTheme();
  return (
    <code
      style={mergeStyle(
        {
          fontFamily: CANVAS_MONO_FONT,
          fontSize: "0.92em",
          padding: "2px 5px",
          borderRadius: `${canvasRadius.sm}px`,
          background: tokens.fill.quaternary,
          color: tokens.text.primary,
        },
        style
      )}
    >
      {children}
    </code>
  );
}

export function Link({ children, href, style }) {
  const { tokens } = useHostTheme();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={mergeStyle(
        { color: tokens.text.link, textDecoration: "underline", textUnderlineOffset: "2px", textDecorationColor: `${tokens.text.link}80` },
        style
      )}
    >
      {children}
    </a>
  );
}

function renderInlineMarkdown(node, keyPrefix = "md") {
  if (node == null || typeof node === "boolean") return node;
  if (Array.isArray(node)) {
    return node.map((child, i) => <React.Fragment key={`${keyPrefix}-${i}`}>{renderInlineMarkdown(child, `${keyPrefix}-${i}`)}</React.Fragment>);
  }
  if (typeof node !== "string") return node;
  const re = /(`[^`]+`)|(\[[^\]]+\]\([^)\s]+(?:\s+"[^"]*")?\))/g;
  const out = [];
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(node))) {
    if (m.index > last) out.push(node.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("`")) {
      out.push(<Code key={`${keyPrefix}-c-${i}`}>{token.slice(1, -1)}</Code>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
      if (link) out.push(<Link key={`${keyPrefix}-l-${i}`} href={link[2]}>{link[1]}</Link>);
      else out.push(token);
    }
    i += 1;
    last = m.index + token.length;
  }
  if (last < node.length) out.push(node.slice(last));
  return out.length === 1 ? out[0] : out;
}

export function CanvasChevron({ expanded }) {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      style={{ display: "block", flexShrink: 0, color: "inherit", transform: expanded ? undefined : "rotate(-90deg)" }}
    >
      <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const defaultCardChrome = { size: "base", stickyHeader: false, collapsible: false, isOpen: true, toggle: () => {} };
const CardChromeContext = createContext(defaultCardChrome);

export function Card({
  children,
  variant = "default",
  size = "base",
  stickyHeader = false,
  collapsible = false,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  style,
}) {
  const { tokens } = useHostTheme();
  const controlled = openProp !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isOpen = !collapsible || (controlled ? openProp : uncontrolled);
  const toggle = useCallback(() => {
    if (!collapsible) return;
    const next = !isOpen;
    if (!controlled) setUncontrolled(next);
    onOpenChange?.(next);
  }, [collapsible, isOpen, controlled, onOpenChange]);
  const chrome = {
    boxSizing: "border-box",
    background: tokens.bg.editor,
    overflow: "clip",
    ...(variant === "default"
      ? { border: `1px solid ${tokens.stroke.tertiary}`, borderRadius: `${canvasRadius.lg}px` }
      : { border: "none", borderRadius: 0 }),
  };
  return (
    <CardChromeContext.Provider value={{ size, stickyHeader, collapsible, isOpen, toggle }}>
      <div style={mergeStyle(chrome, style)}>
        <div style={{ boxSizing: "border-box", position: "relative" }}>{children}</div>
      </div>
    </CardChromeContext.Provider>
  );
}

function compactTrailingPills(node) {
  return React.isValidElement(node) && node.type === Pill && node.props.size !== "sm"
    ? React.cloneElement(node, { size: "sm" })
    : node;
}

export function CardHeader({ children, title, trailing, style }) {
  const { tokens } = useHostTheme();
  const { size, stickyHeader, collapsible, isOpen, toggle } = useContext(CardChromeContext);
  const label = children ?? title;
  const height = size === "lg" ? 32 : 28;
  const padX = size === "lg" ? canvasSpacing[2.5] : canvasSpacing[2];
  const gap = size === "lg" ? canvasSpacing[2] : canvasSpacing[1.5];
  const row = {
    boxSizing: "border-box",
    ...(stickyHeader ? { position: "sticky", top: 0, zIndex: 5, background: tokens.bg.editor } : { position: "relative" }),
    display: "flex",
    alignItems: "center",
    height: `${height}px`,
    fontSize: "12px",
    color: tokens.text.primary,
    borderBottom: collapsible && !isOpen ? "none" : `1px solid ${tokens.stroke.tertiary}`,
  };
  const lead = {
    boxSizing: "border-box",
    flex: 1,
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    height: "100%",
    padding: `0 ${padX}px`,
    gap: `${gap}px`,
    overflow: "hidden",
  };
  const trailStyle = {
    display: "flex",
    alignItems: "center",
    gap: `${canvasSpacing[1.5]}px`,
    paddingRight: `${padX}px`,
    flexShrink: 0,
    fontSize: "11px",
    color: tokens.text.secondary,
  };
  const trail = trailing != null ? compactTrailingPills(trailing) : null;
  if (collapsible) {
    return (
      <button type="button" onClick={toggle} aria-expanded={isOpen} style={mergeStyle({ all: "unset", ...row, cursor: "pointer", width: "100%", font: "inherit", color: "inherit" }, style)}>
        <div style={lead}>
          <CanvasChevron expanded={isOpen} />
          {label}
        </div>
        {trail ? <div style={trailStyle}>{trail}</div> : null}
      </button>
    );
  }
  return (
    <div style={mergeStyle(row, style)}>
      <div style={lead}>{label}</div>
      {trail ? <div style={trailStyle}>{trail}</div> : null}
    </div>
  );
}

export function CardBody({ children, style }) {
  const { tokens } = useHostTheme();
  const { collapsible, isOpen } = useContext(CardChromeContext);
  if (collapsible && !isOpen) return null;
  return (
    <div
      style={mergeStyle(
        {
          boxSizing: "border-box",
          padding: `${canvasSpacing[3]}px`,
          fontSize: canvasTypography.small.fontSize,
          lineHeight: canvasTypography.small.lineHeight,
          color: tokens.text.secondary,
        },
        style
      )}
    >
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", disabled = false, type = "button", style, onClick }) {
  const { tokens } = useHostTheme();
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: `${canvasSpacing[0.5]}px`,
    height: "24px",
    padding: `0 ${canvasSpacing[1.5]}px`,
    borderRadius: `${canvasRadius.md}px`,
    fontSize: canvasTypography.body.fontSize,
    lineHeight: canvasTypography.body.lineHeight,
    fontWeight: 500,
    fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent",
    opacity: disabled ? 0.5 : 1,
    width: "auto",
    whiteSpace: "nowrap",
    userSelect: "none",
    boxSizing: "border-box",
  };
  const variants = {
    primary: { background: tokens.accent.control, color: tokens.text.onAccent, borderColor: tokens.accent.control },
    secondary: { background: tokens.fill.secondary, color: tokens.text.primary, borderColor: tokens.stroke.primary },
    ghost: { background: "transparent", color: tokens.text.secondary, borderColor: "transparent" },
  };
  const motion = variant === "primary" || variant === "ghost" ? { transition: "background 120ms ease" } : {};
  return (
    <button type={type} disabled={disabled} onClick={disabled ? undefined : onClick} style={mergeStyle(mergeStyle(mergeStyle(base, variants[variant] || variants.primary), motion), style)}>
      {children}
    </button>
  );
}

export function Pill({
  children,
  active = false,
  size = "md",
  leadingContent,
  keyboardHint,
  disabled = false,
  title,
  style,
  onClick,
}) {
  const { tokens } = useHostTheme();
  const clickable = !!onClick;
  const sm = size === "sm";
  const css = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    borderRadius: `${canvasRadius.full}px`,
    whiteSpace: "nowrap",
    userSelect: "none",
    fontFamily: "inherit",
    fontWeight: active ? 500 : 400,
    fontSize: sm ? "10px" : "12px",
    lineHeight: sm ? "12px" : "14px",
    background: sm ? tokens.fill.quaternary : active ? tokens.fill.secondary : "transparent",
    color: active ? tokens.text.primary : tokens.text.secondary,
    border: sm ? "none" : `1px solid ${active ? "transparent" : tokens.stroke.secondary}`,
    padding: sm ? `${canvasSpacing[0.5]}px ${canvasSpacing[1.5]}px` : `${canvasSpacing[1.5]}px ${canvasSpacing[2.5]}px`,
    gap: sm ? `${canvasSpacing[1]}px` : `${canvasSpacing[1.5]}px`,
    cursor: clickable ? (disabled ? "not-allowed" : "pointer") : "default",
    opacity: disabled ? 0.3 : 1,
    transition: clickable ? "color 120ms ease, background 120ms ease" : undefined,
  };
  const inner = (
    <>
      {leadingContent ? <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "inherit" }}>{leadingContent}</span> : null}
      <span style={{ flexShrink: 0, color: "inherit" }}>{children}</span>
      {keyboardHint ? <span style={{ flexShrink: 0, color: tokens.text.primary, opacity: 0.3 }}>{keyboardHint}</span> : null}
    </>
  );
  if (clickable) {
    return (
      <button type="button" disabled={disabled} title={title} onClick={disabled ? undefined : onClick} style={mergeStyle({ ...css, margin: 0 }, style)}>
        {inner}
      </button>
    );
  }
  return (
    <span title={title} style={mergeStyle(css, style)}>
      {inner}
    </span>
  );
}

export const Badge = Pill;
export const Tag = Pill;
export const Chip = Pill;

export function Stat({ value, label, tone, style }) {
  const { tokens } = useHostTheme();
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "column", alignItems: "center", gap: `${canvasSpacing[0.5]}px`, padding: `${canvasSpacing[3]}px ${canvasSpacing[2]}px` }, style)}>
      <div style={{ fontSize: "24px", lineHeight: "28px", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: tone ? statToneColors[tone] : tokens.text.primary }}>
        {value}
      </div>
      <div style={{ fontSize: canvasTypography.small.fontSize, lineHeight: canvasTypography.small.lineHeight, color: tokens.text.secondary }}>{label}</div>
    </div>
  );
}

function CalloutToneIcon({ tone, color }) {
  const CALLOUT_ICON_VIEWBOX = 300;
  const style = { display: "block", flexShrink: 0, color };
  if (tone === "neutral") {
    return (
      <svg width={12} height={12} viewBox={`0 0 ${CALLOUT_ICON_VIEWBOX} ${CALLOUT_ICON_VIEWBOX}`} aria-hidden style={style}>
        <circle cx={150} cy={150} r={132} fill="currentColor" />
      </svg>
    );
  }
  const glyph =
    tone === "success"
      ? "circles-check"
      : tone === "warning"
        ? "warning"
        : tone === "danger"
          ? "exclamation-circle"
          : "info";
  const paths = {
    info: "M150 30a120 120 0 1 1 0 240a120 120 0 0 1 0-240zm0 84a12 12 0 0 0-12 12v47a12 12 0 0 0 24 0v-47a12 12 0 0 0-12-12zm0 94a13 13 0 1 0 0-26a13 13 0 0 0 0 26z",
    warning:
      "M150 36c12 0 23 7 28 18l104 182c5 9 4 20-2 28s-16 13-26 13H46c-10 0-20-5-26-13s-7-19-2-28L122 54c5-11 16-18 28-18zm0 64a13 13 0 0 0-13 13v47a13 13 0 0 0 26 0v-47a13 13 0 0 0-13-13zm0 96a13 13 0 1 0 0-26a13 13 0 0 0 0 26z",
    "circles-check":
      "M117 30a87 87 0 1 1 0 174a87 87 0 0 1 0-174zm29 78l-40 40-22-22-18 18 40 40 58-58zM210 128c4-2 9-1 12 3c16 27 12 61-10 84s-57 32-86 20c-5-2-8 0-10 4s0 9 4 11c33 19 75 12 103-16s35-70 16-103c-2-5-8-7-12-4s-7 8-5 12z",
    "exclamation-circle":
      "M150 30a120 120 0 1 1 0 240a120 120 0 0 1 0-240zm0 64a12 12 0 0 0-12 12v66a12 12 0 0 0 24 0V106a12 12 0 0 0-12-12zm0 121a13 13 0 1 0 0-26a13 13 0 0 0 0 26z",
  };
  return (
    <svg width={12} height={12} viewBox={`0 0 ${CALLOUT_ICON_VIEWBOX} ${CALLOUT_ICON_VIEWBOX}`} aria-hidden style={style}>
      <path fill="currentColor" fillRule="evenodd" d={paths[glyph]} />
    </svg>
  );
}

export function Callout({ children, tone = "info", title, icon, style }) {
  const { tokens } = useHostTheme();
  const color = calloutToneColors[tone] || calloutToneColors.info;
  const lh = canvasTypography.body.lineHeight;
  const iconBox = canvasSpacing[3];
  return (
    <div
      role="note"
      style={mergeStyle(
        {
          boxSizing: "border-box",
          display: "flex",
          alignItems: "flex-start",
          gap: `${canvasSpacing[2.5]}px`,
          width: "100%",
          color: tokens.text.primary,
          fontSize: canvasTypography.body.fontSize,
          fontWeight: canvasTypography.body.fontWeight,
          lineHeight: lh,
        },
        style
      )}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, height: lh, color, ...(icon != null ? { minWidth: iconBox } : { width: iconBox }) }} aria-hidden={icon == null}>
        {icon != null ? icon : <CalloutToneIcon tone={tone} color={color} />}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: `${canvasSpacing[1]}px` }}>
        {title != null ? <div style={{ color: tokens.text.primary, fontWeight: 500, fontSize: canvasTypography.body.fontSize, lineHeight: lh }}>{title}</div> : null}
        {children != null ? <div style={{ color: tokens.text.primary, fontSize: canvasTypography.body.fontSize, fontWeight: canvasTypography.body.fontWeight, lineHeight: lh }}>{children}</div> : null}
      </div>
    </div>
  );
}

export function CollapsibleSection({ title, leading, count, trailing, children, defaultOpen = false, style }) {
  const { tokens } = useHostTheme();
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div style={mergeStyle({ boxSizing: "border-box", display: "flex", flexDirection: "column", minWidth: 0, width: "100%" }, style)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        style={{
          boxSizing: "border-box",
          appearance: "none",
          border: "none",
          background: "transparent",
          margin: 0,
          padding: `${canvasSpacing[2]}px 0`,
          width: "100%",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: `${canvasSpacing[2]}px`,
          cursor: "pointer",
          textAlign: "left",
          color: tokens.text.primary,
          font: "inherit",
        }}
      >
        <span style={{ color: tokens.text.quaternary, display: "inline-flex", flexShrink: 0 }}>
          <CanvasChevron expanded={open} />
        </span>
        {leading != null ? <span style={{ flexShrink: 0 }}>{leading}</span> : null}
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: tokens.text.primary, fontSize: canvasTypography.body.fontSize, lineHeight: canvasTypography.body.lineHeight }}>
          {title}
        </span>
        {count != null ? <span style={{ flexShrink: 0, color: tokens.text.secondary, fontVariantNumeric: "tabular-nums" }}>{count}</span> : null}
        {trailing != null ? <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", color: tokens.text.tertiary }}>{trailing}</span> : null}
      </button>
      {open ? (
        <div id={id} style={{ paddingLeft: `${canvasSpacing[5]}px`, paddingBottom: `${canvasSpacing[2]}px`, minWidth: 0 }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function Swatch({ color, style }) {
  const { category } = useHostTheme();
  return (
    <span
      aria-hidden
      style={mergeStyle(
        {
          boxSizing: "border-box",
          flexShrink: 0,
          display: "inline-block",
          width: 24,
          height: 24,
          borderRadius: `${canvasRadius.sm}px`,
          background: category[color] || color,
        },
        style
      )}
    />
  );
}

function safeValue(v) {
  return Number.isFinite(v) && v > 0 ? v : 0;
}

export function UsageBar({ segments = [], total, topLeftLabel, topRightLabel, style }) {
  const { tokens } = useHostTheme();
  const cap = safeValue(total ?? segments.reduce((s, x) => s + safeValue(x.value), 0));
  const used = segments.reduce((s, x) => s + safeValue(x.value), 0);
  const rest = Math.max(0, cap - used);
  const hasLabels = topLeftLabel != null || topRightLabel != null;
  const pill = { height: 5, flexBasis: 0, flexShrink: 0, minWidth: canvasSpacing[1], borderRadius: 1 };
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "column", gap: `${canvasSpacing[2]}px`, width: "100%", minWidth: 0 }, style)}>
      {hasLabels ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: `${canvasSpacing[3]}px`,
            minWidth: 0,
            fontSize: canvasTypography.small.fontSize,
            lineHeight: canvasTypography.small.lineHeight,
            color: tokens.text.secondary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ minWidth: 0 }}>{topLeftLabel}</span>
          <span style={{ minWidth: 0, textAlign: "right" }}>{topRightLabel}</span>
        </div>
      ) : null}
      <div role="img" aria-label={`Usage bar: ${used} of ${cap} used`} style={{ width: "100%", minWidth: 0, overflow: "hidden", borderRadius: 1 }}>
        <div style={{ display: "flex", minWidth: 0, gap: 1 }}>
          {segments.map((seg, i) => {
            const hue = seg.color ?? usageColorSequence[i % usageColorSequence.length];
            return <span key={seg.id ?? i} aria-hidden style={{ ...pill, flexGrow: safeValue(seg.value), background: tokens.category[hue] }} />;
          })}
          <span aria-hidden style={{ ...pill, flexGrow: rest, background: tokens.fill.tertiary }} />
        </div>
      </div>
    </div>
  );
}

function asTodoStatus(s) {
  if (s === "in_progress" || s === "completed" || s === "cancelled" || s === "pending") return s;
  if (s === "done") return "completed";
  return "pending";
}

function indicatorColor(status, tokens) {
  if (status === "completed") return tokens.category.green;
  if (status === "in_progress") return tokens.accent.primary;
  if (status === "cancelled") return tokens.text.quaternary;
  return tokens.text.tertiary;
}

function TodoStatusGlyph({ status, color }) {
  const style = { display: "block", flexShrink: 0, color };
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (status === "in_progress") {
    return (
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" role="img" aria-label="In progress" style={style}>
        <circle cx={12} cy={12} r={10} {...stroke} />
        <path d="M8 12h8" {...stroke} />
        <path d="m12 16 4-4-4-4" {...stroke} />
      </svg>
    );
  }
  if (status === "completed") {
    return (
      <svg width={14} height={14} viewBox="0 0 14 14" fill="none" role="img" aria-label="Completed" style={style}>
        <circle cx={7} cy={7} r={5.25} stroke="currentColor" strokeWidth={1.2} />
        <path d="M4.5 7 6.5 9 9.5 5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "cancelled") {
    return (
      <svg width={14} height={14} viewBox="0 0 14 14" fill="none" role="img" aria-label="Cancelled" style={style}>
        <circle cx={7} cy={7} r={5.25} stroke="currentColor" strokeWidth={1.2} />
        <path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" role="img" aria-label="Pending" style={style}>
      <circle cx={12} cy={12} r={8} stroke="currentColor" strokeWidth={1.6} strokeDasharray="3.2 3.2" />
    </svg>
  );
}

function CanvasTodoListItem({ todo, isDimmed, onTodoClick }) {
  const { tokens } = useHostTheme();
  const status = asTodoStatus(todo.status);
  const done = status === "completed" || status === "cancelled";
  const color =
    done ? tokens.text.quaternary : status === "in_progress" ? (isDimmed ? tokens.text.secondary : tokens.text.primary) : tokens.text.secondary;
  return (
    <li style={{ position: "relative", display: "flex", alignItems: "flex-start", padding: 0, margin: 0 }}>
      <button
        type="button"
        onClick={() => onTodoClick?.(todo)}
        style={{
          all: "unset",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "flex-start",
          gap: `${canvasSpacing[2]}px`,
          flex: 1,
          width: "100%",
          minWidth: 0,
          cursor: "pointer",
          font: "inherit",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: 14, minHeight: 18 }}>
          <TodoStatusGlyph status={status} color={indicatorColor(status, tokens)} />
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: "18px", color, textDecoration: done ? "line-through" : undefined }}>
          {todo.content ?? todo.label ?? todo.title ?? todo.text}
        </span>
      </button>
    </li>
  );
}

export function TodoList({ todos, items, dimmedTodoIds, onTodoClick, style }) {
  const list = todos ?? items ?? [];
  if (list.length === 0) return null;
  return (
    <ul style={mergeStyle({ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: `${canvasSpacing[2.5]}px`, width: "100%" }, style)}>
      {list.map((todo, i) => (
        <CanvasTodoListItem key={todo.id ?? i} todo={{ id: String(todo.id ?? i), ...todo }} isDimmed={dimmedTodoIds?.has(todo.id)} onTodoClick={onTodoClick} />
      ))}
    </ul>
  );
}

export function TodoListCard({ todos, items, dimmedTodoIds, defaultExpanded = true, onTodoClick, style }) {
  const { tokens } = useHostTheme();
  const list = todos ?? items ?? [];
  const [open, setOpen] = useState(defaultExpanded);
  const done = useMemo(() => list.filter((t) => {
    const s = asTodoStatus(t.status);
    return s === "completed" || s === "cancelled";
  }).length, [list]);
  if (list.length === 0) return null;
  return (
    <div
      style={mergeStyle(
        {
          background: tokens.fill.quaternary,
          border: `1px solid ${tokens.stroke.tertiary}`,
          boxSizing: "border-box",
          borderRadius: `${canvasRadius.lg}px`,
          overflow: "hidden",
          width: "100%",
        },
        style
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          all: "unset",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: `${canvasSpacing[2]}px`,
          overflow: "hidden",
          width: "100%",
          height: `${canvasSpacing[7]}px`,
          padding: `0 ${canvasSpacing[3]}px`,
          cursor: "pointer",
          font: "inherit",
          color: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: `${canvasSpacing[1.5]}px`, color: tokens.text.secondary, fontSize: 13, lineHeight: "18px" }}>
          <CanvasChevron expanded={open} />
          {done > 0 ? (
            <span>
              {done} of {list.length} Done
            </span>
          ) : (
            <>
              To-dos <span style={{ color: tokens.text.tertiary }}>{list.length}</span>
            </>
          )}
        </div>
      </button>
      {open ? (
        <div style={{ padding: `${canvasSpacing[2]}px ${canvasSpacing[4]}px` }}>
          <TodoList todos={list} dimmedTodoIds={dimmedTodoIds} onTodoClick={onTodoClick} />
        </div>
      ) : null}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, disabled = false, type = "text", style }) {
  const { tokens } = useHostTheme();
  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      disabled={disabled}
      style={mergeStyle(
        {
          boxSizing: "border-box",
          width: "100%",
          height: "28px",
          padding: `${canvasSpacing[1]}px ${canvasSpacing[2]}px`,
          border: `1px solid ${tokens.stroke.secondary}`,
          borderRadius: `${canvasRadius.md}px`,
          background: tokens.fill.tertiary,
          color: tokens.text.primary,
          fontSize: "13px",
          lineHeight: "18px",
          letterSpacing: "0.13px",
          fontFamily: "inherit",
          outline: "none",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "text",
        },
        style
      )}
    />
  );
}

export function TextArea({ value, onChange, placeholder, disabled = false, rows = 3, style }) {
  const { tokens } = useHostTheme();
  const ref = useRef(null);
  const grow = useCallback(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);
  useLayoutEffect(() => {
    grow();
  }, [grow, value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      onInput={grow}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      style={mergeStyle(
        {
          boxSizing: "border-box",
          width: "100%",
          minHeight: "28px",
          padding: `${canvasSpacing[1]}px ${canvasSpacing[2]}px`,
          border: `1px solid ${tokens.stroke.secondary}`,
          borderRadius: `${canvasRadius.md}px`,
          background: tokens.fill.tertiary,
          color: tokens.text.primary,
          fontSize: "13px",
          lineHeight: "18px",
          letterSpacing: "0.13px",
          fontFamily: "inherit",
          outline: "none",
          resize: "none",
          overflow: "hidden",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "text",
        },
        style
      )}
    />
  );
}

export function Checkbox({ checked = false, onChange, disabled = false, label, style }) {
  const { tokens } = useHostTheme();
  const box = {
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 14,
    height: 14,
    borderRadius: `${canvasRadius.sm}px`,
    border: `1px solid ${checked ? tokens.accent.control : tokens.stroke.primary}`,
    background: checked ? tokens.accent.control : tokens.fill.tertiary,
    flexShrink: 0,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
  return (
    <label
      style={mergeStyle(
        {
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: `${canvasSpacing[2]}px`,
          cursor: disabled ? "not-allowed" : "pointer",
          userSelect: "none",
          fontSize: "13px",
          lineHeight: "18px",
          color: tokens.text.primary,
        },
        style
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        style={{ position: "absolute", width: 1, height: 1, margin: 0, opacity: 0, pointerEvents: "none" }}
      />
      <span style={box}>
        {checked ? (
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none" aria-hidden style={{ display: "block" }}>
            <path d="M2 5.2 4.2 7.5 8 3" stroke={tokens.text.onAccent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      {label != null ? <span>{label}</span> : null}
    </label>
  );
}

const toggleSizes = { sm: { track: 16, width: 26, knobOffset: 2 }, md: { track: 20, width: 32, knobOffset: 3 } };

export function Toggle({ checked = false, onChange, disabled = false, size = "sm", style }) {
  const { tokens } = useHostTheme();
  const spec = toggleSizes[size] || toggleSizes.sm;
  const knob = spec.track - 2 * spec.knobOffset;
  const travel = spec.width - spec.track;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={disabled ? undefined : () => onChange?.(!checked)}
      style={mergeStyle(
        {
          boxSizing: "border-box",
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          width: spec.width,
          height: spec.track,
          borderRadius: canvasRadius.full,
          background: checked ? tokens.accent.control : tokens.fill.secondary,
          border: "none",
          padding: 0,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "background 150ms ease",
          flexShrink: 0,
        },
        style
      )}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          width: knob,
          height: knob,
          borderRadius: canvasRadius.full,
          background: "white",
          left: spec.knobOffset,
          transform: checked ? `translateX(${travel}px)` : "translateX(0)",
          transition: "transform 150ms ease",
        }}
      />
    </button>
  );
}

export function Select({ value, onChange, options = [], placeholder, disabled = false, style }) {
  const { tokens, kind } = useHostTheme();
  const hasValue = value !== undefined && value !== "";
  return (
    <span style={mergeStyle({ position: "relative", display: "inline-flex", alignItems: "center" }, style)}>
      <select
        value={value ?? ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        style={{
          boxSizing: "border-box",
          appearance: "none",
          WebkitAppearance: "none",
          background: "transparent",
          colorScheme: kind === "light" || kind === "hc-light" ? "light" : "dark",
          border: `1px solid ${tokens.stroke.tertiary}`,
          borderRadius: `${canvasRadius.md}px`,
          color: hasValue ? tokens.text.primary : tokens.text.tertiary,
          fontSize: "13px",
          lineHeight: "18px",
          fontFamily: "inherit",
          padding: `4px ${canvasSpacing[5]}px 4px 4px`,
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          minWidth: 0,
        }}
      >
        {placeholder != null ? (
          <option value="" disabled style={{ background: tokens.bg.elevated, color: tokens.text.tertiary }}>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => {
          const v = typeof opt === "string" ? opt : opt.value;
          const l = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={v} value={v} disabled={opt.disabled} style={{ background: tokens.bg.elevated, color: tokens.text.primary }}>
              {l}
            </option>
          );
        })}
      </select>
      <span style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: tokens.text.secondary, display: "flex" }} aria-hidden>
        <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </span>
  );
}

export function IconButton({ children, onClick, disabled = false, title, variant = "default", size = "md", style }) {
  const { tokens } = useHostTheme();
  const dim = size === "sm" ? 16 : 20;
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={mergeStyle(
        {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: dim,
          height: dim,
          padding: 0,
          border: "none",
          borderRadius: variant === "circle" ? canvasRadius.full : canvasRadius.sm,
          background: variant === "circle" ? tokens.fill.quaternary : "transparent",
          color: tokens.text.secondary,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          flexShrink: 0,
          fontFamily: "inherit",
          fontSize: size === "sm" ? 11 : 12,
          lineHeight: 1,
        },
        style
      )}
    >
      {children}
    </button>
  );
}

export function DiffStats({ additions = 0, deletions = 0, style }) {
  if (additions <= 0 && deletions <= 0) return null;
  return (
    <span
      style={mergeStyle(
        {
          display: "inline-flex",
          alignItems: "center",
          gap: `${canvasSpacing[0.5]}px`,
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
          fontSize: canvasTypography.small.fontSize,
          lineHeight: canvasTypography.small.lineHeight,
        },
        style
      )}
    >
      {additions > 0 ? <span style={{ color: DIFF_GREEN }}>+{additions}</span> : null}
      {deletions > 0 ? <span style={{ color: DIFF_RED }}>-{deletions}</span> : null}
    </span>
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
  const { tokens, kind } = theme;
  const lang = normalizeLanguage(language, filePath);
  return (
    <div
      style={mergeStyle(
        {
          boxSizing: "border-box",
          fontFamily: CANVAS_MONO_FONT,
          fontSize: "12px",
          lineHeight: "20px",
          background: tokens.bg.editor,
          overflow: "auto",
          tabSize: 4,
        },
        style
      )}
    >
      <div style={{ minWidth: "100%", width: "max-content", paddingBlock: 2 }}>
        {lines.map((line, i) => {
          const raw = typeof line === "string" ? line : line.content ?? "";
          const t =
            (typeof line === "object" && line.type) ||
            (String(raw).startsWith("+") ? "added" : String(raw).startsWith("-") ? "removed" : "unchanged");
          const added = t === "added" || t === "add" || t === "inserted";
          const removed = t === "removed" || t === "del" || t === "deleted";
          const kindLine = added ? "added" : removed ? "removed" : "unchanged";
          const bg = kindLine === "added" ? tokens.diff.insertedLine : kindLine === "removed" ? tokens.diff.removedLine : "transparent";
          const strip = kindLine === "added" ? tokens.diff.stripAdded : kindLine === "removed" ? tokens.diff.stripRemoved : "transparent";
          const numColor = coloredLineNumbers ? (kindLine === "added" ? DIFF_GREEN : kindLine === "removed" ? DIFF_RED : tokens.text.tertiary) : tokens.text.tertiary;
          const content = typeof line === "object" ? raw : raw.replace(/^[-+ ]/, "");
          const lineNumber = typeof line === "object" ? line.lineNumber : undefined;
          const tokensInLine = lang && content ? tokenizeLine(content, lang, kind) : [{ content, color: tokens.text.primary, col: 0 }];
          return (
            <div key={i} style={{ display: "flex", minWidth: "100%", minHeight: 20, background: bg }}>
              {showAccentStrip ? <div style={{ width: 3, flexShrink: 0, background: strip }} /> : null}
              {showLineNumbers ? (
                <div style={{ display: "flex", flexShrink: 0, userSelect: "none", paddingRight: 4 }}>
                  <span style={{ boxSizing: "content-box", minWidth: "4ch", textAlign: "right", paddingLeft: 4, paddingRight: 4, color: numColor, fontVariantNumeric: "tabular-nums", fontSize: 11 }}>
                    {lineNumber != null ? lineNumber : ""}
                  </span>
                </div>
              ) : null}
              <div style={{ flex: 1, paddingLeft: 8, whiteSpace: "pre", overflow: "visible", color: tokens.text.primary }}>
                {tokensInLine.map((tok) => (
                  <span key={tok.col} style={{ color: tok.color }}>
                    {tok.content}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const DEFAULT_NODE_W = 160;
const DEFAULT_NODE_H = 40;
const DEFAULT_RANK_GAP = 64;
const DEFAULT_NODE_GAP = 48;
const DEFAULT_PAD = 24;

function findBackEdges(ids, edges, known) {
  const out = new Map(ids.map((id) => [id, []]));
  edges.forEach((e, i) => {
    if (known.has(e.from) && known.has(e.to)) out.get(e.from).push({ to: e.to, i });
  });
  const visiting = new Set();
  const visited = new Set();
  const back = new Set();
  function dfs(id) {
    visiting.add(id);
    for (const { to, i } of out.get(id) || []) {
      if (visiting.has(to)) back.add(i);
      else if (!visited.has(to)) dfs(to);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of ids) if (!visited.has(id)) dfs(id);
  return back;
}

function computeAnchors(from, to, nodeWidth, nodeHeight, horizontal, isBack) {
  if (horizontal) {
    return isBack
      ? { sourceX: from.x, sourceY: from.y + nodeHeight / 2, targetX: to.x + nodeWidth, targetY: to.y + nodeHeight / 2 }
      : { sourceX: from.x + nodeWidth, sourceY: from.y + nodeHeight / 2, targetX: to.x, targetY: to.y + nodeHeight / 2 };
  }
  return isBack
    ? { sourceX: from.x + nodeWidth / 2, sourceY: from.y, targetX: to.x + nodeWidth / 2, targetY: to.y + nodeHeight }
    : { sourceX: from.x + nodeWidth / 2, sourceY: from.y + nodeHeight, targetX: to.x + nodeWidth / 2, targetY: to.y };
}

export function computeDAGLayout({
  nodes = [],
  edges = [],
  direction = "vertical",
  nodeWidth = DEFAULT_NODE_W,
  nodeHeight = DEFAULT_NODE_H,
  rankGap = DEFAULT_RANK_GAP,
  nodeGap = DEFAULT_NODE_GAP,
  padding = DEFAULT_PAD,
} = {}) {
  const horizontal = direction === "horizontal";
  const ids = nodes.map((n) => n.id);
  const known = new Set(ids);
  const back = findBackEdges(ids, edges, known);
  const children = new Map(ids.map((id) => [id, []]));
  const indeg = new Map(ids.map((id) => [id, 0]));
  edges.forEach((e, i) => {
    if (back.has(i) || !known.has(e.from) || !known.has(e.to)) return;
    children.get(e.from).push(e.to);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  });
  const rank = new Map();
  const queue = [];
  for (const id of ids) {
    if ((indeg.get(id) ?? 0) === 0) {
      rank.set(id, 0);
      queue.push(id);
    }
  }
  if (queue.length === 0 && ids.length) {
    rank.set(ids[0], 0);
    queue.push(ids[0]);
  }
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    const r = rank.get(id);
    for (const to of children.get(id) ?? []) {
      const prev = rank.get(to);
      if (prev == null || r + 1 > prev) {
        rank.set(to, r + 1);
        queue.push(to);
      }
    }
  }
  for (const id of ids) if (!rank.has(id)) rank.set(id, 0);
  const byRank = new Map();
  for (const id of ids) {
    const r = rank.get(id);
    if (!byRank.has(r)) byRank.set(r, []);
    byRank.get(r).push(id);
  }
  const maxRank = Math.max(...rank.values(), 0);
  const placed = [];
  const pos = new Map();
  let cursor = padding;
  for (let r = 0; r <= maxRank; r++) {
    const row = byRank.get(r) ?? [];
    row.forEach((id, order) => {
      const node = {
        id,
        rank: r,
        order,
        x: horizontal ? cursor : padding + order * (nodeWidth + nodeGap),
        y: horizontal ? padding + order * (nodeHeight + nodeGap) : cursor,
      };
      placed.push(node);
      pos.set(id, node);
    });
    cursor += (horizontal ? nodeWidth : nodeHeight) + rankGap;
  }
  const rankWidth = new Map();
  for (let r = 0; r <= maxRank; r++) {
    const n = (byRank.get(r) ?? []).length;
    rankWidth.set(r, horizontal ? n * nodeHeight + (n - 1) * nodeGap : n * nodeWidth + (n - 1) * nodeGap);
  }
  const maxW = Math.max(...rankWidth.values(), 0);
  for (const node of placed) {
    const extra = (maxW - (rankWidth.get(node.rank) ?? 0)) / 2;
    if (horizontal) node.y += extra;
    else node.x += extra;
  }
  const ranks = [];
  for (let r = 0; r <= maxRank; r++) {
    const row = byRank.get(r) ?? [];
    if (!row.length) continue;
    const boxes = row.map((id) => pos.get(id));
    const x = Math.min(...boxes.map((n) => n.x));
    const y = Math.min(...boxes.map((n) => n.y));
    ranks.push({
      rank: r,
      x,
      y,
      width: Math.max(...boxes.map((n) => n.x + nodeWidth)) - x,
      height: Math.max(...boxes.map((n) => n.y + nodeHeight)) - y,
      nodeIds: row,
    });
  }
  const layoutEdges = [];
  edges.forEach((e, i) => {
    const a = pos.get(e.from);
    const b = pos.get(e.to);
    if (!a || !b) return;
    const isBack = back.has(i);
    layoutEdges.push({ from: e.from, to: e.to, ...computeAnchors(a, b, nodeWidth, nodeHeight, horizontal, isBack), isBackEdge: isBack });
  });
  return {
    nodes: placed,
    edges: layoutEdges,
    ranks,
    direction,
    width: Math.max(...placed.map((n) => n.x + nodeWidth), 0) + padding,
    height: Math.max(...placed.map((n) => n.y + nodeHeight), 0) + padding,
  };
}
