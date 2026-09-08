export const ON_ACCENT_DARK = "#191C22";
export const ON_ACCENT_LIGHT = "#FFFFFF";

export const canvasPaletteDark = {
  foreground: "#F0F0F0",
  foregroundSecondary: "#F0F0F0BD",
  foregroundTertiary: "#F0F0F099",
  foregroundQuaternary: "#F0F0F05C",
  editor: "#181818",
  chrome: "#141414",
  sidebar: "#181818",
  elevated: "#181818",
  fillPrimary: "#F0F0F033",
  fillSecondary: "#F0F0F024",
  fillTertiary: "#F0F0F014",
  fillQuaternary: "#F0F0F00F",
  strokePrimary: "#F0F0F033",
  strokeSecondary: "#F0F0F01F",
  strokeTertiary: "#F0F0F014",
  strokeFocused: "#F0F0F0",
  accent: "#599CE7",
  buttonBackground: "#599CE7",
  buttonForeground: ON_ACCENT_DARK,
  buttonHoverBackground: "#68A4E8",
  link: "#7BAFE9",
  diffInsertedLine: "#3FA26633",
  diffRemovedLine: "#B8004933",
  diffStripAdded: "#3FA2668F",
  diffStripRemoved: "#FC6B838F",
};

export const canvasPaletteLight = {
  foreground: "#141414",
  foregroundSecondary: "#141414BD",
  foregroundTertiary: "#14141499",
  foregroundQuaternary: "#1414145C",
  editor: "#FCFCFC",
  chrome: "#F8F8F8",
  sidebar: "#F3F3F3",
  elevated: "#FCFCFC",
  fillPrimary: "#14141433",
  fillSecondary: "#14141424",
  fillTertiary: "#14141414",
  fillQuaternary: "#1414140F",
  strokePrimary: "#14141433",
  strokeSecondary: "#1414141F",
  strokeTertiary: "#14141414",
  strokeFocused: "#2778C1",
  accent: "#2778C1",
  buttonBackground: "#2778C1",
  buttonForeground: "#FCFCFC",
  buttonHoverBackground: "#256EB0",
  link: "#2778C1",
  diffInsertedLine: "#00AF6624",
  diffRemovedLine: "#FF617B38",
  diffStripAdded: "#007041CC",
  diffStripRemoved: "#BE1744CC",
};

export const chartPalette = {
  green: "#1F8A65E8",
  darkGreen: "#0D855AE0",
  lightGreen: "#52B896E0",
  mintGreen: "#7DCAB0E0",
  blue: "#2E79B5E0",
  lightBlue: "#70B0D8E0",
  indigo: "#5A6CC0F0",
  lightIndigo: "#9AAADCE0",
  purple: "#7B64B8F0",
  lightPurple: "#AA98D8E0",
  warmPink: "#C85898E0",
  lightPink: "#E8A0C4E0",
  brightOrange: "#F0A040E0",
  deepOrange: "#C06028E0",
  goldenYellow: "#E8C030E0",
  darkAmber: "#C04848E0",
  warmPeach: "#F0A088E0",
  vibrantTeal: "#2A9A8AE0",
  muted: "#8888A8E0",
  neutralLine: "#888899D0",
};

export const categoryPaletteDark = {
  gray: canvasPaletteDark.foregroundTertiary,
  purple: "#9386F2",
  green: "#3FA266",
  yellow: "#F1B467",
  cyan: "#81A1C1",
  pink: "#B48EAD",
  blue: "#7BAFE9",
  orange: "#DD7F76",
  red: "#FC6B83",
};

export const categoryPaletteLight = {
  gray: canvasPaletteLight.foregroundTertiary,
  purple: "#7565CC",
  green: "#007041",
  yellow: "#A46700",
  cyan: "#176C74",
  pink: "#92156A",
  blue: "#2778C1",
  orange: "#C93714",
  red: "#BE1744",
};

export const colorPalette = categoryPaletteDark;
export const usageColorSequence = ["gray", "purple", "green", "yellow", "cyan", "pink", "blue", "orange", "red"];
export const chartColorSequence = [
  chartPalette.green,
  chartPalette.lightBlue,
  chartPalette.indigo,
  chartPalette.brightOrange,
  chartPalette.deepOrange,
  chartPalette.goldenYellow,
  chartPalette.warmPink,
  chartPalette.warmPeach,
  chartPalette.purple,
  chartPalette.mintGreen,
  chartPalette.muted,
  chartPalette.vibrantTeal,
];

export function buildTokens(palette, category) {
  return {
    bg: { editor: palette.editor, chrome: palette.chrome, elevated: palette.elevated },
    text: {
      primary: palette.foreground,
      secondary: palette.foregroundSecondary,
      tertiary: palette.foregroundTertiary,
      quaternary: palette.foregroundQuaternary,
      link: palette.link,
      onAccent: palette.buttonForeground,
    },
    stroke: {
      primary: palette.strokePrimary,
      secondary: palette.strokeSecondary,
      tertiary: palette.strokeTertiary,
      focused: palette.strokeFocused,
    },
    fill: {
      primary: palette.fillPrimary,
      secondary: palette.fillSecondary,
      tertiary: palette.fillTertiary,
      quaternary: palette.fillQuaternary,
    },
    accent: {
      primary: palette.accent,
      control: palette.buttonBackground,
      controlHover: palette.buttonHoverBackground,
    },
    diff: {
      insertedLine: palette.diffInsertedLine,
      removedLine: palette.diffRemovedLine,
      stripAdded: palette.diffStripAdded,
      stripRemoved: palette.diffStripRemoved,
    },
    category,
  };
}

export const canvasTokens = buildTokens(canvasPaletteDark, categoryPaletteDark);
export const canvasTokensLight = buildTokens(canvasPaletteLight, categoryPaletteLight);

export const canvasTypography = {
  h1: { fontSize: "24px", lineHeight: "30px", fontWeight: 590 },
  h2: { fontSize: "18px", lineHeight: "24px", fontWeight: 590 },
  h3: { fontSize: "16px", lineHeight: "22px", fontWeight: 590 },
  body: { fontSize: "14px", lineHeight: "20px", fontWeight: 400 },
  small: { fontSize: "12px", lineHeight: "16px", fontWeight: 400 },
};

export const canvasSpacing = {
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  4.5: 18,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
};

export const canvasRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
};

export const CANVAS_SANS_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", system-ui, "Ubuntu", "Droid Sans", sans-serif';
export const CANVAS_MONO_FONT =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
export const CANVAS_BODY_PADDING_VERTICAL_PX = 24;
export const CANVAS_BODY_PADDING_HORIZONTAL_PX = 32;

export function mergeStyle(base, override) {
  return override ? { ...base, ...override } : base;
}

export function buildHostTheme(kind) {
  const light = kind === "light" || kind === "hc-light";
  const palette = light ? canvasPaletteLight : canvasPaletteDark;
  const tokens = light ? canvasTokensLight : canvasTokens;
  return { kind: light ? "light" : "dark", tokens, palette, ...tokens };
}

export const statToneColors = {
  success: chartPalette.lightGreen,
  danger: chartPalette.darkAmber,
  warning: chartPalette.brightOrange,
  info: chartPalette.lightBlue,
};

export const calloutToneColors = {
  info: chartPalette.lightBlue,
  success: chartPalette.lightGreen,
  warning: chartPalette.brightOrange,
  danger: chartPalette.darkAmber,
  neutral: chartPalette.muted,
};

export const DIFF_GREEN = "#3FA266";
export const DIFF_RED = "#FC6B83";
