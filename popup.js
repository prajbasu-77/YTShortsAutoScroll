const toggle = document.getElementById("toggle");
const status = document.getElementById("status");

// Load saved state
chrome.storage.sync.get("autoScrollEnabled", (data) => {
  const enabled = data.autoScrollEnabled !== false;
  toggle.checked = enabled;
  updateStatus(enabled);
});

toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ autoScrollEnabled: enabled });
  updateStatus(enabled);

  // Send message to active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "TOGGLE", enabled });
    }
  });
});

function updateStatus(enabled) {
  status.textContent = enabled
    ? "✅ Active on YouTube Shorts"
    : "⏸ Paused — toggle to resume";
  status.style.color = enabled ? "#4caf50" : "#888";
}
