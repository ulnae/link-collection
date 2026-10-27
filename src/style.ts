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
.le-panel.le-min {
  height: 56px !important;
  border-radius: 16px;
}
.le-panel.le-min .le-tabs,
.le-panel.le-min .le-list,
.le-panel.le-min .le-status {
  display: none;
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
  width: 13px;
  height: 13px;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.12);
  transition: filter 0.15s ease, transform 0.15s ease;
}
.le-dot:hover {
  filter: brightness(0.88);
  transform: scale(1.12);
}
.le-dot-close {
  background: #ff5f57;
}
.le-dot-min {
  background: #febc2e;
}
.le-dot svg {
  width: 8px;
  height: 8px;
  display: block;
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
  overflow-x: auto;
  scrollbar-width: none;
}
.le-tabs::-webkit-scrollbar {
  display: none;
}
.le-tab {
  flex: 1 0 auto;
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
  padding: 9px 14px;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.14);
  transition: background 0.12s ease;
}
.le-row:hover {
  background: rgba(0, 122, 255, 0.05);
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

/* 缩放手柄（右下角，更醒目） */
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
