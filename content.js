const controlClass = "qq-admuse-video-download-control";
let controlsVisible = false;

function sourceFor(video) {
  return video.currentSrc || video.src || video.querySelector("source")?.src || "";
}

function filenameFor(index) {
  const title = (document.title || "admuse-video")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .trim()
    .slice(0, 70) || "admuse-video";
  return `${title}-${index}.mp4`;
}

function download(video, button, index) {
  const url = sourceFor(video);
  if (!url) {
    button.textContent = "视频尚未加载";
    return;
  }

  button.disabled = true;
  button.textContent = "正在打开保存窗口...";
  chrome.runtime.sendMessage({
    type: "download-video",
    url,
    filename: filenameFor(index)
  }, (response) => {
    button.disabled = false;
    if (chrome.runtime.lastError || !response?.ok) {
      button.textContent = "下载失败，请重试";
      return;
    }
    button.textContent = "已打开保存窗口";
    window.setTimeout(() => { button.textContent = "下载视频"; }, 1800);
  });
}

function addControls() {
  if (!controlsVisible) return;
  document.querySelectorAll("video").forEach((video, index) => {
    if (!sourceFor(video) || video.dataset.qqAdmuseDownloadReady) return;

    const control = document.createElement("div");
    control.className = controlClass;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "下载视频";
    button.addEventListener("click", () => download(video, button, index + 1));
    control.append(button);

    // Insert after the player wrapper so the control remains below absolutely positioned videos.
    const wrapper = video.parentElement;
    if (!wrapper?.parentElement) return;
    wrapper.insertAdjacentElement("afterend", control);
    video.dataset.qqAdmuseDownloadReady = "true";
  });
}

function removeControls() {
  document.querySelectorAll(`.${controlClass}`).forEach((control) => control.remove());
  document.querySelectorAll("video[data-qq-admuse-download-ready]").forEach((video) => {
    delete video.dataset.qqAdmuseDownloadReady;
  });
}

function setControlsVisible(visible) {
  controlsVisible = Boolean(visible);
  if (controlsVisible) addControls();
  else removeControls();
}

const style = document.createElement("style");
style.textContent = `
  .${controlClass} {
    display: flex;
    justify-content: flex-end;
    width: 100%;
    box-sizing: border-box;
    margin: 10px 0 4px;
  }
  .${controlClass} button {
    appearance: none;
    border: 0;
    border-radius: 5px;
    min-height: 34px;
    padding: 0 14px;
    background: #1677ff;
    color: #fff;
    cursor: pointer;
    font: 14px/1 "Microsoft YaHei", system-ui, sans-serif;
  }
  .${controlClass} button:hover { background: #095fce; }
  .${controlClass} button:disabled { cursor: wait; opacity: .68; }
`;
(document.head || document.documentElement).append(style);

document.addEventListener("loadedmetadata", addControls, true);
new MutationObserver(addControls).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["src"]
});

chrome.storage.local.get({ showDownloadButton: true }, ({ showDownloadButton }) => {
  setControlsVisible(showDownloadButton);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.showDownloadButton) {
    setControlsVisible(changes.showDownloadButton.newValue);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "set-controls-visible") {
    setControlsVisible(message.visible);
    sendResponse({ ok: true });
  }
});
