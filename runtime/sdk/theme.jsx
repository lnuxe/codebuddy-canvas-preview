import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  CANVAS_BODY_PADDING_HORIZONTAL_PX,
  CANVAS_BODY_PADDING_VERTICAL_PX,
  CANVAS_SANS_FONT_STACK,
  buildHostTheme,
  cssColorToHex,
} from "./tokens.js";

export { useEffect, useMemo, useRef, useState } from "react";

const ThemeContext = createContext(buildHostTheme("dark"));

export function useHostTheme() {
  return useContext(ThemeContext);
}

function vscodeApi() {
  if (typeof window === "undefined") return undefined;
  if (window.__canvasPreviewVscode) return window.__canvasPreviewVscode;
  if (typeof window.acquireVsCodeApi === "function") {
    window.__canvasPreviewVscode = window.acquireVsCodeApi();
    return window.__canvasPreviewVscode;
  }
  return undefined;
}

function host() {
  if (typeof window === "undefined") return {};
  if (!window.__canvasPreviewHost) window.__canvasPreviewHost = { data: {} };
  if (!window.__canvasPreviewHost.data) window.__canvasPreviewHost.data = {};
  return window.__canvasPreviewHost;
}

function readCssOverrides() {
  if (typeof getComputedStyle === "undefined" || typeof document === "undefined") return {};
  const css = getComputedStyle(document.documentElement);
  const pick = (...names) => {
    for (const name of names) {
      const hex = cssColorToHex(css.getPropertyValue(name));
      if (hex) return hex;
    }
    return undefined;
  };
  return {
    editorBackground: pick("--vscode-editor-background"),
    editorForeground: pick("--vscode-editor-foreground"),
    primary: pick("--vscode-button-background", "--vscode-focusBorder", "--vscode-textLink-foreground"),
  };
}

const canvasStateStore = new Map();
const flushTimers = new Map();

function seedStoreFromHost() {
  const data = host().data || {};
  for (const [key, value] of Object.entries(data)) {
    canvasStateStore.set(key, value);
  }
}

if (typeof window !== "undefined") seedStoreFromHost();

function persistKey(key, value) {
  canvasStateStore.set(key, value);
  host().data[key] = value;
  const api = vscodeApi();
  if (!api) return;
  if (flushTimers.has(key)) clearTimeout(flushTimers.get(key));
  flushTimers.set(
    key,
    setTimeout(() => {
      api.postMessage({ type: "canvasStateSet", key, value });
      flushTimers.delete(key);
    }, 150)
  );
}

export function useCanvasState(key, initial) {
  const [value, setValue] = useState(() => {
    if (canvasStateStore.has(key)) return canvasStateStore.get(key);
    const fromHost = host().data && Object.prototype.hasOwnProperty.call(host().data, key) ? host().data[key] : undefined;
    if (fromHost !== undefined) {
      canvasStateStore.set(key, fromHost);
      return fromHost;
    }
    return typeof initial === "function" ? initial() : initial;
  });
  const set = (action) => {
    setValue((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      persistKey(key, next);
      return next;
    });
  };
  return [value, set];
}

export function useCanvasAction() {
  return (action) => {
    vscodeApi()?.postMessage({ type: "canvasAction", action });
  };
}

export function CanvasThemeRoot({ kind = "dark", children }) {
  const fromDataset = typeof document !== "undefined" ? document.documentElement.dataset.theme : kind;
  const initialKind = fromDataset || kind;
  const [overrides, setOverrides] = useState(() => ({ ...readCssOverrides(), ...(host().theme || {}) }));
  const [themeKind, setThemeKind] = useState(initialKind);
  const theme = useMemo(() => buildHostTheme(themeKind, overrides), [themeKind, overrides]);
  const rootRef = useRef(null);

  useEffect(() => {
    const apply = (payload) => {
      if (payload?.kind) setThemeKind(payload.kind);
      setOverrides({ ...readCssOverrides(), ...(host().theme || {}), ...(payload || {}) });
    };
    apply(host().theme);
    const onMessage = (event) => {
      const msg = event.data;
      if (msg && msg.type === "canvasTheme") apply(msg.theme || msg);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      <div
        ref={rootRef}
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
