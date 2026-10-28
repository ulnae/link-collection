/** link-easy iOS 风格样式（注入到 Shadow DOM 中，与页面完全隔离） */
export const CSS = /* css */ `
:host {
  all: initial;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC",
    "Helvetica Neue", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ---------- 悬浮按钮 (FAB) ---------- */
.le-fab {
  position: fixed;
  z-index: 2147483647;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: none;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #34c3ff 0%, #0a84ff 55%, #0060df 100%);
  box-shadow: 0 8px 24px rgba(10, 132, 255, 0.45),
    0 2px 6px rgba(0, 0, 0, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.35);
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.18s ease;
  touch-action: none;
  user-select: none;
}
.le-fab:active {
  transform: scale(0.92);
  cursor: grabbing;
}
.le-fab:hover {
  box-shadow: 0 10px 28px rgba(10, 132, 255, 0.55),
    0 3px 8px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.35);
}
.le-fab svg {
  width: 26px;
  height: 26px;
  pointer-events: none;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
}

/* ---------- 悬浮窗 ---------- */
.le-panel {
  position: fixed;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  background: rgba(246, 246, 249, 0.88);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28),
    0 4px 14px rgba(0, 0, 0, 0.12);
  animation: le-pop 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
  touch-action: none;
}
@keyframes le-pop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 头部 */
.le-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: grab;
  flex: none;
  user-select: none;
}
.le-header:active {
  cursor: grabbing;
}
.le-header .le-dot-group {
  display: flex;
  gap: 8px;
  flex: none;
}
.le-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  padding: 0;
  position: relative;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}
.le-dot::before {
  content: "";
  position: absolute;
  inset: 4.5px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.12);
  transition: filter 0.15s ease;
}
.le-dot-close::before {
  background: #ff5f57;
}
.le-dot:hover {
  transform: scale(1.08);
}
.le-dot:hover::before {
  filter: brightness(0.88);
}
.le-dot svg {
  width: 8px;
  height: 8px;
  display: block;
  position: relative;
  z-index: 1;
  stroke: rgba(0, 0, 0, 0.55);
  stroke-width: 2;
  stroke-linecap: round;
  fill: none;
  pointer-events: none;
}
.le-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #1c1c1e;
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.le-count {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  color: #007aff;
  background: rgba(0, 122, 255, 0.12);
  border-radius: 999px;
  padding: 3px 10px;
}

/* 状态栏 */
.le-status {
  flex: none;
  padding: 0 16px 8px;
  font-size: 12px;
  color: #8e8e93;
}

/* 分段控制器 (Segmented Control) */
.le-tabs {
  flex: none;
  display: flex;
  gap: 2px;
  margin: 0 12px 10px;
  padding: 2px;
  background: rgba(118, 118, 128, 0.14);
  border-radius: 10px;
  overflow-x: auto; /* 窄窗口时横向滑动，选中项自动居中 */
  scrollbar-width: none; /* 隐藏滚动条 */
  scroll-behavior: smooth;
}
.le-tabs::-webkit-scrollbar {
  display: none;
}
.le-tab {
  flex: 0 0 auto;
  min-width: 64px;
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: #6d6d72;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.le-tab:hover {
  color: #1c1c1e;
}
.le-tab.le-active {
  background: #ffffff;
  color: #007aff;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

/* 搜索框 */
.le-search-wrap {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 12px 10px;
  padding: 0 10px;
  height: 32px;
  border-radius: 10px;
  background: rgba(118, 118, 128, 0.12);
  transition: box-shadow 0.15s ease, background 0.15s ease;
}
.le-search-wrap:focus-within {
  background: rgba(118, 118, 128, 0.08);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.35);
}
.le-search-icon {
  flex: none;
  width: 14px;
  height: 14px;
  color: #8e8e93;
  display: flex;
}
.le-search-icon svg {
  width: 100%;
  height: 100%;
}
.le-search {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #1c1c1e;
}
.le-search::placeholder {
  color: #aeaeb2;
}

/* 列表 */
.le-list {
  flex: 1;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.75);
  border-top: 0.5px solid rgba(60, 60, 67, 0.18);
  touch-action: pan-y;
}

.le-row {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 50px;
  padding: 0 14px;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.14);
  transition: background 0.12s ease;
}
.le-row:hover {
  background: rgba(0, 122, 255, 0.05);
}

/* 媒体行（视频 / 音频）：默认单行，点击「播放」展开播放器后变纵向卡片 */
.le-row-media {
  height: 50px;
}
.le-row-media[data-open="true"] {
  flex-direction: column;
  align-items: stretch;
  height: auto;
  padding: 10px 14px;
  gap: 8px;
  background: rgba(0, 122, 255, 0.04);
}
.le-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.le-player-slot {
  display: none;
  width: 100%;
}
.le-row-media[data-open="true"] .le-player-slot {
  display: block;
}
.le-player-video {
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 260px;
  border-radius: 12px;
  background: #000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
  outline: none;
  display: block;
}
.le-player-audio-wrap {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(118, 118, 128, 0.14);
}
.le-player-audio {
  width: 100%;
  height: 32px;
  outline: none;
}
/* 播放 / 关闭 双态按钮 */
.le-play {
  flex: none;
  width: 60px;
  padding: 4px 0;
  border: none;
  border-radius: 999px;
  background: rgba(175, 82, 222, 0.12);
  color: #af52de;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease, transform 0.12s ease;
}
.le-play:hover {
  background: rgba(175, 82, 222, 0.22);
}
.le-play:active {
  transform: scale(0.94);
}
.le-play.le-open {
  background: rgba(255, 59, 48, 0.12);
  color: #ff3b30;
}
.le-play.le-open:hover {
  background: rgba(255, 59, 48, 0.22);
}
.le-btns {
  flex: none;
  display: flex;
  gap: 6px;
}
.le-link {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: #1c1c1e;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.le-link:hover {
  color: #007aff;
}

/* 搜索命中高亮 */
.le-hl {
  background: rgba(255, 214, 10, 0.45);
  color: inherit;
  border-radius: 3px;
  padding: 0 1px;
}

/* 图片预览缩略图 */
.le-thumb {
  flex: none;
  width: 40px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  background: rgba(118, 118, 128, 0.12);
  box-shadow: 0 0 0 0.5px rgba(60, 60, 67, 0.22);
  display: block;
}
.le-thumb.le-thumb-error {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aeaeb2;
  font-size: 9px;
}
.le-copy {
  flex: none;
  width: 60px;
  padding: 4px 0;
  border: none;
  border-radius: 999px;
  background: rgba(0, 122, 255, 0.12);
  color: #007aff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease, transform 0.12s ease;
}
.le-copy:hover {
  background: rgba(0, 122, 255, 0.2);
}
.le-copy:active {
  transform: scale(0.94);
}
.le-dl {
  flex: none;
  width: 60px;
  padding: 4px 0;
  border: none;
  border-radius: 999px;
  background: rgba(52, 199, 89, 0.14);
  color: #34c759;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease, transform 0.12s ease;
}
.le-dl:hover {
  background: rgba(52, 199, 89, 0.24);
}
.le-dl:active {
  transform: scale(0.94);
}
.le-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  color: #aeaeb2;
  font-size: 13px;
}
.le-empty svg {
  width: 40px;
  height: 40px;
  opacity: 0.4;
}

/* 缩放手柄（右下角） */
.le-resize {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 5px;
  cursor: nwse-resize;
  touch-action: none;
  border-radius: 10px 0 10px 0;
  transition: background 0.15s ease;
}
.le-resize:hover {
  background: rgba(0, 122, 255, 0.12);
}
.le-resize-icon {
  width: 14px;
  height: 14px;
  flex: none;
  stroke: #007aff;
  stroke-width: 1.6;
  stroke-linecap: round;
  fill: none;
  opacity: 0.75;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.le-resize:hover .le-resize-icon {
  opacity: 1;
  transform: scale(1.1);
}

/* Toast */
.le-toast {
  position: fixed;
  z-index: 2147483647;
  left: 50%;
  bottom: 12%;
  transform: translateX(-50%);
  background: rgba(28, 28, 30, 0.85);
  backdrop-filter: blur(10px);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  padding: 9px 18px;
  border-radius: 999px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  animation: le-toast-in 0.25s ease;
  pointer-events: none;
}
@keyframes le-toast-in {
  from {
    opacity: 0;
    transform: translate(-50%, 8px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

/* 识别中 */
.le-fab.le-busy svg {
  animation: le-spin 0.9s linear infinite;
}
@keyframes le-spin {
  to {
    transform: rotate(360deg);
  }
}
`;
