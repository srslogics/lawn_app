const PUBLIC_API_BASE =
  window.location.protocol === "file:"
    ? "http://127.0.0.1:4173/api"
    : `${window.location.origin}/api`;

function activateFaqToggles() {
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
}

function formatDisplayDate(isoDate) {
  const parsed = new Date(`${isoDate}T00:00:00`);
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  });
}

function renderAvailabilityMonths(months) {
  const root = document.getElementById("availabilityMonths");
  if (!root) {
    return;
  }

  root.innerHTML =
    months
      .map(
        (month) => `
          <article class="availability-month">
            <strong>${month.label}</strong>
            <div class="availability-days">
              ${month.days
                .map(
                  (day) => `
                    <div class="availability-day availability-day--${day.status}" title="${day.iso} · ${day.note || "Unavailable"}">
                      <span>${day.weekday}</span>
                      <strong>${day.day}</strong>
                    </div>
                  `
                )
                .join("")}
            </div>
          </article>
        `
      )
      .join("");
}

function renderAvailabilitySummary(nextBusyDates) {
  const root = document.getElementById("availabilitySummary");
  if (!root) {
    return;
  }

  if (!nextBusyDates.length) {
    root.innerHTML = `
      <strong>Most upcoming dates are currently open.</strong>
      <p>This is a good time to shortlist your preferred wedding or event date and enquire early.</p>
    `;
    return;
  }

  const highlighted = nextBusyDates
    .slice(0, 4)
    .map((item) => {
      const label = item.status === "booked" ? "Booked" : "High interest";
      return `<span>${formatDisplayDate(item.date)} · ${label}</span>`;
    })
    .join("");

  root.innerHTML = `
    <strong>Popular dates are filling first.</strong>
    <p>If your function is planned near these dates, send your enquiry early so the venue team can guide availability and stay planning.</p>
    <div class="availability-highlights">${highlighted}</div>
  `;
}

async function loadAvailability() {
  const monthsRoot = document.getElementById("availabilityMonths");
  const summaryRoot = document.getElementById("availabilitySummary");
  if (!monthsRoot || !summaryRoot) {
    return;
  }

  try {
    const response = await fetch(`${PUBLIC_API_BASE}/public-availability`);
    if (!response.ok) {
      throw new Error("Could not load availability");
    }

    const payload = await response.json();
    renderAvailabilitySummary(payload.nextBusyDates || []);
    renderAvailabilityMonths(payload.months || []);
  } catch (error) {
    summaryRoot.innerHTML = `
      <strong>Need a date check?</strong>
      <p>Availability could not load right now. Use enquiry or WhatsApp and the venue team will confirm your date.</p>
    `;
    monthsRoot.innerHTML = `<div class="availability-empty">Live availability is temporarily unavailable.</div>`;
  }
}

activateFaqToggles();
loadAvailability();
