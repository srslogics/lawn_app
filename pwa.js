(() => {
  const SW_VERSION = "20260710-cachefix";

  if (window.location.protocol === "file:" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register(`/sw.js?v=${SW_VERSION}`);
    } catch (error) {
      console.error("PWA service worker registration failed:", error);
    }
  });
})();
