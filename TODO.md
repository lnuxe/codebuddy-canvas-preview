# TODO

## 在线协作链接

当前分享路径是**导出单文件 HTML**（浏览器打开 / 静态托管），不需要自建服务。

未做、先记着：

- 多人同时看 / 同时改同一份预览
- 带权限的在线短链（登录、过期、只读 vs 可写）
- 需要单独的服务端：WebSocket 和/或对象存储 + 鉴权

这层默认不做。等明确要上协作再开。

## 已完成（近期）

- [x] 公开 UI / 图表视觉对齐
- [x] 工作区主题叠加（编辑器背景 / 强调色）
- [x] `useCanvasState` 写入旁路 `*.canvas.data.json`
- [x] `useCanvasAction`：`openFile` / `openAgent` / `newComposerChat`
- [x] `DiffView` 按 path/language 做行内语法着色
- [x] `Text` 解析 `` `code` `` 和 `[链接](url)`
- [x] Callout 12px / 300 viewBox 图标
- [x] `cursor/canvas` 类型声明 + 保存/编辑时 Problems 诊断
- [x] 导出 / 复制可分享 HTML
