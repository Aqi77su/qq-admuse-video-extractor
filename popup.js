const toggle = document.querySelector("#visibility");
const status = document.querySelector("#status");

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function notifyCurrentPage(visible) {
  const tab = await activeTab();
  if (!tab?.id || !tab.url?.startsWith("https://admuse.qq.com/")) return false;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "set-controls-visible", visible });
    return true;
  } catch {
    return false;
  }
}

chrome.storage.local.get({ showDownloadButton: true }, async ({ showDownloadButton }) => {
  toggle.checked = showDownloadButton;
  toggle.disabled = false;
  const tab = await activeTab();
  status.textContent = tab?.url?.startsWith("https://admuse.qq.com/")
    ? "切换后当前页面会立即更新。"
    : "设置会在 AdMuse 页面生效。";
});

toggle.addEventListener("change", async () => {
  const visible = toggle.checked;
  toggle.disabled = true;
  await chrome.storage.local.set({ showDownloadButton: visible });
  const updated = await notifyCurrentPage(visible);
  toggle.disabled = false;
  status.textContent = updated
    ? (visible ? "下载按钮已显示。" : "下载按钮已隐藏。")
    : "设置已保存，将在 AdMuse 页面生效。";
});
