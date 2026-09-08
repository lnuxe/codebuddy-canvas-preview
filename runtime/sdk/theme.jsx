import React, { createContext, useContext, useMemo, useState } from "react";
import {
  CANVAS_BODY_PADDING_HORIZONTAL_PX,
  CANVAS_BODY_PADDING_VERTICAL_PX,
  CANVAS_SANS_FONT_STACK,
  buildHostTheme,
} from "./tokens.js";

export { useEffect, useMemo, useRef, useState } from "react";

const ThemeContext = createContext(buildHostTheme("dark"));

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

export function CanvasThemeRoot({ kind = "dark", children }) {
  const theme = useMemo(() => buildHostTheme(kind), [kind]);
  return (
    <ThemeContext.Provider value={theme}>
      <div
        style={{
          minHeight: "100%",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
          padding: `${CANVAS_BODY_PADDING_VERTICAL_PX}px ${CANVAS_BODY_PADDING_HORIZONTAL_PX}px`,
          background: theme.bg.editor,
          color: theme.text.primary,
          fontFamily: CANVAS_SANS_FONT_STACK,
          fontSize: 14,
          lineHeight: "20px",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

if (typeof window !== "undefined") {
  window.__canvasPreview = { CanvasThemeRoot, buildHostTheme };
}
