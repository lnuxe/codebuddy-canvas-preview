import type { CSSProperties, ReactNode, JSX } from "react";
export type { CSSProperties, RefObject } from "react";
export { useEffect, useMemo, useRef, useState } from "react";

export type Color = "gray" | "purple" | "green" | "yellow" | "cyan" | "pink" | "blue" | "orange" | "red";
export type CategoryPalette = Readonly<Record<Color, string>>;
export declare const categoryPaletteDark: CategoryPalette;
export declare const categoryPaletteLight: CategoryPalette;
export declare const colorPalette: CategoryPalette;
export declare const usageColorSequence: readonly Color[];
export declare const chartColorSequence: readonly string[];
export declare const chartPalette: Record<string, string>;

export interface CanvasPalette {
  readonly foreground: string;
  readonly foregroundSecondary: string;
  readonly foregroundTertiary: string;
  readonly foregroundQuaternary: string;
  readonly editor: string;
  readonly chrome: string;
  readonly sidebar: string;
  readonly elevated: string;
  readonly fillPrimary: string;
  readonly fillSecondary: string;
  readonly fillTertiary: string;
  readonly fillQuaternary: string;
  readonly strokePrimary: string;
  readonly strokeSecondary: string;
  readonly strokeTertiary: string;
  readonly strokeFocused: string;
  readonly accent: string;
  readonly buttonBackground: string;
  readonly buttonForeground: string;
  readonly buttonHoverBackground: string;
  readonly link: string;
  readonly diffInsertedLine: string;
  readonly diffRemovedLine: string;
  readonly diffStripAdded: string;
  readonly diffStripRemoved: string;
}
export interface CanvasHostThemeOverrides {
  readonly primary?: string;
  readonly editorBackground?: string;
  readonly editorForeground?: string;
}
export declare const canvasPaletteDark: CanvasPalette;
export declare const canvasPaletteLight: CanvasPalette;
export declare function applyWorkbenchSurfaces(
  palette: CanvasPalette,
  surfaces: Pick<CanvasHostThemeOverrides, "editorBackground" | "editorForeground">
): CanvasPalette;
export declare function applyPrimaryColor(palette: CanvasPalette, primary: string): CanvasPalette;

export interface CanvasTokens {
  bg: { editor: string; chrome: string; elevated: string };
  text: { primary: string; secondary: string; tertiary: string; quaternary: string; link: string; onAccent: string };
  stroke: { primary: string; secondary: string; tertiary: string; focused: string };
  fill: { primary: string; secondary: string; tertiary: string; quaternary: string };
  accent: { primary: string; control: string; controlHover: string };
  diff: { insertedLine: string; removedLine: string; stripAdded: string; stripRemoved: string };
  category: CategoryPalette;
}
export declare const canvasTokens: CanvasTokens;
export declare const canvasTokensLight: CanvasTokens;
export declare function buildHostTokens(kind: string, overrides?: CanvasHostThemeOverrides): {
  tokens: CanvasTokens;
  palette: CanvasPalette;
};

export interface CanvasHostTheme extends CanvasTokens {
  readonly kind: string;
  readonly tokens: CanvasTokens;
  readonly palette: CanvasPalette;
}
export declare function useHostTheme(): CanvasHostTheme;
export type SetCanvasState<T> = (action: T | ((prev: T) => T)) => void;
export declare function useCanvasState<T>(key: string, defaultValue: T): [T, SetCanvasState<T>];
export type CanvasAction =
  | { type: "openAgent"; agentId: string }
  | { type: "openFile"; path: string; selection?: {
      startLineNumber?: number;
      startColumn?: number;
      endLineNumber?: number;
      endColumn?: number;
      startLine?: number;
      endLine?: number;
    } }
  | { type: "newComposerChat"; userPrompt?: string };
export declare function useCanvasAction(): (action: CanvasAction) => void;

export declare function mergeStyle(base: CSSProperties, override?: CSSProperties): CSSProperties;
export declare function Stack(props: { children?: ReactNode; gap?: number; style?: CSSProperties }): JSX.Element;
export declare function Row(props: {
  children?: ReactNode;
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "space-between";
  wrap?: boolean;
  style?: CSSProperties;
}): JSX.Element;
export declare function Grid(props: {
  children?: ReactNode;
  columns: number | string;
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  style?: CSSProperties;
}): JSX.Element;
export declare function Divider(props: { style?: CSSProperties }): JSX.Element;
export declare function Spacer(): JSX.Element;

export type TableColumnAlign = "left" | "center" | "right";
export type TableRowTone = "success" | "danger" | "warning" | "info" | "neutral";
export declare function Table(props: {
  headers: ReactNode[];
  rows: ReactNode[][];
  columnAlign?: Array<TableColumnAlign | undefined>;
  rowTone?: Array<TableRowTone | undefined>;
  framed?: boolean;
  striped?: boolean;
  stickyHeader?: boolean;
  style?: CSSProperties;
  emptyMessage?: ReactNode;
}): JSX.Element;

export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export declare function Text(props: {
  children?: ReactNode;
  tone?: "primary" | "secondary" | "tertiary" | "quaternary";
  size?: "body" | "small";
  as?: "p" | "span";
  weight?: TextWeight;
  italic?: boolean;
  truncate?: boolean | "start" | "end";
  style?: CSSProperties;
}): JSX.Element;
export declare function H1(props: { children?: ReactNode; style?: CSSProperties }): JSX.Element;
export declare function H2(props: { children?: ReactNode; style?: CSSProperties }): JSX.Element;
export declare function H3(props: { children?: ReactNode; style?: CSSProperties }): JSX.Element;
export declare function Code(props: { children?: ReactNode; style?: CSSProperties }): JSX.Element;
export declare function Link(props: { children?: ReactNode; href: string; style?: CSSProperties }): JSX.Element;

export type CardSize = "base" | "lg";
export type CardVariant = "default" | "borderless";
export declare function CanvasChevron(props: { expanded: boolean }): JSX.Element;
export declare function Card(props: {
  children?: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  stickyHeader?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: CSSProperties;
}): JSX.Element;
export declare function CardHeader(props: { children?: ReactNode; trailing?: ReactNode; style?: CSSProperties }): JSX.Element;
export declare function CardBody(props: { children?: ReactNode; style?: CSSProperties }): JSX.Element | null;
export declare function Button(props: {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  style?: CSSProperties;
  onClick?: () => void;
}): JSX.Element;
export type PillTone = "neutral" | "added" | "deleted" | "renamed" | "success" | "warning" | "info";
export type PillSize = "sm" | "md";
export declare function Pill(props: {
  children?: ReactNode;
  active?: boolean;
  tone?: PillTone;
  size?: PillSize;
  leadingContent?: ReactNode;
  keyboardHint?: string;
  disabled?: boolean;
  title?: string;
  style?: CSSProperties;
  onClick?: () => void;
}): JSX.Element;
export type StatTone = "success" | "danger" | "warning" | "info";
export declare function Stat(props: { value: ReactNode; label: string; tone?: StatTone; style?: CSSProperties }): JSX.Element;
export type CalloutTone = "info" | "success" | "warning" | "danger" | "neutral";
export declare function Callout(props: {
  children?: ReactNode;
  tone?: CalloutTone;
  title?: ReactNode;
  icon?: ReactNode;
  style?: CSSProperties;
}): JSX.Element;

export type ChartTone = "success" | "danger" | "warning" | "info" | "neutral";
export type ChartDataPoint = { label: string; value: number; tone?: ChartTone };
export type ChartSeries = { name: string; data: number[]; tone?: ChartTone };
export type ChartReferenceLine = { value: number; label?: string; tone?: ChartTone };
export declare function BarChart(props: {
  categories: string[];
  series: ChartSeries[];
  height?: number;
  stacked?: boolean;
  horizontal?: boolean;
  normalized?: boolean;
  valueSuffix?: string;
  valuePrefix?: string;
  showValues?: boolean;
  beginAtZero?: boolean;
  yMin?: number;
  yMax?: number;
  referenceLines?: ChartReferenceLine[];
  style?: CSSProperties;
}): JSX.Element;
export declare function LineChart(props: {
  categories: string[];
  series: ChartSeries[];
  height?: number;
  fill?: boolean;
  valueSuffix?: string;
  valuePrefix?: string;
  showValues?: boolean;
  showHoverGuide?: boolean;
  beginAtZero?: boolean;
  yMin?: number;
  yMax?: number;
  referenceLines?: ChartReferenceLine[];
  style?: CSSProperties;
}): JSX.Element;
export declare function PieChart(props: {
  data: Array<ChartDataPoint>;
  size?: number;
  donut?: boolean;
  style?: CSSProperties;
}): JSX.Element;

export declare function CollapsibleSection(props: {
  title: string;
  leading?: ReactNode;
  count?: number;
  trailing?: ReactNode;
  children?: ReactNode;
  defaultOpen?: boolean;
  style?: CSSProperties;
}): JSX.Element;
export declare function Swatch(props: { color: Color; style?: CSSProperties }): JSX.Element;
export interface UsageBarSegment {
  readonly id: string;
  readonly value: number;
  readonly color?: Color;
}
export declare function UsageBar(props: {
  segments: readonly UsageBarSegment[];
  total: number;
  topLeftLabel?: ReactNode;
  topRightLabel?: ReactNode;
  style?: CSSProperties;
}): JSX.Element;

export type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled";
export interface TodoItem {
  readonly id: string;
  readonly content: string;
  readonly status: TodoStatus;
}
export declare function TodoList(props: {
  todos: readonly TodoItem[];
  dimmedTodoIds?: ReadonlySet<string>;
  onTodoClick?: (todo: TodoItem) => void;
  style?: CSSProperties;
}): JSX.Element | null;
export declare function TodoListCard(props: {
  todos: readonly TodoItem[];
  dimmedTodoIds?: ReadonlySet<string>;
  defaultExpanded?: boolean;
  onTodoClick?: (todo: TodoItem) => void;
  style?: CSSProperties;
}): JSX.Element | null;

export declare function TextInput(props: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "email" | "password" | "number" | "url" | "search";
  style?: CSSProperties;
}): JSX.Element;
export declare function TextArea(props: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  style?: CSSProperties;
}): JSX.Element;
export declare function Checkbox(props: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: ReactNode;
  style?: CSSProperties;
}): JSX.Element;
export declare function Toggle(props: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  style?: CSSProperties;
}): JSX.Element;
export type SelectOption = { value: string; label: string; disabled?: boolean };
export declare function Select(props: {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  style?: CSSProperties;
}): JSX.Element;
export declare function IconButton(props: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  variant?: "default" | "circle";
  size?: "sm" | "md";
  style?: CSSProperties;
}): JSX.Element;

export declare function DiffStats(props: { additions?: number; deletions?: number; style?: CSSProperties }): JSX.Element | null;
export type DiffLineType = "added" | "removed" | "unchanged";
export type DiffLineData = { type: DiffLineType; content: string; lineNumber?: number };
export declare function DiffView(props: {
  lines: DiffLineData[];
  path?: string;
  language?: string;
  showLineNumbers?: boolean;
  coloredLineNumbers?: boolean;
  showAccentStrip?: boolean;
  style?: CSSProperties;
}): JSX.Element;

export type DAGLayoutOptions = {
  nodes: Array<{ id: string }>;
  edges: Array<{ from: string; to: string }>;
  direction?: "vertical" | "horizontal";
  nodeWidth?: number;
  nodeHeight?: number;
  rankGap?: number;
  nodeGap?: number;
  padding?: number;
};
export type DAGLayoutNode = { id: string; x: number; y: number; rank: number; order: number };
export type DAGLayoutEdge = {
  from: string;
  to: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  isBackEdge: boolean;
};
export type DAGLayoutRank = { rank: number; x: number; y: number; width: number; height: number; nodeIds: string[] };
export type DAGLayoutResult = {
  nodes: DAGLayoutNode[];
  edges: DAGLayoutEdge[];
  ranks: DAGLayoutRank[];
  direction: "vertical" | "horizontal";
  width: number;
  height: number;
};
export declare function computeDAGLayout(options: DAGLayoutOptions): DAGLayoutResult;

export declare const canvasTypography: {
  readonly h1: { readonly fontSize: "24px"; readonly lineHeight: "30px"; readonly fontWeight: 590 };
  readonly h2: { readonly fontSize: "18px"; readonly lineHeight: "24px"; readonly fontWeight: 590 };
  readonly h3: { readonly fontSize: "16px"; readonly lineHeight: "22px"; readonly fontWeight: 590 };
  readonly body: { readonly fontSize: "14px"; readonly lineHeight: "20px"; readonly fontWeight: 400 };
  readonly small: { readonly fontSize: "12px"; readonly lineHeight: "16px"; readonly fontWeight: 400 };
};
export declare const canvasSpacing: { readonly [key: string]: number };
export declare const canvasRadius: {
  readonly none: 0;
  readonly xs: 2;
  readonly sm: 4;
  readonly md: 6;
  readonly lg: 8;
  readonly xl: 12;
  readonly full: 9999;
};
