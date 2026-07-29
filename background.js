function safeFilename(name) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").slice(0, 120) || "admuse-video.mp4";
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "download-video") return;

  try {
    const url = new URL(message.url);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("不是可下载的 HTTP(S) 视频地址。");
    }

    chrome.downloads.download(
      {
        url: url.href,
        filename: safeFilename(message.filename || "admuse-video.mp4"),
        saveAs: true,
        conflictAction: "uniquify"
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ ok: true, downloadId });
      }
    );
  } catch (error) {
    sendResponse({ ok: false, error: error.message });
  }

  return true;
});
