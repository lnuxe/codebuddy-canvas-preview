# TODO

## 在线协作链接

当前分享路径是**导出单文件 HTML**（浏览器打开 / 静态托管），不需要自建服务。

未做、先记着：

- 多人同时看 / 同时改同一份预览
- 带权限的在线短链（登录、过期、只读 vs 可写）
- 需要单独的服务端：WebSocket 和/或对象存储 + 鉴权

这层默认不做。等明确要上协作再开。

## SDK 尚未对齐

公开组件面（Stack / Card / 图表 / Table / 表单 / Todo / Diff 骨架）已经按 SDK 声明实现。还差的是宿主协议和编译期能力，不是缺某个 `export`：

- **工作区主题叠加**：未接 `applyPrimaryColor` / `applyWorkbenchSurfaces`。现在只有 dark/light，不会跟编辑器强调色、编辑器背景走
- **`useCanvasState`**：只存在内存 Map，刷新/重载会丢；没有 `.canvas.data.json` 旁路持久化
- **`useCanvasAction`**：空操作。SDK 的 `openAgent` / `openFile` / `newComposerChat` 需要宿主转发
- **`DiffView` 高亮**：`path` / `language` 只当注释，没有按扩展名做语法着色
- **`Text` 内联 markdown**：文档写了 `` `code` `` 和 `[链接](url)` 会自动解析，那是编译期变换；esbuild 原样当字符串
- **Callout 图标**：用了简化 12px SVG，不是 toast 那套 300 viewBox 字形
- **作者侧类型**：没有随扩展提供 `cursor/canvas` 的 `.d.ts`，写 canvas 时要靠运行时试错
- **类型检查**：没有 Cursor 那种保存即 `Canvas TypeScript check`

## 已完成（近期）

- [x] 公开 UI / 图表视觉对齐（token、间距、卡片 chrome、nice scale、tooltip）
- [x] 导出 / 复制可分享 HTML
- [x] 柱状 / 折线 / 饼图 + DAG + Diff 骨架
