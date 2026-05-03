const API_BASE =
  window.location.protocol === "file:"
    ? "http://127.0.0.1:4173/api"
    : `${window.location.origin}/api`;

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2600);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const payload = await response.json();
      message = payload.error || payload.detail || message;
    } catch {
      // ignore parse failure
    }
    throw new Error(message);
  }

  return response.json();
}

document.getElementById("enquiryForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);

  try {
    const roomsNeededValue = formData.get("roomsNeeded");
    await api("/enquiries", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        eventType: formData.get("eventType"),
        eventDate: formData.get("eventDate"),
        guestCount: Number(formData.get("guestCount")),
        budget: Number(formData.get("budget")),
        stayRequired: formData.get("stayRequired"),
        roomsNeeded: roomsNeededValue ? Number(roomsNeededValue) : null,
        message: formData.get("message")
      })
    });

    form.reset();
    showToast("Your enquiry has been sent. The venue team will contact you shortly.");
  } catch (error) {
    showToast(error.message);
  }
});
