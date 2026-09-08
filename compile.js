const path = require("path");

async function compileCanvas(filePath) {
  const esbuild = require("esbuild");
  const runtime = path.join(__dirname, "runtime", "canvas-sdk.jsx");
  const wrapper = `
import { createRoot } from "react-dom/client";
import React from "react";
import App from ${JSON.stringify(filePath)};
import { CanvasThemeRoot } from ${JSON.stringify(runtime)};

const kind = document.documentElement.dataset.theme || "dark";
const root = document.getElementById("root");
try {
  createRoot(root).render(
    React.createElement(CanvasThemeRoot, { kind }, React.createElement(App))
  );
} catch (err) {
  root.textContent = String(err && err.stack || err);
}
`;

  const result = await esbuild.build({
    stdin: {
      contents: wrapper,
      resolveDir: path.dirname(filePath),
      sourcefile: "canvas-preview-entry.tsx",
      loader: "tsx",
    },
    absWorkingDir: __dirname,
    nodePaths: [path.join(__dirname, "node_modules")],
    inject: [path.join(__dirname, "runtime", "inject.js")],
    alias: {
      react: require.resolve("react"),
      "react-dom": require.resolve("react-dom"),
      "react-dom/client": require.resolve("react-dom/client"),
      "react/jsx-runtime": require.resolve("react/jsx-runtime"),
      "react/jsx-dev-runtime": require.resolve("react/jsx-dev-runtime"),
    },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    target: "es2020",
    jsx: "automatic",
    logLevel: "silent",
    minify: true,
    legalComments: "none",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    plugins: [
      {
        name: "canvas-sdk-alias",
        setup(build) {
          build.onResolve({ filter: /^cursor\/canvas$/ }, () => ({
            path: runtime,
          }));
        },
      },
    ],
    loader: {
      ".jsx": "jsx",
      ".tsx": "tsx",
      ".ts": "ts",
    },
  });

  const js = result.outputFiles && result.outputFiles[0] && result.outputFiles[0].text;
  if (!js) throw new Error("esbuild produced no output");
  return js;
}

function previewHtml(scriptSrc, theme, cspSource) {
  const src = String(scriptSrc).replace(/"/g, "&quot;");
  const csp = cspSource
    ? `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} data:; style-src 'unsafe-inline'; script-src ${cspSource} 'unsafe-inline';" />`
    : "";
  return `<!DOCTYPE html>
<html data-theme="${theme}">
<head>
<meta charset="UTF-8" />
${csp}
<style>
  html, body, #root { margin: 0; padding: 0; min-height: 100%; }
  body { background: ${theme === "light" ? "#FFFFFF" : "#181818"}; color: ${theme === "light" ? "#141414" : "#F0F0F0"}; }
</style>
</head>
<body>
  <div id="root"></div>
  <script>
    window.onerror = function (m, s, l, c, e) {
      var el = document.getElementById("root");
      if (el) el.textContent = String((e && e.stack) || m);
    };
  </script>
  <script src="${src}"></script>
</body>
</html>`;
}

module.exports = { compileCanvas, previewHtml };
