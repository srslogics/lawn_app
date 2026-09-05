(() => {
  const SW_VERSION = "20260905-premium-console-final";
  const CONSOLE_PATHS = new Set(["/console", "/console/", "/index.html"]);

  if (window.location.protocol === "file:" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const isConsole = CONSOLE_PATHS.has(window.location.pathname);

      if (!isConsole) {
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if (navigator.serviceWorker.controller && !sessionStorage.getItem("royal_sw_cleared")) {
          sessionStorage.setItem("royal_sw_cleared", "1");
          window.location.reload();
        }
        return;
      }

      await Promise.all(
        registrations
          .filter((registration) => !registration.scope.endsWith("/console"))
          .map((registration) => registration.unregister())
      );

      await navigator.serviceWorker.register(`/sw.js?v=${SW_VERSION}`, {
        scope: "/console"
      });
    } catch (error) {
      console.error("PWA service worker registration failed:", error);
    }
  });
})();
