import { CSS } from './style';

/* ============================================================
 * Link Collection 内容脚本
 * 悬浮按钮 + 链接识别 + iOS 风格悬浮窗
 * ============================================================ */

type CatKey =
  | 'image'
  | 'audio'
  | 'video'
  | 'iframe'
  | 'script'
  | 'css'
  | 'font';

interface CatDef {
  key: CatKey;
  label: string;
}

const CATS: CatDef[] = [
  { key: 'image', label: '图片' },
  { key: 'audio', label: '音频' },
  { key: 'video', label: '视频' },
  { key: 'iframe', label: '内联' },
  { key: 'script', label: '脚本' },
  { key: 'css', label: '样式' },
  { key: 'font', label: '字体' }
];

/** CSS url() 资源按扩展名归类 */
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)([?#]|$)/i;
const FONT_EXT_RE = /\.(woff2?|ttf|otf|eot)([?#]|$)/i;

/** 图片懒加载预取边距：距离可视区 300px 内即开始加载（仅一次） */
const LAZY_ROOT_MARGIN = '300px';

const HOST_ID = 'link-collection-host';
const FAB_POS_KEY = 'link-collection:fab-pos';
const FAB_SIZE = 54;

/** 悬浮窗最小宽度（与 .lc-panel 的 min-width 保持一致） */
const MIN_PANEL_W = 320;

/** Element UI el-icon-link 图形（与插件图标一致） */
const ICON_LINK = `<svg viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill="#fff" d="M715.648 625.152 670.4 579.904l90.496-90.56c75.008-74.944 85.12-186.368 22.656-248.896-62.528-62.464-173.952-52.352-248.96 22.656L444.16 353.6l-45.248-45.248 90.496-90.496c100.032-99.968 251.968-110.08 339.456-22.656 87.488 87.488 77.312 239.424-22.656 339.456l-90.496 90.496zm-90.496 90.496-90.496 90.496C434.624 906.112 282.688 916.224 195.2 828.8c-87.488-87.488-77.312-239.424 22.656-339.456l90.496-90.496 45.248 45.248-90.496 90.56c-75.008 74.944-85.12 186.368-22.656 248.896 62.528 62.464 173.952 52.352 248.96-22.656l90.496-90.496zm0-362.048 45.248 45.248L398.848 670.4 353.6 625.152z"/>
</svg>`;

const ICON_EMPTY = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="11" cy="11" r="7" stroke="#8e8e93" stroke-width="2"/>
  <path d="M16.5 16.5 21 21" stroke="#8e8e93" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const ICON_CLOSE = `<svg viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6"/></svg>`;
const ICON_RESIZE = `<svg class="lc-resize-icon" viewBox="0 0 14 14">
  <path d="M12.5 5.5 5.5 12.5M12.5 9.5 9.5 12.5M12.5 1.5 1.5 12.5"/>
</svg>`;

/** 页面内只注入一次 */
if (!document.getElementById(HOST_ID)) {
  const boot = () => init();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}

function init(): void {
  /* ---------- Shadow DOM 宿主 ---------- */
  const host = document.createElement('div');
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  shadow.appendChild(styleEl);

  document.documentElement.appendChild(host);

  /* ---------- 状态 ---------- */
  let panel: HTMLDivElement | null = null;
  let listEl: HTMLDivElement | null = null; // 滚动视口
  let matchEl: HTMLSpanElement | null = null; // 搜索框内的匹配数徽章
  let countEl: HTMLSpanElement | null = null;
  let linkMap: Record<CatKey, string[]> = createEmptyMap();
  let activeTab: CatKey = 'image';
  let searchQuery = '';
  let filteredLinks: string[] = [];
  let lazyObserver: IntersectionObserver | null = null;

  /* ---------- 工具函数 ---------- */
  function createEmptyMap(): Record<CatKey, string[]> {
    return {
      image: [],
      audio: [],
      video: [],
      iframe: [],
      script: [],
      css: [],
      font: []
    };
  }

  /** 仅保留 http/https 绝对链接（排除空值、纯锚点等无效引用）
   *  base 为解析基准：默认主页面地址，iframe/Shadow DOM 内使用其文档自身的 baseURI */
  function toHttpUrl(
    raw: string | null | undefined,
    base: string = location.href
  ): string | null {
    if (!raw || !raw.trim()) return null;
    if (raw.trimStart().startsWith('#')) return null;
    try {
      const u = new URL(raw, base);
      return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
    } catch {
      return null;
    }
  }

  function parseSrcset(srcset: string): string[] {
    return srcset
      .split(',')
      .map((part) => part.trim().split(/\s+/)[0])
      .filter(Boolean);
  }

  function dedupe(arr: string[]): string[] {
    return Array.from(new Set(arr));
  }

  /* ---------- 链接识别 ---------- */

  /** 从 CSS 文本中提取所有 url(...) 引用 */
  function extractUrls(cssText: string): string[] {
    const out: string[] = [];
    const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(cssText))) out.push(m[2]);
    return out;
  }

  /** 递归收集扫描根：主文档、同源 iframe 文档、开放的 Shadow Root。
   *  诸如禅道等系统会把编辑器/弹窗渲染在 iframe 或 Shadow DOM 中，
   *  仅扫描主文档会漏掉其中的资源；跨域 iframe 无权访问，自动跳过。 */
  function collectScanRoots(): (Document | ShadowRoot)[] {
    const roots: (Document | ShadowRoot)[] = [];
    const seenDocs = new Set<Document>();
    const seenShadows = new Set<ShadowRoot>();

    const pushDoc = (doc: Document | null) => {
      if (!doc || !doc.body || seenDocs.has(doc)) return;
      seenDocs.add(doc);
      roots.push(doc);
      doc.querySelectorAll('iframe, frame').forEach((f) => {
        try {
          pushDoc((f as HTMLIFrameElement).contentDocument);
        } catch {
          /* 跨域 iframe 无法访问 contentDocument */
        }
      });
    };

    const pushShadows = (root: Document | ShadowRoot) => {
      root.querySelectorAll('*').forEach((el) => {
        const sr = el.shadowRoot;
        if (!sr || seenShadows.has(sr)) return;
        seenShadows.add(sr);
        roots.push(sr);
        sr.querySelectorAll('iframe, frame').forEach((f) => {
          try {
            pushDoc((f as HTMLIFrameElement).contentDocument);
          } catch {
            /* 跨域 iframe */
          }
        });
        pushShadows(sr);
      });
    };

    pushDoc(document);
    seenDocs.forEach((d) => pushShadows(d));
    return roots;
  }

  /** 扫描单个根（Document 或 ShadowRoot）内的资源元素，结果写入 result */
  function scanRoot(
    root: Document | ShadowRoot,
    result: Record<CatKey, string[]>
  ): void {
    // 相对路径以所在文档的 baseURI 为解析基准（尊重 <base href>）
    const base =
      root instanceof Document
        ? root.baseURI || location.href
        : root.host?.ownerDocument?.baseURI || location.href;
    const push = (key: CatKey, raw: string | null) => {
      const url = toHttpUrl(raw, base);
      if (url) result[key].push(url);
    };

    /** CSS url() 资源按扩展名归类：字体 → font，图片 → image，其余忽略 */
    const pushCssUrl = (raw: string) => {
      const url = toHttpUrl(raw, base);
      if (!url) return;
      if (FONT_EXT_RE.test(url)) result.font.push(url);
      else if (IMAGE_EXT_RE.test(url)) result.image.push(url);
    };

    // 图片资源：img / picture > source / srcset / svg image
    root.querySelectorAll('img').forEach((el) => {
      push('image', el.getAttribute('src'));
      const ss = el.getAttribute('srcset');
      if (ss) parseSrcset(ss).forEach((u) => push('image', u));
    });
    root.querySelectorAll('picture source').forEach((el) => {
      push('image', el.getAttribute('src'));
      const ss = el.getAttribute('srcset');
      if (ss) parseSrcset(ss).forEach((u) => push('image', u));
    });
    root.querySelectorAll('svg image').forEach((el) => {
      push('image', el.getAttribute('href') || el.getAttribute('xlink:href'));
    });
    // 内联 style 属性中的 url()（按扩展名归类，字体不再混入图片）
    root.querySelectorAll('[style]').forEach((el) => {
      extractUrls(el.getAttribute('style') || '').forEach(pushCssUrl);
    });

    // 音频资源
    root.querySelectorAll('audio').forEach((el) => {
      push('audio', el.getAttribute('src'));
    });
    root.querySelectorAll('audio source, video source').forEach((el) => {
      const src = toHttpUrl(el.getAttribute('src'), base);
      if (!src) return;
      const type = (el.getAttribute('type') || '').toLowerCase();
      const url = src.toLowerCase();
      const parent = el.parentElement?.tagName.toLowerCase();
      if (parent === 'audio' || type.startsWith('audio') || /\.(mp3|wav|ogg|m4a|aac|flac)([?#]|$)/.test(url)) {
        result.audio.push(src);
      } else if (parent === 'video' || type.startsWith('video') || /\.(mp4|webm|ogv|mov|m4v)([?#]|$)/.test(url)) {
        result.video.push(src);
      }
    });

    // 视频资源
    root.querySelectorAll('video').forEach((el) => {
      push('video', el.getAttribute('src'));
    });

    // 嵌入浏览上下文 / 页面
    root.querySelectorAll('iframe, frame').forEach((el) => {
      push('iframe', el.getAttribute('src'));
    });
    root.querySelectorAll('object[data]').forEach((el) => {
      const d = toHttpUrl(el.getAttribute('data'), base);
      if (d && /\.html?([?#]|$)/i.test(d)) result.iframe.push(d);
    });

    // 脚本资源（补充：modulepreload / preload as=script）
    root.querySelectorAll('script[src]').forEach((el) => {
      push('script', el.getAttribute('src'));
    });
    root
      .querySelectorAll<HTMLLinkElement>(
        'link[rel="modulepreload"][href], link[rel="preload"][as="script"][href]'
      )
      .forEach((el) => {
        push('script', el.getAttribute('href'));
      });

    // 外链样式资源（补充：preload as=style）
    root
      .querySelectorAll<HTMLLinkElement>(
        'link[rel~="stylesheet"][href], link[rel="preload"][as="style"][href]'
      )
      .forEach((el) => {
        push('css', el.getAttribute('href'));
      });

    // 字体资源（补充：preload as=font）
    root
      .querySelectorAll<HTMLLinkElement>(
        'link[rel="preload"][as="font"][href], link[rel="preconnect"][as="font"][href]'
      )
      .forEach((el) => {
        push('font', el.getAttribute('href'));
      });
  }

  function scanLinks(): Record<CatKey, string[]> {
    const result = createEmptyMap();

    for (const root of collectScanRoots()) {
      scanRoot(root, result);

      // 样式表（CSSOM）：background-image、@font-face、@import
      // 仅 Document 有 styleSheets；可覆盖 <style> 标签与同源外链 CSS；
      // 相对引用以该样式表的地址为基准解析（正确处理 CSS 内的相对路径）
      if (root instanceof Document) {
        try {
          for (const sheet of Array.from(root.styleSheets)) {
            let rules: CSSRuleList;
            try {
              rules = sheet.cssRules;
            } catch {
              continue; // 跨域样式表无权读取
            }
            const cssBase = sheet.href || root.baseURI || location.href;
            const pushCssUrl = (raw: string) => {
              const url = toHttpUrl(raw, cssBase);
              if (!url) return;
              if (FONT_EXT_RE.test(url)) result.font.push(url);
              else if (IMAGE_EXT_RE.test(url)) result.image.push(url);
            };
            for (const rule of Array.from(rules)) {
              if (rule instanceof CSSFontFaceRule) {
                extractUrls(rule.style.getPropertyValue('src')).forEach(
                  pushCssUrl
                );
              } else if (rule instanceof CSSImportRule) {
                const url = toHttpUrl(rule.href, cssBase);
                if (url) result.css.push(url);
              } else if (rule instanceof CSSStyleRule) {
                extractUrls(rule.style.backgroundImage || '').forEach(
                  pushCssUrl
                );
              }
            }
          }
        } catch {
          /* 某些环境访问 styleSheets 可能受限，忽略 */
        }
      }
    }

    (Object.keys(result) as CatKey[]).forEach((k) => {
      result[k] = dedupe(result[k]);
    });
    return result;
  }

  /* ---------- 悬浮按钮 (FAB) ---------- */
  const fab = document.createElement('button');
  fab.className = 'lc-fab';
  fab.title = 'Link Collection：识别页面链接';
  fab.innerHTML = ICON_LINK;
  shadow.appendChild(fab);

  // 恢复上次的拖拽位置
  try {
    const saved = localStorage.getItem(FAB_POS_KEY);
    if (saved) {
      const { x, y } = JSON.parse(saved) as { x: number; y: number };
      fab.style.left = `${clamp(x, 0, innerWidth - FAB_SIZE)}px`;
      fab.style.top = `${clamp(y, 0, innerHeight - FAB_SIZE)}px`;
    } else {
      fab.style.left = `${innerWidth - FAB_SIZE - 28}px`;
      fab.style.top = `${Math.max(28, innerHeight / 2 - FAB_SIZE)}px`;
    }
  } catch {
    fab.style.left = 'calc(100vw - 82px)';
    fab.style.top = '45vh';
  }

  function clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
  }

  // 拖拽 + 点击区分
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;

  fab.addEventListener('pointerdown', (e) => {
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    originX = fab.offsetLeft;
    originY = fab.offsetTop;
    fab.setPointerCapture(e.pointerId);
  });
  fab.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && Math.hypot(dx, dy) < 5) return; // 点击阈值
    moved = true;
    fab.style.left = `${clamp(originX + dx, 0, innerWidth - FAB_SIZE)}px`;
    fab.style.top = `${clamp(originY + dy, 0, innerHeight - FAB_SIZE)}px`;
  });
  fab.addEventListener('pointerup', (e) => {
    dragging = false;
    try {
      fab.releasePointerCapture(e.pointerId);
    } catch { /* noop */ }
    if (!moved) {
      onFabClick();
    } else {
      try {
        localStorage.setItem(
          FAB_POS_KEY,
          JSON.stringify({ x: fab.offsetLeft, y: fab.offsetTop })
        );
      } catch { /* noop */ }
    }
  });

  /* ---------- 主流程 ---------- */
  function onFabClick(): void {
    if (panel) {
      // 已有面板：再次点击唤起（保持在原位）
      return;
    }
    fab.classList.add('lc-busy');
    fab.style.pointerEvents = 'none';
    // 让浏览器先渲染 loading 状态
    setTimeout(() => {
      linkMap = scanLinks();
      fab.classList.remove('lc-busy');
      fab.style.pointerEvents = '';
      openPanel();
    }, 60);
  }

  function openPanel(): void {
    const total = (Object.values(linkMap) as string[][]).reduce(
      (s, arr) => s + arr.length,
      0
    );

    const w = Math.min(
      Math.round(innerWidth * 0.9),
      Math.max(MIN_PANEL_W, Math.round(innerWidth / 2))
    );
    const h = Math.round(innerHeight / 2);
    const left = Math.round((innerWidth - w) / 2);
    const top = Math.round((innerHeight - h) / 2);

    panel = document.createElement('div');
    panel.className = 'lc-panel';
    panel.style.width = `${w}px`;
    panel.style.height = `${h}px`;
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;

    // 头部：图标徽章 + 标题 / 总数胶囊 / 关闭按钮
    const header = document.createElement('div');
    header.className = 'lc-header';

    const titleWrap = document.createElement('span');
    titleWrap.className = 'lc-title-wrap';
    const titleIcon = document.createElement('span');
    titleIcon.className = 'lc-title-icon';
    titleIcon.innerHTML = ICON_LINK;
    const title = document.createElement('span');
    title.className = 'lc-title';
    title.textContent = 'Link Collection';
    titleWrap.append(titleIcon, title);

    countEl = document.createElement('span');
    countEl.className = 'lc-count';
    countEl.innerHTML = `共 <b>${total}</b> 条`;

    const btnClose = document.createElement('button');
    btnClose.className = 'lc-close';
    btnClose.title = '关闭';
    btnClose.innerHTML = ICON_CLOSE;
    btnClose.addEventListener('click', () => closePanel());

    header.append(titleWrap, countEl, btnClose);
    panel.appendChild(header);

    // 工具行：左侧 tab 栏（固定宽度，约显示 3 项）+ 右侧搜索框（占满剩余宽度）
    const toolbar = document.createElement('div');
    toolbar.className = 'lc-toolbar';

    // 分段控制器（固定宽度，窄窗口时可横向滑动，选中项自动居中）
    const tabs = document.createElement('div');
    tabs.className = 'lc-tabs';
    CATS.forEach((cat) => {
      const tab = document.createElement('button');
      tab.className = 'lc-tab' + (cat.key === activeTab ? ' lc-active' : '');
      tab.dataset.key = cat.key;
      // 分类名 + 右上角上浮的条数小字（同一行，单行高度）
      const label = document.createElement('span');
      label.className = 'lc-tab-label';
      label.textContent = cat.label;
      const num = document.createElement('span');
      num.className = 'lc-tab-num';
      num.textContent = String(linkMap[cat.key].length);
      tab.append(label, num);
      if (linkMap[cat.key].length === 0) tab.classList.add('lc-zero');
      tab.addEventListener('click', () => {
        activeTab = cat.key;
        tabs
          .querySelectorAll('.lc-tab')
          .forEach((t) => t.classList.toggle('lc-active', t === tab));
        centerTab(tabs, tab);
        renderList();
      });
      tabs.appendChild(tab);
    });
    makeTabsDraggable(tabs);
    toolbar.appendChild(tabs);

    // 搜索框（模糊检索、忽略大小写、高亮匹配）
    const searchWrap = document.createElement('div');
    searchWrap.className = 'lc-search-wrap';
    const searchIcon = document.createElement('span');
    searchIcon.className = 'lc-search-icon';
    searchIcon.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M16.5 16.5 21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    const searchInput = document.createElement('input');
    searchInput.className = 'lc-search';
    searchInput.type = 'text';
    searchInput.placeholder = '搜索链接，多个关键词用空格分隔';
    searchInput.spellcheck = false;
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim();
      renderList();
    });
    matchEl = document.createElement('span');
    matchEl.className = 'lc-search-count';
    searchWrap.append(searchIcon, searchInput, matchEl);
    toolbar.appendChild(searchWrap);

    panel.appendChild(toolbar);

    // 列表（全量渲染 + 图片懒加载：进入视口才发起请求，仅加载一次）
    listEl = document.createElement('div');
    listEl.className = 'lc-list';
    panel.appendChild(listEl);

    // 缩放手柄
    const resize = document.createElement('div');
    resize.className = 'lc-resize';
    resize.title = '拖拽调整窗口大小';
    resize.innerHTML = ICON_RESIZE;
    panel.appendChild(resize);

    shadow.appendChild(panel);

    // 拖拽移动（仅头部，排除关闭按钮）
    makeDraggable(panel, header, ['.lc-close']);
    // 右下角缩放
    makeResizable(panel, resize);

    renderList();
    // 初始将当前选中的 tab 居中
    const activeTabEl = tabs.querySelector<HTMLButtonElement>('.lc-tab.lc-active');
    if (activeTabEl) centerTab(tabs, activeTabEl);
  }

  function closePanel(): void {
    panel?.remove();
    panel = null;
    listEl = null;
    matchEl = null;
    countEl = null;
  }

  /* ---------- 搜索 / 虚拟列表 ---------- */

  /** 模糊检索：忽略大小写的子串匹配，支持空格分隔多个关键词（需全部命中） */
  function matchLinks(links: string[], query: string): string[] {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return links;
    return links.filter((url) => {
      const lower = url.toLowerCase();
      return tokens.every((t) => lower.includes(t));
    });
  }

  /** 计算所有关键词在文本中的高亮区间（忽略大小写，合并重叠） */
  function findRanges(text: string, tokens: string[]): Array<[number, number]> {
    const lower = text.toLowerCase();
    const ranges: Array<[number, number]> = [];
    for (const t of tokens) {
      if (!t) continue;
      const lt = t.toLowerCase();
      let i = lower.indexOf(lt);
      while (i !== -1) {
        ranges.push([i, i + lt.length]);
        i = lower.indexOf(lt, i + lt.length);
      }
    }
    ranges.sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) {
        last[1] = Math.max(last[1], r[1]);
      } else {
        merged.push([r[0], r[1]]);
      }
    }
    return merged;
  }

  /** 渲染链接文本，命中部分用 <mark> 高亮 */
  function buildHighlighted(url: string): Node {
    const frag = document.createDocumentFragment();
    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      frag.appendChild(document.createTextNode(url));
      return frag;
    }
    let pos = 0;
    for (const [start, end] of findRanges(url, tokens)) {
      if (start > pos) frag.appendChild(document.createTextNode(url.slice(pos, start)));
      const mark = document.createElement('mark');
      mark.className = 'lc-hl';
      mark.textContent = url.slice(start, end);
      frag.appendChild(mark);
      pos = end;
    }
    if (pos < url.length) frag.appendChild(document.createTextNode(url.slice(pos)));
    return frag;
  }

  /** 图片懒加载：进入视口（含 300px 预取边距）才设置 src，加载一次后不再请求 */
  function setupLazyImages(): void {
    lazyObserver?.disconnect();
    if (!listEl) return;
    const imgs = listEl.querySelectorAll<HTMLImageElement>('img.lc-thumb[data-src]');
    if (imgs.length === 0) return;

    lazyObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
          }
          observer.unobserve(img); // 只加载一次
        });
      },
      { root: listEl, rootMargin: LAZY_ROOT_MARGIN }
    );
    imgs.forEach((img) => lazyObserver!.observe(img));
  }

  function activeTabIsEmpty(): boolean {
    return linkMap[activeTab].length === 0;
  }

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 创建媒体播放器（视频卡片 / 音频胶囊），preload=none 点击播放才请求 */
  function createMediaPlayer(
    url: string,
    kind: 'video' | 'audio'
  ): HTMLElement {
    if (kind === 'video') {
      const video = document.createElement('video');
      video.className = 'lc-player-video';
      video.controls = true;
      video.preload = 'none';
      video.src = url;
      return video;
    }
    const wrap = document.createElement('div');
    wrap.className = 'lc-player-audio-wrap';
    const audio = document.createElement('audio');
    audio.className = 'lc-player-audio';
    audio.controls = true;
    audio.preload = 'none';
    audio.src = url;
    wrap.appendChild(audio);
    return wrap;
  }

  /** 构建单行：[缩略图(图片)] 链接(高亮) [播放/关闭] [下载] [复制] */
  function buildRow(url: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'lc-row';

    // 图片分类：链接前显示缩略预览（懒加载，src 由 IntersectionObserver 按需设置）
    if (activeTab === 'image') {
      const thumb = document.createElement('img');
      thumb.className = 'lc-thumb';
      thumb.dataset.src = url;
      thumb.referrerPolicy = 'no-referrer';
      thumb.onerror = () => {
        thumb.classList.add('lc-thumb-error');
        thumb.removeAttribute('src');
        thumb.textContent = '失效';
      };
      row.appendChild(thumb);
    }

    const a = document.createElement('a');
    a.className = 'lc-link';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.title = url;
    a.appendChild(buildHighlighted(url));

    const btns = document.createElement('span');
    btns.className = 'lc-btns';

    // 嵌入页面之外的所有分类提供下载按钮
    if (activeTab !== 'iframe') {
      const dl = document.createElement('button');
      dl.className = 'lc-dl';
      dl.textContent = '下载';
      dl.title = '下载该资源';
      dl.addEventListener('click', () => downloadFile(url));
      btns.appendChild(dl);
    }

    const btn = document.createElement('button');
    btn.className = 'lc-copy';
    btn.textContent = '复制';
    btn.addEventListener('click', () => copyText(url));
    btns.appendChild(btn);

    if (activeTab === 'video' || activeTab === 'audio') {
      // 媒体行：默认仅显示链接与按钮，点击「播放」展开播放器，按钮变为「关闭」
      row.classList.add('lc-row-media');

      const meta = document.createElement('div');
      meta.className = 'lc-meta';
      meta.append(a, btns);

      const slot = document.createElement('div');
      slot.className = 'lc-player-slot';
      slot.hidden = true;

      const playBtn = document.createElement('button');
      playBtn.className = 'lc-play';
      playBtn.textContent = '播放';
      playBtn.title = '展开播放器';
      let opened = false;
      let player: HTMLElement | null = null;
      playBtn.addEventListener('click', () => {
        opened = !opened;
        if (opened) {
          if (!player) {
            player = createMediaPlayer(url, activeTab as 'video' | 'audio');
            slot.appendChild(player);
          }
          slot.hidden = false;
          row.dataset.open = 'true';
          playBtn.textContent = '关闭';
          playBtn.classList.add('lc-open');
          playBtn.title = '收起播放器';
          row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          row.dataset.open = 'false';
          slot.hidden = true;
          const media = player?.querySelector('video, audio');
          if (media instanceof HTMLMediaElement) media.pause();
          playBtn.textContent = '播放';
          playBtn.classList.remove('lc-open');
          playBtn.title = '展开播放器';
        }
      });
      btns.prepend(playBtn);

      row.append(meta, slot);
    } else {
      row.append(a, btns);
    }
    return row;
  }

  function renderList(): void {
    if (!listEl) return;
    const links = linkMap[activeTab];
    filteredLinks = matchLinks(links, searchQuery);
    // 检索时在搜索框内右侧显示「匹配数 / 总数」
    if (matchEl) {
      if (searchQuery) {
        matchEl.textContent = `${filteredLinks.length}/${links.length}`;
        matchEl.style.display = '';
      } else {
        matchEl.style.display = 'none';
      }
    }
    listEl.scrollTop = 0;
    listEl.innerHTML = '';

    if (filteredLinks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'lc-empty';
      empty.style.height = `${Math.max(listEl.clientHeight, 120)}px`;
      empty.innerHTML = activeTabIsEmpty()
        ? `${ICON_EMPTY}<span>当前分类未识别到链接</span>`
        : `${ICON_EMPTY}<span>没有匹配「${escapeHtml(searchQuery)}」的链接</span>`;
      listEl.appendChild(empty);
      return;
    }

    filteredLinks.forEach((url) => listEl!.appendChild(buildRow(url)));
    // 图片按需加载：进入视口才请求，且只加载一次
    setupLazyImages();
  }

  /* ---------- 下载 ---------- */

  function downloadFile(url: string): void {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'download', url }, (res) => {
          if (chrome.runtime.lastError || !res?.ok) {
            fallbackDownload(url);
            return;
          }
          showToast('已开始下载');
        });
      } else {
        fallbackDownload(url);
      }
    } catch {
      fallbackDownload(url);
    }
  }

  /** 后台不可用时的兜底：用 <a download> 触发（同源可下载，跨源可能直接打开） */
  function fallbackDownload(url: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
    showToast('已尝试下载');
  }

  function copyText(text: string): void {
    const done = () => showToast('已复制到剪贴板');
    const fail = () => showToast('复制失败，请手动复制');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text) ? done() : fail());
    } else {
      fallbackCopy(text) ? done() : fail();
    }
  }

  function fallbackCopy(text: string): boolean {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }

  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  function showToast(msg: string): void {
    shadow.querySelectorAll('.lc-toast').forEach((t) => t.remove());
    const toast = document.createElement('div');
    toast.className = 'lc-toast';
    toast.textContent = msg;
    shadow.appendChild(toast);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.remove(), 1600);
  }

  /* ---------- 拖拽 / 缩放 ---------- */
  /** tab 栏横向拖拽滚动：按住左右拖动查看隐藏 tab；
   *  拖拽超过阈值后抑制本次点击，避免误切分类（触屏原生滑动不受影响） */
  function makeTabsDraggable(tabs: HTMLDivElement): void {
    let down = false;
    let dragged = false;
    let sx = 0;
    let sl = 0;

    tabs.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // 触屏可直接滑动
      down = true;
      dragged = false;
      sx = e.clientX;
      sl = tabs.scrollLeft;
    });
    tabs.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (!dragged && Math.abs(dx) < 5) return; // 拖拽阈值
      if (!dragged) {
        dragged = true;
        // 捕获指针：后续 pointerup 落在 tab 栏上，点击不会派发到 tab 按钮
        try {
          tabs.setPointerCapture(e.pointerId);
        } catch { /* noop */ }
        tabs.style.scrollBehavior = 'auto'; // 拖拽期间关闭平滑滚动
      }
      tabs.scrollLeft = sl - dx;
    });
    const stop = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      tabs.style.scrollBehavior = '';
      try {
        tabs.releasePointerCapture(e.pointerId);
      } catch { /* noop */ }
    };
    tabs.addEventListener('pointerup', stop);
    tabs.addEventListener('pointercancel', stop);
  }

  /** 将 tab 条中的指定 tab 平滑滚动到可视区中央 */
  function centerTab(tabs: HTMLDivElement, tab: HTMLElement): void {
    const target =
      tab.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2;
    tabs.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }

  function makeDraggable(
    target: HTMLDivElement,
    handle: HTMLDivElement,
    excludeSelector: string[]
  ): void {
    let dragging = false;
    let sx = 0;
    let sy = 0;
    let ox = 0;
    let oy = 0;

    handle.addEventListener('pointerdown', (e) => {
      if (excludeSelector.some((sel) => (e.target as Element)?.closest(sel))) {
        return;
      }
      dragging = true;
      sx = e.clientX;
      sy = e.clientY;
      ox = target.offsetLeft;
      oy = target.offsetTop;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      target.style.left = `${clamp(ox + e.clientX - sx, -target.offsetWidth + 80, innerWidth - 80)}px`;
      target.style.top = `${clamp(oy + e.clientY - sy, 0, innerHeight - 56)}px`;
    });
    const stop = (e: PointerEvent) => {
      dragging = false;
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch { /* noop */ }
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  function makeResizable(
    target: HTMLDivElement,
    handle: HTMLDivElement
  ): void {
    let resizing = false;
    let sx = 0;
    let sy = 0;
    let sw = 0;
    let sh = 0;

    handle.addEventListener('pointerdown', (e) => {
      resizing = true;
      sx = e.clientX;
      sy = e.clientY;
      sw = target.offsetWidth;
      sh = target.offsetHeight;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    });
    handle.addEventListener('pointermove', (e) => {
      if (!resizing) return;
      const minW = MIN_PANEL_W;
      const minH = 240;
      target.style.width = `${clamp(sw + e.clientX - sx, minW, Math.round(innerWidth * 0.9))}px`;
      target.style.height = `${clamp(sh + e.clientY - sy, minH, Math.round(innerHeight * 0.9))}px`;
    });
    const stop = (e: PointerEvent) => {
      resizing = false;
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch { /* noop */ }
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }
}
