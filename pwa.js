(() => {
  if (window.location.protocol === "file:" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (error) {
      console.error("PWA service worker registration failed:", error);
    }
  });
})();
