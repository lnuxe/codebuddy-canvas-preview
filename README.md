# Canvas 预览

CodeBuddy CN / VS Code 扩展：在**左侧边栏**预览 `.canvas.tsx`，包含布局、表格、图表（柱状 / 折线 / 饼图）、DAG 布局和 diff。

这是一份独立的开源运行时，按公开 canvas SDK 表面实现，不是某款闭源 IDE 编译器的搬运。

## 安装

1. 从 [Releases](https://github.com/lnuxe/codebuddy-canvas-preview/releases) 下载 `canvas-preview-*.vsix`
2. CodeBuddy CN：扩展面板 → `…` → 从 VSIX 安装
3. 或命令行：

```bash
"/Applications/CodeBuddy CN.app/Contents/Resources/app/bin/code" --install-extension canvas-preview-0.2.0.vsix
```

安装后执行 **重新加载窗口**。本地打包：`npm install && npx @vscode/vsce package`

## 用法

- 左侧活动栏点 **Canvas 预览**
- 在 **Canvas 文件** 列表里点文件
- `Cmd+Option+C`
- 图表示例：`examples/charts.canvas.tsx`

新文件建议写到 `{工作区}/canvases/` 或 `~/.codebuddy/canvases/`。

## 共享（不需要自建服务器）

命令面板：

- **导出可分享 HTML**：生成单文件，用浏览器打开，或放到 GitHub Pages / COS / 任意静态托管
- **复制可分享 HTML**：贴进仓库或文档

多人同时编辑同一份预览、带权限的在线链接，才需要单独的服务端（WebSocket 或对象存储 + 鉴权）。本仓库默认不做那一层。

## 开发

```bash
npm install
```

修改 `runtime/canvas-sdk.jsx` 或 `extension.js` 后重载窗口。
