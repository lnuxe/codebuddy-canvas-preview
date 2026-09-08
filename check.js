const fs = require("fs");
const os = require("os");
const path = require("path");

function checkCanvas(filePath, sourceText) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    return { diagnostics: [], error: "typescript 未安装" };
  }
  const typesRoot = path.join(__dirname, "types");
  const options = {
    jsx: ts.JsxEmit.ReactJSX,
    jsxImportSource: "react",
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2020,
    lib: ["lib.es2020.d.ts", "lib.dom.d.ts"],
    noEmit: true,
    skipLibCheck: true,
    allowJs: false,
    strict: false,
    esModuleInterop: true,
    isolatedModules: true,
    baseUrl: typesRoot,
    paths: {
      "cursor/canvas": [path.join("cursor", "canvas", "index.d.ts")],
    },
    typeRoots: [path.join(__dirname, "node_modules", "@types")],
  };

  const host = ts.createCompilerHost(options, true);
  const originalFileExists = host.fileExists.bind(host);
  const originalReadFile = host.readFile.bind(host);
  const resolved = path.resolve(filePath);
  host.fileExists = (file) => {
    if (file.replace(/\\/g, "/").endsWith("cursor/canvas/index.d.ts")) return true;
    if (path.resolve(file) === resolved) return true;
    return originalFileExists(file);
  };
  host.readFile = (file) => {
    if (file.replace(/\\/g, "/").endsWith("cursor/canvas/index.d.ts")) {
      return fs.readFileSync(path.join(typesRoot, "cursor", "canvas", "index.d.ts"), "utf8");
    }
    if (path.resolve(file) === resolved && typeof sourceText === "string") return sourceText;
    return originalReadFile(file);
  };

  const program = ts.createProgram([filePath], options, host);
  const diags = ts.getPreEmitDiagnostics(program).filter((d) => {
    const file = d.file && d.file.fileName;
    if (!file) return true;
    return path.resolve(file) === resolved;
  });

  return {
    diagnostics: diags.map((d) => {
      const start = d.start || 0;
      const length = d.length || 1;
      const file = d.file;
      const pos = file ? file.getLineAndCharacterOfPosition(start) : { line: 0, character: 0 };
      const endPos = file ? file.getLineAndCharacterOfPosition(start + length) : { line: 0, character: 1 };
      return {
        message: ts.flattenDiagnosticMessageText(d.messageText, os.EOL),
        severity: d.category === ts.DiagnosticCategory.Error ? "error" : d.category === ts.DiagnosticCategory.Warning ? "warning" : "info",
        startLine: pos.line,
        startCharacter: pos.character,
        endLine: endPos.line,
        endCharacter: endPos.character,
      };
    }),
  };
}

module.exports = { checkCanvas };
