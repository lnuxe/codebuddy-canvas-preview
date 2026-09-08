const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const { compileCanvas, previewHtml, standaloneHtml } = require("./compile");

const VIEW_TYPE = "canvasPreview.panel";
const SIDEBAR_VIEW = "canvasPreview.sidebar";
const FILES_VIEW = "canvasPreview.files";
const SCAN_ROOTS = [
  path.join(os.homedir(), ".codebuddy", "canvases"),
  path.join(os.homedir(), ".codebuddycn", "canvases"),
  path.join(os.homedir(), ".cursor", "projects"),
];

/** @type {Map<string, { webview: vscode.Webview }>} */
const panels = new Map();
const debounceTimers = new Map();

function isCanvasFile(filePath) {
  return typeof filePath === "string" && /\.canvas\.tsx$/i.test(filePath);
}

function getTargetUri(uri) {
  if (uri && uri.fsPath) return uri;
  const active = vscode.window.activeTextEditor;
  if (active && isCanvasFile(active.document.fileName)) {
    return active.document.uri;
  }
  const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
  if (tab && tab.input && tab.input.uri && isCanvasFile(tab.input.uri.fsPath)) {
    return tab.input.uri;
  }
  return undefined;
}

function themeKind() {
  const kind = vscode.window.activeColorTheme.kind;
  return kind === vscode.ColorThemeKind.Light || kind === vscode.ColorThemeKind.HighContrastLight
    ? "light"
    : "dark";
}

function emptyHtml(title, body) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  html, body { margin: 0; padding: 16px; font-family: ui-sans-serif, system-ui, sans-serif; color: var(--vscode-foreground); background: var(--vscode-sideBar-background); }
  h3 { margin: 0 0 8px; font-size: 13px; }
  p { margin: 0; font-size: 12px; opacity: 0.8; line-height: 1.5; }
</style>
</head>
<body>
  <h3>${title}</h3>
  <p>${body}</p>
</body>
</html>`;
}

function errorHtml(message) {
  const escaped = String(message)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';" />
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 16px; color: #fca5a5; background: transparent; }
  pre { white-space: pre-wrap; font-size: 12px; line-height: 1.5; color: inherit; }
</style>
</head>
<body>
  <h3>Canvas 预览失败</h3>
  <pre>${escaped}</pre>
</body>
</html>`;
}

function cacheDir() {
  const dir = path.join(os.tmpdir(), "codebuddy-canvas-preview");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function walkCanvases(root, out, depth) {
  if (depth > 8 || !fs.existsSync(root)) return;
  let entries = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walkCanvases(full, out, depth + 1);
    } else if (isCanvasFile(entry.name)) {
      out.push(full);
    }
  }
}

function findCanvasFiles() {
  const list = [];
  for (const root of SCAN_ROOTS) walkCanvases(root, list, 0);
  for (const folder of vscode.workspace.workspaceFolders || []) {
    walkCanvases(path.join(folder.uri.fsPath, "canvases"), list, 0);
    walkCanvases(path.join(folder.uri.fsPath, ".codebuddy", "canvases"), list, 0);
    walkCanvases(folder.uri.fsPath, list, 0);
  }
  return [...new Set(list)].sort();
}

async function pickCanvasUri() {
  const files = findCanvasFiles();
  if (files.length === 0) {
    const picked = await vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: { Canvas: ["tsx"] },
      title: "选择 .canvas.tsx 文件",
    });
    return picked && picked[0];
  }
  const item = await vscode.window.showQuickPick(
    files.map((filePath) => ({
      label: path.basename(filePath),
      description: filePath,
      filePath,
    })),
    { placeHolder: "选择要预览的 Canvas 文件" }
  );
  return item ? vscode.Uri.file(item.filePath) : undefined;
}

async function resolveTarget(uri) {
  const target = getTargetUri(uri);
  if (target) return target;
  return pickCanvasUri();
}

async function setWebviewHtml(webview, filePath) {
  try {
    const js = await compileCanvas(filePath);
    const dir = cacheDir();
    const jsPath = path.join(
      dir,
      crypto.createHash("sha1").update(filePath).digest("hex").slice(0, 16) + ".js"
    );
    fs.writeFileSync(jsPath, js, "utf8");
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(dir), vscode.Uri.file(__dirname)],
    };
    const src = webview.asWebviewUri(vscode.Uri.file(jsPath)).toString();
    webview.html = previewHtml(src, themeKind(), webview.cspSource);
  } catch (err) {
    const message = err && err.errors
      ? err.errors.map((e) => e.text || e.message || String(e)).join("\n")
      : (err && err.stack) || String(err);
    webview.html = errorHtml(message);
  }
}

class SidebarPreviewProvider {
  constructor() {
    /** @type {vscode.WebviewView | undefined} */
    this.view = undefined;
    this.currentPath = undefined;
  }

  resolveWebviewView(webviewView) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(cacheDir()), vscode.Uri.file(__dirname)],
    };
    if (this.currentPath) {
      this.showPath(this.currentPath);
    } else {
      webviewView.webview.html = emptyHtml(
        "还没有预览",
        "点下面的 Canvas 文件，或用命令「在侧边栏打开 Canvas 预览」。"
      );
    }
    webviewView.onDidDispose(() => {
      if (this.view === webviewView) this.view = undefined;
    });
  }

  async showPath(filePath) {
    this.currentPath = filePath;
    await vscode.commands.executeCommand("workbench.view.extension.canvasPreview");
    await vscode.commands.executeCommand("canvasPreview.sidebar.focus");
    if (!this.view) return;
    this.view.show?.(true);
    await setWebviewHtml(this.view.webview, filePath);
  }
}

class CanvasFileProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(filePath) {
    const item = new vscode.TreeItem(path.basename(filePath), vscode.TreeItemCollapsibleState.None);
    item.resourceUri = vscode.Uri.file(filePath);
    item.description = path.dirname(filePath);
    item.command = {
      command: "canvasPreview.openSidebar",
      title: "在侧边栏预览",
      arguments: [vscode.Uri.file(filePath)],
    };
    item.iconPath = new vscode.ThemeIcon("symbol-color");
    item.contextValue = "canvasFile";
    return item;
  }

  getChildren() {
    return findCanvasFiles();
  }
}

function openEditorPanel(uri, side) {
  const filePath = uri.fsPath;
  const existing = panels.get(filePath);
  if (existing && existing.reveal) {
    existing.reveal(side ? vscode.ViewColumn.Beside : existing.viewColumn);
    setWebviewHtml(existing.webview, filePath);
    return existing;
  }

  const panel = vscode.window.createWebviewPanel(
    VIEW_TYPE,
    "预览 " + path.basename(filePath).replace(/\.canvas\.tsx$/i, ""),
    side ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(cacheDir()), vscode.Uri.file(__dirname)],
    }
  );
  panels.set(filePath, panel);
  panel.onDidDispose(() => panels.delete(filePath));
  setWebviewHtml(panel.webview, filePath);
  return panel;
}

function activate(context) {
  const sidebar = new SidebarPreviewProvider();
  const files = new CanvasFileProvider();

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.text = "$(layout-sidebar-left) Canvas 预览";
  status.tooltip = "在左侧边栏打开 Canvas 预览";
  status.command = "canvasPreview.openSidebar";
  status.show();

  const watcher = vscode.workspace.createFileSystemWatcher("**/*.canvas.tsx");

  context.subscriptions.push(
    status,
    watcher,
    watcher.onDidCreate(() => files.refresh()),
    watcher.onDidDelete(() => files.refresh()),
    watcher.onDidChange(() => files.refresh()),
    vscode.window.registerWebviewViewProvider(SIDEBAR_VIEW, sidebar, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    vscode.window.registerTreeDataProvider(FILES_VIEW, files),
    vscode.commands.registerCommand("canvasPreview.openSidebar", async (uri) => {
      const target = await resolveTarget(uri);
      if (!target) return;
      await sidebar.showPath(target.fsPath);
    }),
    vscode.commands.registerCommand("canvasPreview.open", async (uri) => {
      const target = await resolveTarget(uri);
      if (!target) return;
      await sidebar.showPath(target.fsPath);
    }),
    vscode.commands.registerCommand("canvasPreview.openToSide", async (uri) => {
      const target = await resolveTarget(uri);
      if (!target) return;
      openEditorPanel(target, true);
    }),
    vscode.commands.registerCommand("canvasPreview.pick", async () => {
      const target = await pickCanvasUri();
      if (!target) return;
      await sidebar.showPath(target.fsPath);
    }),
    vscode.commands.registerCommand("canvasPreview.refreshFiles", () => files.refresh()),
    vscode.commands.registerCommand("canvasPreview.exportHtml", async (uri) => {
      const target = await resolveTarget(uri);
      if (!target) return;
      const js = await compileCanvas(target.fsPath);
      const html = standaloneHtml(js, themeKind());
      const defaultName = path.basename(target.fsPath, ".tsx") + ".html";
      const save = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(path.join(path.dirname(target.fsPath), defaultName)),
        filters: { HTML: ["html"] },
      });
      if (!save) return;
      fs.writeFileSync(save.fsPath, html, "utf8");
      const open = await vscode.window.showInformationMessage(
        "已导出可分享 HTML。发给别人用浏览器打开即可，不需要自建服务器。",
        "打开文件",
        "在浏览器打开"
      );
      if (open === "打开文件") await vscode.window.showTextDocument(save);
      if (open === "在浏览器打开") await vscode.env.openExternal(save);
    }),
    vscode.commands.registerCommand("canvasPreview.copyHtml", async (uri) => {
      const target = await resolveTarget(uri);
      if (!target) return;
      const js = await compileCanvas(target.fsPath);
      await vscode.env.clipboard.writeText(standaloneHtml(js, themeKind()));
      vscode.window.showInformationMessage("已复制完整 HTML。可贴到仓库、对象存储或任意静态托管。");
    }),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (!isCanvasFile(doc.fileName)) return;
      if (sidebar.currentPath === doc.fileName) sidebar.showPath(doc.fileName);
      const panel = panels.get(doc.fileName);
      if (panel) setWebviewHtml(panel.webview, doc.fileName);
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (!isCanvasFile(e.document.fileName)) return;
      const shouldUpdateSidebar = sidebar.currentPath === e.document.fileName;
      const panel = panels.get(e.document.fileName);
      if (!shouldUpdateSidebar && !panel) return;
      if (debounceTimers.has(e.document.fileName)) {
        clearTimeout(debounceTimers.get(e.document.fileName));
      }
      debounceTimers.set(
        e.document.fileName,
        setTimeout(() => {
          const source = e.document.isDirty
            ? (() => {
                const tmp = path.join(os.tmpdir(), `canvas-preview-${path.basename(e.document.fileName)}`);
                fs.writeFileSync(tmp, e.document.getText(), "utf8");
                return tmp;
              })()
            : e.document.fileName;
          if (shouldUpdateSidebar) sidebar.showPath(source);
          if (panel) setWebviewHtml(panel.webview, source);
        }, 250)
      );
    }),
    vscode.window.registerCustomEditorProvider(
      "canvasPreview.editor",
      {
        async resolveCustomTextEditor(document, webviewPanel) {
          webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(cacheDir()), vscode.Uri.file(__dirname)],
          };
          panels.set(document.fileName, webviewPanel);
          webviewPanel.onDidDispose(() => {
            if (panels.get(document.fileName) === webviewPanel) {
              panels.delete(document.fileName);
            }
          });
          await setWebviewHtml(webviewPanel.webview, document.fileName);
        },
      },
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
