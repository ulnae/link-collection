import { CSS } from './style';

/* ============================================================
 * link-easy 内容脚本
 * 悬浮按钮 + 六大类链接识别 + iOS 风格悬浮窗
 * ============================================================ */

type CatKey = 'image' | 'audio' | 'video' | 'iframe' | 'script' | 'css';

interface CatDef {
  key: CatKey;
  label: string;
}

const CATS: CatDef[] = [
  { key: 'image', label: '图片资源' },
  { key: 'audio', label: '音频资源' },
  { key: 'video', label: '视频资源' },
  { key: 'iframe', label: '嵌入页面' },
  { key: 'script', label: '脚本资源' },
  { key: 'css', label: '样式资源' }
];

const HOST_ID = 'link-easy-host';
const FAB_POS_KEY = 'link-easy:fab-pos';
const FAB_SIZE = 54;

const ICON_LINK = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10.6 13.4a1 1 0 0 0 1.4 0l4-4a3 3 0 1 0-4.24-4.24l-1.8 1.8"
    stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <path d="M13.4 10.6a1 1 0 0 0-1.4 0l-4 4a3 3 0 1 0 4.24 4.24l1.8-1.8"
    stroke="#fff" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const ICON_EMPTY = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="11" cy="11" r="7" stroke="#8e8e93" stroke-width="2"/>
  <path d="M16.5 16.5 21 21" stroke="#8e8e93" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const ICON_CLOSE = `<svg viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6"/></svg>`;
const ICON_MINUS = `<svg viewBox="0 0 12 12"><path d="M2.5 6h7"/></svg>`;
const ICON_RESIZE = `<svg class="le-resize-icon" viewBox="0 0 14 14">
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
  let listEl: HTMLDivElement | null = null;
  let statusEl: HTMLDivElement | null = null;
  let countEl: HTMLSpanElement | null = null;
  let linkMap: Record<CatKey, string[]> = createEmptyMap();
  let activeTab: CatKey = 'image';

  /* ---------- 工具函数 ---------- */
  function createEmptyMap(): Record<CatKey, string[]> {
    return { image: [], audio: [], video: [], iframe: [], script: [], css: [] };
  }

  /** 仅保留 http/https 绝对链接 */
  function toHttpUrl(raw: string | null | undefined): string | null {
    if (!raw) return null;
    try {
      const u = new URL(raw, location.href);
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
  function scanLinks(): Record<CatKey, string[]> {
    const result = createEmptyMap();
    const push = (key: CatKey, url: string | null) => {
      if (url) result[key].push(url);
    };

    // 图片资源：img / picture > source / srcset / svg image / 背景图
    document.querySelectorAll('img').forEach((el) => {
      push('image', toHttpUrl(el.getAttribute('src')));
      const ss = el.getAttribute('srcset');
      if (ss) parseSrcset(ss).forEach((u) => push('image', toHttpUrl(u)));
    });
    document.querySelectorAll('picture source').forEach((el) => {
      push('image', toHttpUrl(el.getAttribute('src')));
      const ss = el.getAttribute('srcset');
      if (ss) parseSrcset(ss).forEach((u) => push('image', toHttpUrl(u)));
    });
    document.querySelectorAll('svg image').forEach((el) => {
      push(
        'image',
        toHttpUrl(el.getAttribute('href') || el.getAttribute('xlink:href'))
      );
    });
    // 内联样式与 <style> 中的 background-image / url()
    const bgRe = /url\((['"]?)(https?:\/\/[^'")\s]+)\1\)/gi;
    document.querySelectorAll('[style]').forEach((el) => {
      const st = el.getAttribute('style') || '';
      let m: RegExpExecArray | null;
      while ((m = bgRe.exec(st))) push('image', m[2]);
    });
    document.querySelectorAll('style').forEach((el) => {
      let m: RegExpExecArray | null;
      while ((m = bgRe.exec(el.textContent || ''))) push('image', m[2]);
    });

    // 音频资源
    document.querySelectorAll('audio').forEach((el) => {
      push('audio', toHttpUrl(el.getAttribute('src')));
    });
    document.querySelectorAll('audio source, video source').forEach((el) => {
      const src = toHttpUrl(el.getAttribute('src'));
      if (!src) return;
      const type = (el.getAttribute('type') || '').toLowerCase();
      const url = src.toLowerCase();
      const parent = el.parentElement?.tagName.toLowerCase();
      if (parent === 'audio' || type.startsWith('audio') || /\.(mp3|wav|ogg|m4a|aac|flac)(\?|#|$)/.test(url)) {
        push('audio', src);
      } else if (parent === 'video' || type.startsWith('video') || /\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/.test(url)) {
        push('video', src);
      }
    });

    // 视频资源
    document.querySelectorAll('video').forEach((el) => {
      push('video', toHttpUrl(el.getAttribute('src')));
    });

    // 嵌入浏览上下文 / 页面
    document.querySelectorAll('iframe, frame').forEach((el) => {
      push('iframe', toHttpUrl(el.getAttribute('src')));
    });
    document.querySelectorAll('object[data]').forEach((el) => {
      const d = toHttpUrl(el.getAttribute('data'));
      if (d && /\.html?(\?|#|$)/i.test(d)) push('iframe', d);
    });

    // 脚本资源
    document.querySelectorAll('script[src]').forEach((el) => {
      push('script', toHttpUrl(el.getAttribute('src')));
    });

    // 外链样式资源
    document
      .querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]')
      .forEach((el) => {
        push('css', toHttpUrl(el.getAttribute('href')));
      });

    (Object.keys(result) as CatKey[]).forEach((k) => {
      result[k] = dedupe(result[k]);
    });
    return result;
  }

  /* ---------- 悬浮按钮 (FAB) ---------- */
  const fab = document.createElement('button');
  fab.className = 'le-fab';
  fab.title = 'link-easy：识别页面链接';
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
      // 已有面板：再次点击则恢复/切换
      panel.classList.remove('le-min');
      return;
    }
    fab.classList.add('le-busy');
    fab.style.pointerEvents = 'none';
    // 让浏览器先渲染 loading 状态
    setTimeout(() => {
      linkMap = scanLinks();
      fab.classList.remove('le-busy');
      fab.style.pointerEvents = '';
      openPanel();
    }, 60);
  }

  function openPanel(): void {
    const total = (Object.values(linkMap) as string[][]).reduce(
      (s, arr) => s + arr.length,
      0
    );

    const w = Math.round(innerWidth / 2);
    const h = Math.round(innerHeight / 2);
    const left = Math.round((innerWidth - w) / 2);
    const top = Math.round((innerHeight - h) / 2);

    panel = document.createElement('div');
    panel.className = 'le-panel';
    panel.style.width = `${w}px`;
    panel.style.height = `${h}px`;
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;

    // 头部：红点关闭 / 黄点最小化 / 标题 / 总数
    const header = document.createElement('div');
    header.className = 'le-header';

    const dots = document.createElement('span');
    dots.className = 'le-dot-group';
    const btnClose = document.createElement('button');
    btnClose.className = 'le-dot le-dot-close';
    btnClose.title = '关闭';
    btnClose.innerHTML = ICON_CLOSE;
    btnClose.addEventListener('click', () => closePanel());
    const btnMin = document.createElement('button');
    btnMin.className = 'le-dot le-dot-min';
    btnMin.title = '最小化 / 恢复';
    btnMin.innerHTML = ICON_MINUS;
    btnMin.addEventListener('click', () => toggleMinimize());
    dots.append(btnClose, btnMin);

    const title = document.createElement('span');
    title.className = 'le-title';
    title.textContent = '链接收集';

    countEl = document.createElement('span');
    countEl.className = 'le-count';
    countEl.textContent = `共 ${total} 条`;

    header.append(dots, title, countEl);
    panel.appendChild(header);

    statusEl = document.createElement('div');
    statusEl.className = 'le-status';
    panel.appendChild(statusEl);

    // 分段控制器
    const tabs = document.createElement('div');
    tabs.className = 'le-tabs';
    CATS.forEach((cat) => {
      const tab = document.createElement('button');
      tab.className = 'le-tab' + (cat.key === activeTab ? ' le-active' : '');
      tab.dataset.key = cat.key;
      tab.textContent = `${cat.label} ${linkMap[cat.key].length}`;
      tab.addEventListener('click', () => {
        activeTab = cat.key;
        tabs
          .querySelectorAll('.le-tab')
          .forEach((t) => t.classList.toggle('le-active', t === tab));
        renderList();
      });
      tabs.appendChild(tab);
    });
    panel.appendChild(tabs);

    // 列表
    listEl = document.createElement('div');
    listEl.className = 'le-list';
    panel.appendChild(listEl);

    // 缩放手柄
    const resize = document.createElement('div');
    resize.className = 'le-resize';
    resize.title = '拖拽调整窗口大小';
    resize.innerHTML = ICON_RESIZE;
    panel.appendChild(resize);

    shadow.appendChild(panel);

    // 拖拽移动（仅头部，排除按钮）
    makeDraggable(panel, header, ['.le-dot']);
    // 右下角缩放
    makeResizable(panel, resize);

    renderList();
  }

  function closePanel(): void {
    panel?.remove();
    panel = null;
    listEl = null;
    statusEl = null;
    countEl = null;
  }

  function toggleMinimize(): void {
    if (!panel) return;
    const min = panel.classList.toggle('le-min');
    if (!min) {
      // 恢复时保证在视口内
      const r = panel.getBoundingClientRect();
      panel.style.width = `${Math.max(360, r.width)}px`;
      panel.style.height = `${clamp(r.height, 240, innerHeight - 40)}px`;
      panel.style.left = `${clamp(r.left, 0, Math.max(0, innerWidth - r.width))}px`;
      panel.style.top = `${clamp(r.top, 0, Math.max(0, innerHeight - 56))}px`;
    }
  }

  function renderList(): void {
    if (!listEl || !statusEl) return;
    const links = linkMap[activeTab];
    const cat = CATS.find((c) => c.key === activeTab)!;
    statusEl.textContent = `${cat.label} · 识别到 ${links.length} 条`;
    listEl.innerHTML = '';

    if (links.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'le-empty';
      empty.innerHTML = `${ICON_EMPTY}<span>当前分类未识别到链接</span>`;
      listEl.appendChild(empty);
      return;
    }

    links.forEach((url) => {
      const row = document.createElement('div');
      row.className = 'le-row';

      // 图片分类：链接前显示缩略预览
      if (activeTab === 'image') {
        const thumb = document.createElement('img');
        thumb.className = 'le-thumb';
        thumb.src = url;
        thumb.loading = 'lazy';
        thumb.referrerPolicy = 'no-referrer';
        thumb.onerror = () => {
          thumb.classList.add('le-thumb-error');
          thumb.removeAttribute('src');
          thumb.textContent = '失效';
        };
        row.appendChild(thumb);
      }

      const a = document.createElement('a');
      a.className = 'le-link';
      a.href = url;
      a.textContent = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = url;

      const btn = document.createElement('button');
      btn.className = 'le-copy';
      btn.textContent = '复制';
      btn.addEventListener('click', () => copyText(url));

      row.append(a, btn);
      listEl!.appendChild(row);
    });
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
    shadow.querySelectorAll('.le-toast').forEach((t) => t.remove());
    const toast = document.createElement('div');
    toast.className = 'le-toast';
    toast.textContent = msg;
    shadow.appendChild(toast);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.remove(), 1600);
  }

  /* ---------- 拖拽 / 缩放 ---------- */
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
      const minW = 360;
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
