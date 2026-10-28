# link-easy 链接收集

一款 iOS 风格的浏览器插件（Chrome / Edge 等 Chromium 内核，Manifest V3），一键识别当前页面中的**六大类资源链接**，通过可拖拽、可缩放的悬浮窗分类展示，并支持一键复制。

技术栈：**TypeScript + Vite** 构建，UI 通过 **Shadow DOM** 注入（与页面样式完全隔离，不受目标页面 CSS 影响），设计语言参考 iPhone（毛玻璃、分段控制器、圆角胶囊按钮）。

---

## 一、功能特性

### 1. 悬浮按钮

- 页面右侧悬浮一个蓝色渐变圆形按钮（el-icon-link 链条图标），始终位于页面最顶层；
- **拖拽**：按住按钮可拖到页面任意位置，自动限制在视口范围内，位置自动记忆（刷新后保持）；
- **点击识别**：单击按钮（拖动距离小于 5px 判定为点击）开始扫描页面，识别中图标旋转提示。

### 2. 六大类链接识别

| 分类 | 识别来源 |
| ---- | -------- |
| 图片资源 | `img[src]` / `img[srcset]` / `picture > source` / `svg image`（含 href 与 xlink:href）/ 内联样式与 `<style>` 中的 `url(...)` 背景图 |
| 音频资源 | `audio[src]`、`audio > source[src]` |
| 视频资源 | `video[src]`、`video > source[src]`（按 type/扩展名自动归类） |
| 嵌入页面 | `iframe[src]` / `frame[src]`、HTML 类型的 `object[data]` |
| 脚本资源 | `script[src]` |
| 样式资源 | `link[rel=stylesheet][href]` |

识别规则：

- 仅保留 **http/https** 协议的链接，相对路径自动解析为绝对路径；
- 结果自动**去重**；每个分类在 tab 上实时显示数量。

### 3. 悬浮窗（识别完毕后自动弹出）

- 默认宽高为**屏幕的一半**，居中显示，带 iOS 弹入动画；
- **移动**：按住头部拖拽（红点关闭按钮除外）；
- **缩放**：拖拽右下角蓝色斜线手柄调整宽高（最小 360×240，最大为屏幕的 90%），手柄悬停高亮；
- **关闭**：点击红点（×）关闭悬浮窗，之后可再次点击悬浮按钮重新识别；
- **Tab 切换**：6 个分类的分段控制器（Segmented Control），点击切换列表；
- **搜索框**：分类下方、列表上方有搜索框，支持**模糊检索、忽略大小写**（空格分隔多个关键词需全部命中），命中的字段以黄色高亮标记，状态栏实时显示匹配数；
- **列表**：左侧显示链接（超长自动省略号，悬停看全文，点击新标签打开），右侧「下载」「复制」按钮；
- **下载按钮**：除「嵌入页面」外的所有分类，每条链接附带绿色「下载」按钮，点击通过 `chrome.downloads` API 保存该资源；
- **图片预览**：图片资源 tab 下每条链接左侧显示 40×32 缩略图（懒加载、`no-referrer` 防跨域泄露，加载失败显示「失效」占位）；
- **虚拟列表**：所有分类的列表均采用虚拟滚动（固定行高、仅渲染可视区域 ± 8 行），数千条链接也保持流畅；
- **一键复制**：点击「复制」写入剪贴板，底部弹出 iOS 风格 Toast「已复制到剪贴板」；
- **空状态**：某分类无链接时显示放大镜图标与提示文案。

---

## 二、安装使用

### 安装步骤（加载已解压的扩展程序）

```bash
npm install    # 安装依赖
npm run build  # 构建到 dist/
```

1. 打开 Chrome，访问 `chrome://extensions/`；
2. 右上角开启「开发者模式」；
3. 点击「加载已解压的扩展程序」，选择本项目的 **`dist` 目录**；
4. 打开任意网页，页面右侧即可看到蓝色悬浮按钮。

> 说明：Chrome 已禁止拖拽安装商店外的 crx 文件，因此采用「加载已解压」方式安装；插件仅需 `downloads` 权限用于保存资源文件，所有识别均在页面本地完成。

### 日常操作

| 想做什么 | 怎么操作 |
| -------- | -------- |
| 识别页面链接 | 单击悬浮按钮，识别完成后自动弹出悬浮窗 |
| 查看某类链接 | 点击悬浮窗顶部分段控制器的对应 tab |
| 搜索链接 | 在搜索框输入关键词（忽略大小写、支持多关键词），命中部分黄色高亮 |
| 复制链接 | 点击条目右侧「复制」按钮 |
| 下载资源 | 点击条目右侧「下载」按钮（嵌入页面分类除外） |
| 打开链接 | 点击列表中的链接文本（新标签页打开） |
| 移动悬浮窗 | 按住头部拖动 |
| 调整悬浮窗大小 | 拖动右下角手柄 |
| 关闭悬浮窗 | 点击红点（×） |
| 移动悬浮按钮 | 按住按钮拖动，位置自动记忆 |

---

## 三、开发与调试

### 常用命令

```bash
npm run dev        # 监听 src/ 变更，自动构建到 dist/（推荐开发时挂后台）
npm run build      # 一次性完整构建（先生成图标，再打包内容脚本）
npm run icons      # 仅重新生成插件图标（assets/icon.svg → 16/32/48/128 PNG）
npm run typecheck  # TypeScript 类型检查（不产出文件）
```

### 调试流程

1. 启动 `npm run dev`（或每次改完代码手动 `npm run build`）；
2. 回到 `chrome://extensions/`，点击插件卡片上的「重新加载」↻ 按钮；
3. 刷新目标网页（`Ctrl+R`）使新的内容脚本注入；
4. 在目标页面按 `F12` 打开 DevTools：
   - **Console**：悬浮按钮与悬浮窗的日志/报错会出现在页面控制台；
   - **Elements**：插件 UI 位于 `<div id="link-easy-host">` 内的 Shadow Root 中，可在其中直接审查/临时修改样式；
5. 若插件行为异常，可先在扩展页点击「移除」后重新「加载已解压的扩展程序」排除缓存问题。

### 项目结构

```
link-easy/
├── manifest.json          # Chrome 插件清单（MV3：内容脚本、background、downloads 权限、图标）
├── package.json           # 依赖与 npm 脚本（build / dev / icons / typecheck）
├── tsconfig.json          # TypeScript 配置（strict 模式）
├── scripts/
│   ├── build.mjs          # 构建脚本：分别打包 content 与 background 为 IIFE，并拷贝 manifest/图标
│   └── gen-icons.mjs      # 图标生成脚本（@resvg/resvg-js 渲染 SVG → PNG）
├── assets/
│   ├── icon.svg           # 图标源文件（iOS 渐变圆角底 + el-icon-link 图形）
│   └── icon-{16,32,48,128}.png  # 各尺寸插件图标
├── src/
│   ├── content.ts         # 内容脚本：链接识别、搜索高亮、虚拟列表、悬浮窗交互
│   ├── background.ts      # Service Worker：调用 chrome.downloads 实现下载
│   └── style.ts           # iOS 风格样式（字符串形式注入 Shadow DOM）
├── dist/                  # 构建产物（即「加载已解压扩展」的目录）
│   ├── manifest.json
│   ├── link-easy.content.js
│   ├── background.js
│   └── assets/            # 插件图标
└── README.md              # 本文档
```

### 实现要点（二次开发参考）

- **入口**：`src/content.ts` 是内容脚本主逻辑，构建为 IIFE 格式的 `dist/link-easy.content.js`，在 `document_idle` 时机注入所有页面（`<all_urls>`），通过 `#link-easy-host` 宿主元素 + `attachShadow` 防止重复注入；
- **双入口构建**：`scripts/build.mjs` 用 Vite JS API 分两次打包（content 与 background 各自为独立 IIFE），避免 IIFE 不支持多入口代码分割的限制；dev 模式加 `--watch` 参数监听变更；
- **样式**：`src/style.ts` 导出 CSS 字符串，在 Shadow DOM 内生效——修改 UI 外观只需改这里，无需处理与页面样式的冲突；
- **识别逻辑**：`scanLinks()` 集中在 `content.ts` 中，按分类查询 DOM 并过滤 http/https，如需新增分类，在 `CATS` 数组和 `scanLinks()` 中同步扩展即可；
- **搜索高亮**：`matchLinks()` 做忽略大小写的关键词过滤，`findRanges()` + `buildHighlighted()` 计算并渲染命中区间；
- **虚拟列表**：`renderVisibleRows()` 只渲染可视区 ± 8 行，行高固定 50px（`ROW_H`），改动行内容时注意保持高度一致；
- **下载**：内容脚本发消息给 `src/background.ts`，由后者调用 `chrome.downloads.download`（需 `downloads` 权限）；后台不可用时降级为 `<a download>` 方式；
- **图标**：改 `assets/icon.svg` 后运行 `npm run icons` 重新生成 PNG。

---

## 四、常见问题

**Q：识别不到某些链接？**
插件只扫描 DOM 中的静态资源标签（img/audio/video/iframe/script/link 及背景图）。由 JS 动态创建且扫描时尚未插入 DOM 的元素不会被统计，等页面加载完成后可再点一次悬浮按钮重新识别。

**Q：图片缩略图显示「失效」？**
目标图片服务器禁止外站直接加载（防盗链）或链接已失效。链接本身仍可复制和打开。

**Q：悬浮窗被页面遮挡？**
插件 UI 位于 Shadow DOM 且 z-index 取最大值（2147483647），正常情况始终在最上层；个别页面使用同样超大 z-index 时，可关闭悬浮窗换个页面再试。

**Q：为什么有些分类是 0 条？**
当前页面确实不存在该类资源，属正常现象。

**Q：点击「下载」没反应？**
下载通过 `chrome.downloads` API 完成，需确认安装的是重新构建后的版本（manifest 含 `downloads` 权限与 `background.js`）。个别服务器拒绝直接下载时，浏览器会改为打开资源页。

**Q：每次改完代码页面没变化？**
内容脚本在页面加载时注入，需完整执行三步：重新构建 → 扩展页「重新加载」→ 刷新目标网页。
