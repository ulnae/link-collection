/**
 * Link Collection 后台 Service Worker
 * 负责调用 chrome.downloads API 完成文件下载（内容脚本无此权限）
 */

interface DownloadMessage {
  type: 'download';
  url: string;
}

chrome.runtime.onMessage.addListener((msg: DownloadMessage, _sender, sendResponse) => {
  if (msg?.type !== 'download' || typeof msg.url !== 'string') return;

  chrome.downloads.download({ url: msg.url }, (downloadId) => {
    const err = chrome.runtime.lastError?.message;
    sendResponse({ ok: !err && typeof downloadId === 'number', error: err });
  });
  // 异步响应
  return true;
});
