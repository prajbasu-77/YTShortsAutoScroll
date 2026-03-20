// YT Shorts Auto Scroll - content.js
(function () {
  let enabled = true;
  let lastScrollTime = 0;
  let observer = null;
  let checkInterval = null;

  // Load enabled state from storage
  chrome.storage.sync.get("autoScrollEnabled", (data) => {
    if (data.autoScrollEnabled === false) enabled = false;
    if (enabled) init();
  });

  // Listen for toggle messages from popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TOGGLE") {
      enabled = msg.enabled;
      if (enabled) init();
      else cleanup();
    }
  });

  function init() {
    cleanup();
    attachToVideo();
    // Re-attach if navigation happens within Shorts
    checkInterval = setInterval(attachToVideo, 2000);
  }

  function cleanup() {
    if (observer) { observer.disconnect(); observer = null; }
    if (checkInterval) { clearInterval(checkInterval); checkInterval = null; }
  }

  function attachToVideo() {
    const video = document.querySelector("ytd-shorts video, ytd-reel-video-renderer video, #shorts-player video");
    if (!video || video._autoScrollAttached) return;

    video._autoScrollAttached = true;

    video.addEventListener("ended", () => {
      const now = Date.now();
      if (now - lastScrollTime < 1500) return; // debounce
      lastScrollTime = now;
      scrollToNext();
    });

    // Fallback: near end detection (last 0.3s)
    video.addEventListener("timeupdate", () => {
      if (!video.duration || video.duration < 1) return;
      const remaining = video.duration - video.currentTime;
      const now = Date.now();
      if (remaining < 0.3 && now - lastScrollTime > 1500) {
        lastScrollTime = now;
        scrollToNext();
      }
    });
  }

  function scrollToNext() {
    // Try clicking the next button
    const nextBtn =
      document.querySelector('ytd-shorts button[aria-label*="next" i]') ||
      document.querySelector('ytd-shorts button[aria-label*="Next" i]') ||
      document.querySelector('.navigation-button-icon-container:last-of-type') ||
      document.querySelector('[id="navigation-button-down"]') ||
      document.querySelector('ytd-button-renderer.ytd-shorts-navigation');

    if (nextBtn) {
      nextBtn.click();
      return;
    }

    // Fallback: simulate swipe/scroll on the shorts container
    const container =
      document.querySelector("#shorts-inner-container") ||
      document.querySelector("ytd-shorts") ||
      document.querySelector("ytd-reel-video-renderer");

    if (container) {
      container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    }

    // Last resort: press ArrowDown globally
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    document.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowDown", bubbles: true, cancelable: true }));
  }
})();
