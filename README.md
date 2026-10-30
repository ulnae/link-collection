# Link Collection

一款 iOS 风格的浏览器插件（Chrome / Edge 等 Chromium 内核，Manifest V3），一键识别当前页面中的**资源链接**，通过可拖拽、可缩放的悬浮窗分类展示，并支持搜索、下载与一键复制。

技术栈：**TypeScript + Vite** 构建，UI 通过 **Shadow DOM** 注入（与页面样式完全隔离，不受目标页面 CSS 影响），设计语言参考 iPhone（毛玻璃、分段控制器、圆角胶囊按钮）。

---

## 功能特性

### 1. 悬浮按钮

- 页面右侧悬浮一个蓝色渐变圆形按钮（链条图标），始终位于页面最顶层；
- **拖拽**：按住按钮可拖到页面任意位置，自动限制在视口范围内，位置自动记忆（刷新后保持）；
- **点击识别**：单击按钮（拖动距离小于 5px 判定为点击）开始扫描页面，识别中图标旋转提示。

### 2. 链接识别

| 分类 | 识别来源 |
| ---- | -------- |
| 图片资源 | `img[src]` / `img[srcset]` / `picture > source` / `svg image`（含 href 与 xlink:href）/ CSS 背景图中图片类型 url()（按扩展名 png/jpg/gif/webp/svg/avif/bmp/ico 判定） |
| 音频资源 | `audio[src]`、`audio > source[src]` |
| 视频资源 | `video[src]`、`video > source[src]`（按 type/扩展名自动归类） |
| 嵌入页面 | `iframe[src]` / `frame[src]`、HTML 类型的 `object[data]` |
| 脚本资源 | `script[src]`、`link[rel=modulepreload]`、`link[rel=preload][as=script]` |
| 样式资源 | `link[rel=stylesheet]`、`link[rel=preload][as=style]`、CSS `@import` |
| 字体资源 | CSS `@font-face` 的 src url()（含内联样式与同源外链 CSS）、`link[rel=preload][as=font]`、CSS url() 中 woff/woff2/ttf/otf/eot 类型 |

识别规则：

- **扫描范围**：除主文档外，还会**递归扫描同源 iframe**（编辑器、弹窗等 iframe 内的资源同样被识别）与**开放的 Shadow DOM**，跨域 iframe 因浏览器安全限制无法读取；
- 仅保留 **http/https** 协议的链接，相对路径以所在文档的 `baseURI`（尊重 `<base href>`）自动解析为绝对路径；空 src、纯锚点（`#`）等无效引用会被排除；
- 结果自动**去重**；每个分类在 tab 上实时显示数量；
- 样式表通过 CSSOM 解析（`@font-face` / `@import` / `background-image`），CSS 内的相对 url() 以该样式表自身地址为基准解析，跨域外链 CSS 因权限限制无法读取其内部规则；
- 七个分类 tab 在悬浮窗较窄时横向滑动（无滚动条），当前选中项自动居中显示。

### 3. 悬浮窗（识别完毕后自动弹出）

- 默认宽高为**屏幕的一半**，居中显示，带 iOS 弹入动画；
- **移动**：按住头部拖拽（关闭按钮除外）；
- **缩放**：拖拽右下角手柄调整宽高（最小 360×240，最大为屏幕的 90%），手柄悬停高亮；
- **Tab 切换**：7 个分类的分段控制器（Segmented Control），每个 tab 显示该类链接数量，点击切换列表；窗口较窄时 tab 条横向滑动且不显示滚动条，选中项自动居中；
- **搜索框**：分类下方、列表上方有搜索框，支持**模糊检索、忽略大小写**（空格分隔多个关键词需全部命中），命中的字段以黄色高亮标记，检索时搜索框右侧实时显示「匹配数/总数」徽章；
- **列表**：左侧显示链接（超长自动省略号，悬停看全文，点击新标签打开），右侧「下载」「复制」按钮；
- **下载按钮**：除「嵌入页面」外的所有分类（含字体资源），每条链接附带绿色「下载」按钮，点击通过 `chrome.downloads` API 保存该资源；
- **内嵌播放器**：视频/音频 tab 的每条链接附带紫色「播放」按钮，点击展开对应播放器（视频为 16:9 圆角卡片、音频为胶囊形播放条），按钮变为红色「关闭」，点击收起播放器并暂停播放；播放器均设置 `preload="none"`，首次点击播放才发起网络请求；
- **图片预览**：图片资源 tab 下每条链接左侧显示缩略图，采用**按需懒加载**——通过 IntersectionObserver 监听，缩略图进入列表可视区（含 300px 预取边距）才发起请求，且只加载一次；`no-referrer` 防跨域泄露，加载失败显示「失效」占位；
- **列表渲染**：列表为**全量渲染**（`renderList()` 一次性构建所有行），配合图片懒加载按需请求，常规页面流畅无压力；
- **一键复制**：点击「复制」写入剪贴板，底部弹出 iOS 风格 Toast「已复制到剪贴板」；
- **空状态**：某分类无链接时显示放大镜图标与提示文案。

---

## 安装使用

### 方式一：下载 Release 压缩包（推荐，普通用户）

无需安装 Node.js，也不用自己构建：

1. 打开本仓库的 GitHub **Releases** 页面（`https://github.com/ulnae/link-easy/releases`）；
2. 在最新 Release 的 **Assets** 中下载 `link-collection-vX.X.X.zip`；
3. **解压** zip 到任意位置，解压后得到的文件夹内应直接包含 `manifest.json`、`content.js`、`background.js`、`assets/`（不要多套一层目录）；
4. 打开 Chrome（或 Edge 等 Chromium 内核浏览器），地址栏访问 `chrome://extensions/`（Edge 为 `edge://extensions/`）；
5. 右上角开启「**开发者模式**」；
6. 点击「**加载已解压的扩展程序**」（Edge 为「加载解压缩的扩展」），选择**第 3 步解压出来的文件夹**；
7. 打开任意网页，页面右侧即可看到蓝色悬浮按钮，安装完成。

> 说明：Chrome 已禁止拖拽安装商店外的 crx 文件，因此采用「加载已解压」方式安装；插件仅需 `downloads` 权限用于保存资源文件，所有识别均在页面本地完成。
>
> 注意：扩展加载的是解压后的目录，请**保留该文件夹**不要删除或移动，否则扩展会失效；浏览器更新扩展时也直接读取该目录。

### 方式二：本地构建（开发者）

```bash
npm install    # 安装依赖
npm run build  # 构建到 dist/
```

1. 打开 Chrome，访问 `chrome://extensions/`；
2. 右上角开启「开发者模式」；
3. 点击「加载已解压的扩展程序」，选择本项目的 **`dist` 目录**；
4. 打开任意网页，页面右侧即可看到蓝色悬浮按钮。

### 日常操作

| 想做什么 | 怎么操作 |
| -------- | -------- |
| 识别页面链接 | 单击悬浮按钮，识别完成后自动弹出悬浮窗 |
| 查看某类链接 | 点击悬浮窗顶部分段控制器的对应 tab |
| 搜索链接 | 在搜索框输入关键词（忽略大小写、支持多关键词），命中部分黄色高亮 |
| 复制链接 | 点击条目右侧「复制」按钮 |
| 下载资源 | 点击条目右侧「下载」按钮（嵌入页面分类除外） |
| 打开链接 | 点击列表中的链接文本（新标签页打开） |
| 播放音视频 | 点击条目右侧「播放」按钮，再次点击收起 |
| 移动悬浮窗 | 按住头部拖动 |
| 调整悬浮窗大小 | 拖动右下角手柄 |
| 关闭悬浮窗 | 点击头部右侧圆形关闭按钮（×） |
| 移动悬浮按钮 | 按住按钮拖动，位置自动记忆 |

---

## 开发与调试

### 常用命令

```bash
npm run dev        # 监听 src/ 变更，自动构建到 dist/（推荐开发时挂后台）
npm run build      # 一次性完整构建（先生成图标，再打包内容脚本）
npm run icons      # 仅重新生成插件图标（assets/icon.svg → 16/32/48/128 PNG）
npm run pack       # 构建 + 压缩为 link-collection-v{version}.zip（本地模拟发版产物）
npm run typecheck  # TypeScript 类型检查（不产出文件）
```

### 发版流程（tag → 自动 Release）

推送 `v` 开头的标签即可，GitHub Actions 会自动完成：版本号校验 → 安装依赖 → 类型检查 → 构建 → 压缩为 zip → 创建 GitHub Release 并上传压缩包（工作流见 `.github/workflows/release.yml`）。

#### 一键发版（推荐）

```bash
npm run release            # patch 发版：1.0.0 → 1.0.1
npm run release -- minor   # minor 发版：1.0.0 → 1.1.0
npm run release -- major   # major 发版：1.0.0 → 2.0.0
npm run release -- 1.2.3   # 指定精确版本号
```

脚本会自动完成：检查工作区干净 → 同步 `package.json` 与 `manifest.json` 两处版本号 → 提交 `release: vX.X.X` → 打标签 `vX.X.X` → 推送代码与标签触发自动发版。

#### 手动打标签

若不想用脚本，先手动把 `package.json` 与 `manifest.json` 的 `version` 改成一致并提交，然后：

```bash
git tag v1.0.1             # 创建标签（当前提交）
git push origin v1.0.1     # 推送标签，Actions 随即开始构建并发布 Release
git push                   # 如果本地还有未推送的提交，一并推送
```

构建完成后，在仓库的 **Actions** 页可查看构建进度；成功后在 **Releases** 页即可看到带 `link-collection-vX.X.X.zip` 附件的 Release，用户下载 zip 解压安装即可（见上文「方式一」）。

> 也可以在发版前本地执行 `npm run pack` 验证：会在项目根目录生成与 CI 产物一致的 zip（已加入 `.gitignore`，不会误提交）。

### 调试流程

1. 启动 `npm run dev`（或每次改完代码手动 `npm run build`）；
2. 回到 `chrome://extensions/`，点击插件卡片上的「重新加载」↻ 按钮；
3. 刷新目标网页（`Ctrl+R`）使新的内容脚本注入；
4. 在目标页面按 `F12` 打开 DevTools：
   - **Console**：悬浮按钮与悬浮窗的日志/报错会出现在页面控制台；
   - **Elements**：插件 UI 位于 `<div id="link-collection-host">` 内的 Shadow Root 中，可在其中直接审查/临时修改样式；
5. 若插件行为异常，可先在扩展页点击「移除」后重新「加载已解压的扩展程序」排除缓存问题。

### 项目结构

```
link-easy/
├── .github/
│   └── workflows/
│       └── release.yml    # 发版工作流：推送 v* 标签 → 构建 → 打包 zip → 自动创建 Release
├── manifest.json          # Chrome 插件清单（MV3：内容脚本、background、downloads 权限、图标）
├── package.json           # 依赖与 npm 脚本（build / dev / icons / pack / release / typecheck）
├── tsconfig.json          # TypeScript 配置（strict 模式）
├── scripts/
│   ├── build.mjs          # 构建脚本：分别打包 content 与 background 为 IIFE，并拷贝 manifest/图标
│   ├── gen-icons.mjs      # 图标生成脚本（@resvg/resvg-js 渲染 SVG → PNG）
│   ├── pack.mjs           # 本地打包脚本：构建 + 压缩 dist/ 为 zip（与 CI 产物一致）
│   └── release.mjs        # 一键发版脚本：同步版本号 → 提交 → 打 v* 标签 → 推送触发 CI
├── assets/
│   ├── icon.svg           # 图标源文件（iOS 渐变圆角底 + 链条图形）
│   └── icon-{16,32,48,128}.png  # 各尺寸插件图标
├── src/
│   ├── content.ts         # 内容脚本（约 940 行）：链接识别、搜索高亮、图片懒加载、悬浮窗交互
│   ├── background.ts      # Service Worker：调用 chrome.downloads 实现下载
│   └── style.ts           # iOS 风格样式（字符串形式注入 Shadow DOM）
├── dist/                  # 构建产物（即「加载已解压扩展」的目录）
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   └── assets/            # 插件图标
└── README.md              # 本文档
```

### 实现要点（二次开发参考）

- **入口**：`src/content.ts` 是内容脚本主逻辑，构建为 IIFE 格式的 `dist/content.js`，在 `document_idle` 时机注入所有页面（`<all_urls>`），通过 `#link-collection-host` 宿主元素 + `attachShadow` 防止重复注入；
- **双入口构建**：`scripts/build.mjs` 用 Vite JS API 分两次打包（content 与 background 各自为独立 IIFE），避免 IIFE 不支持多入口代码分割的限制；dev 模式加 `--watch` 参数监听变更；
- **样式**：`src/style.ts` 导出 CSS 字符串，在 Shadow DOM 内生效——修改 UI 外观只需改这里，无需处理与页面样式的冲突；
- **识别逻辑**：`collectScanRoots()` 递归收集主文档、同源 iframe 文档与开放的 Shadow Root，`scanRoot()` 对每个根按分类查询元素并解析 http/https；如需新增分类，在 `CATS` 数组和 `scanRoot()` 中同步扩展即可；
- **搜索高亮**：`matchLinks()` 做忽略大小写的关键词过滤，`findRanges()` + `buildHighlighted()` 计算并渲染命中区间；
- **图片懒加载**：`setupLazyImages()` 用 IntersectionObserver（root 为列表容器，rootMargin 300px）按需设置缩略图 src，`unobserve` 保证每张图只加载一次；
- **列表渲染**：`renderList()` 对当前分类（经搜索过滤后）的链接做全量渲染，未做虚拟滚动；如需应对超长列表可自行改造；
- **媒体行**：视频/音频行默认为普通单行（含「播放」按钮），展开后通过 `data-open="true"` 切换为纵向卡片；播放器首次展开时才创建；
- **下载**：内容脚本发消息给 `src/background.ts`，由后者调用 `chrome.downloads.download`（需 `downloads` 权限）；后台不可用时降级为 `<a download>` 方式；
- **图标**：改 `assets/icon.svg` 后运行 `npm run icons` 重新生成 PNG。

---

## 常见问题

**Q：识别不到某些链接？**
插件扫描 DOM 中的静态资源标签（img/audio/video/iframe/script/link 及背景图），并会递归扫描同源 iframe 与开放的 Shadow DOM。仍识别不到的情况：资源位于**跨域 iframe** 内（浏览器安全限制无法读取）；或元素由 JS 动态创建且扫描时尚未插入 DOM，等页面加载完成后可再点一次悬浮按钮重新识别。

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
