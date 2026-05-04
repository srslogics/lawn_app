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

function scrollToTarget(selector) {
  const target = document.querySelector(selector);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function applyEnquiryPreset(button) {
  const form = document.getElementById("enquiryForm");
  if (!form) {
    return;
  }

  const eventType = button.dataset.eventType;
  const notePrefix = button.dataset.notePrefix;
  const eventTypeField = form.elements.eventType;
  const messageField = form.elements.message;

  if (eventType && eventTypeField) {
    eventTypeField.value = eventType;
  }

  if (notePrefix && messageField && !String(messageField.value || "").trim()) {
    messageField.value = `${notePrefix} `;
  }
}

function syncRoomsField() {
  const stayRequired = document.getElementById("stayRequired");
  const roomsNeeded = document.getElementById("roomsNeeded");

  if (!stayRequired || !roomsNeeded) {
    return;
  }

  const disabled = stayRequired.value === "No";
  roomsNeeded.disabled = disabled;
  roomsNeeded.required = stayRequired.value === "Yes";

  if (disabled) {
    roomsNeeded.value = "";
  }
}

function setupRevealAnimations() {
  const reveals = document.querySelectorAll(".reveal");

  if (!reveals.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14
    }
  );

  reveals.forEach((element) => observer.observe(element));
}

document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    const selector = button.dataset.scroll;
    if (!selector) {
      return;
    }

    applyEnquiryPreset(button);
    scrollToTarget(selector);
  });
});

document.querySelectorAll(".faq-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const answer = button.nextElementSibling;
    const isExpanded = button.getAttribute("aria-expanded") === "true";

    document.querySelectorAll(".faq-toggle").forEach((otherButton) => {
      otherButton.setAttribute("aria-expanded", "false");
      otherButton.nextElementSibling?.classList.remove("is-open");
    });

    if (!isExpanded) {
      button.setAttribute("aria-expanded", "true");
      answer?.classList.add("is-open");
    }
  });
});

document.getElementById("stayRequired")?.addEventListener("change", syncRoomsField);
syncRoomsField();
setupRevealAnimations();

document.getElementById("enquiryForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const submitButton = form.querySelector(".submit-btn");

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add("is-loading");
      submitButton.textContent = "Sending enquiry...";
    }

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
    syncRoomsField();
    showToast("Your enquiry has been sent. The venue team will contact you shortly.");
  } catch (error) {
    showToast(error.message);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove("is-loading");
      submitButton.textContent = "Send enquiry";
    }
  }
});
