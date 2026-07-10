(() => {
  if (window.location.protocol === "file:" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const hadRegistrations = registrations.length > 0;

      await Promise.all(registrations.map((registration) => registration.unregister()));

      if (hadRegistrations && !sessionStorage.getItem("royal_public_sw_cleared")) {
        sessionStorage.setItem("royal_public_sw_cleared", "1");
        window.location.reload();
      }
    } catch (error) {
      console.error("Public service worker cleanup failed:", error);
    }
  });
})();
