# Canvas 预览

CodeBuddy CN / VS Code 扩展：在**左侧边栏**预览 `.canvas.tsx`。

## 安装

1. 打包：`npx @vscode/vsce package --allow-missing-repository`
2. CodeBuddy CN：扩展面板 → `…` → 从 VSIX 安装
3. 或命令行：

```bash
"/Applications/CodeBuddy CN.app/Contents/Resources/app/bin/code" --install-extension canvas-preview-0.1.2.vsix
```

安装后执行 **重新加载窗口**。

## 用法

- 左侧活动栏点 **Canvas 预览**
- 在 **Canvas 文件** 列表里点文件
- 或 `Cmd+Option+C` / 命令面板搜「在侧边栏打开 Canvas 预览」

新文件建议写到：

- `{工作区}/canvases/<name>.canvas.tsx`
- 或 `~/.codebuddy/canvases/`

`.canvas.tsx` 默认导出一个 React 组件，并从 canvas SDK 导入 UI 原语。本扩展提供兼容运行时。

## 开发

```bash
npm install
```

修改 `extension.js` 后重载窗口即可。
