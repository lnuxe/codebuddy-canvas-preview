const fs = require("fs");
const path = require("path");
const os = require("os");
const vscode = require("vscode");

function sidecarPath(canvasPath) {
  return canvasPath.replace(/\.tsx$/i, ".data.json");
}

function readSidecar(canvasPath) {
  const file = sidecarPath(canvasPath);
  try {
    if (!fs.existsSync(file)) return {};
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function writeSidecar(canvasPath, data) {
  const file = sidecarPath(canvasPath);
  const payload = data && typeof data === "object" ? data : {};
  if (Object.keys(payload).length === 0) {
    if (fs.existsSync(file)) fs.writeFileSync(file, "{}\n", "utf8");
    return;
  }
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function resolveWorkspaceFile(filePath, fromCanvas) {
  if (!filePath) return undefined;
  if (path.isAbsolute(filePath) && fs.existsSync(filePath)) return filePath;
  const fromDir = path.resolve(path.dirname(fromCanvas), filePath);
  if (fs.existsSync(fromDir)) return fromDir;
  for (const folder of vscode.workspace.workspaceFolders || []) {
    const candidate = path.join(folder.uri.fsPath, filePath);
    if (fs.existsSync(candidate)) return candidate;
  }
  return fromDir;
}

async function handleCanvasAction(canvasPath, action) {
  if (!action || typeof action !== "object") return;
  const type = action.type;
  if (type === "openFile") {
    const target = resolveWorkspaceFile(action.path, canvasPath);
    if (!target || !fs.existsSync(target)) {
      vscode.window.showWarningMessage(`打不开文件：${action.path || ""}`);
      return;
    }
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(target));
    const editor = await vscode.window.showTextDocument(doc, { preview: false });
    const sel = action.selection;
    if (sel && editor) {
      const start = new vscode.Position((sel.startLineNumber || sel.startLine || 1) - 1, (sel.startColumn || 1) - 1);
      const end = new vscode.Position((sel.endLineNumber || sel.endLine || start.line + 1) - 1, (sel.endColumn || sel.startColumn || 1) - 1);
      editor.selection = new vscode.Selection(start, end);
      editor.revealRange(new vscode.Range(start, end));
    }
    return;
  }
  if (type === "openAgent") {
    const id = action.agentId;
    if (!id) return;
    const roots = [
      path.join(os.homedir(), ".cursor", "projects"),
      path.join(os.homedir(), ".codebuddy"),
    ];
    const matches = [];
    function walk(dir, depth) {
      if (depth > 6 || !fs.existsSync(dir)) return;
      let entries = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules" || entry.name === ".git") continue;
          if (entry.name === "agent-transcripts" || entry.name.includes("agent-transcript")) {
            const hit = path.join(full, `${id}.jsonl`);
            if (fs.existsSync(hit)) matches.push(hit);
          }
          walk(full, depth + 1);
        } else if (entry.name === `${id}.jsonl` || entry.name.startsWith(id)) {
          matches.push(full);
        }
      }
    }
    for (const root of roots) walk(root, 0);
    if (matches[0]) {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(matches[0]));
      await vscode.window.showTextDocument(doc, { preview: true });
      return;
    }
    vscode.window.showInformationMessage(`找不到会话 ${id}`);
    return;
  }
  if (type === "newComposerChat") {
    const prompt = [canvasPath, action.userPrompt].filter(Boolean).join("\n\n");
    const commands = [
      "workbench.action.chat.open",
      "aichat.newchat",
      "codebuddy.chat.new",
      "composer.newChat",
    ];
    for (const command of commands) {
      try {
        await vscode.commands.executeCommand(command, { query: prompt });
        return;
      } catch {
        try {
          await vscode.commands.executeCommand(command);
          if (prompt) await vscode.env.clipboard.writeText(prompt);
          return;
        } catch {
          /* try next */
        }
      }
    }
    if (prompt) await vscode.env.clipboard.writeText(prompt);
    vscode.window.showInformationMessage("已复制提问内容。当前宿主没有可用的新对话命令，请自行粘贴到聊天。");
  }
}

const flushTimers = new Map();
const pending = new Map();

function queueSidecarWrite(canvasPath, key, value) {
  const current = pending.get(canvasPath) || readSidecar(canvasPath);
  current[key] = value;
  pending.set(canvasPath, current);
  if (flushTimers.has(canvasPath)) clearTimeout(flushTimers.get(canvasPath));
  flushTimers.set(
    canvasPath,
    setTimeout(() => {
      writeSidecar(canvasPath, pending.get(canvasPath) || {});
      flushTimers.delete(canvasPath);
    }, 150)
  );
}

module.exports = {
  sidecarPath,
  readSidecar,
  writeSidecar,
  handleCanvasAction,
  queueSidecarWrite,
};
