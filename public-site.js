const PUBLIC_API_BASE =
  window.location.protocol === "file:"
    ? "http://127.0.0.1:8000/api"
    : `${window.location.origin}/api`;

function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (!toggle || !nav) return;

  const close = () => {
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const opening = !document.body.classList.contains("nav-open");
    document.body.classList.toggle("nav-open", opening);
    toggle.setAttribute("aria-expanded", String(opening));
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

function setupFaqs() {
  document.querySelectorAll(".faq-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const answer = button.nextElementSibling;
      const willOpen = button.getAttribute("aria-expanded") !== "true";

      document.querySelectorAll(".faq-toggle").forEach((item) => {
        item.setAttribute("aria-expanded", "false");
        item.nextElementSibling?.classList.remove("is-open");
      });

      if (willOpen) {
        button.setAttribute("aria-expanded", "true");
        answer?.classList.add("is-open");
      }
    });
  });
}

function setupReveals() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((item) => observer.observe(item));
}

function setupGallery() {
  const dialog = document.getElementById("lightbox");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const image = dialog.querySelector("img");
  const caption = dialog.querySelector("p");
  const closeButton = dialog.querySelector(".lightbox__close");

  document.querySelectorAll(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => {
      const source = item.querySelector("img");
      if (!source || !image || !caption) return;
      image.src = source.currentSrc || source.src;
      image.alt = source.alt;
      caption.textContent = source.alt;
      dialog.showModal();
    });
  });

  closeButton?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function formatDisplayDate(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  });
}

function renderAvailabilityMonths(months) {
  const root = document.getElementById("availabilityMonths");
  if (!root) return;

  root.innerHTML = months
    .map(
      (month) => `
        <article class="availability-month">
          <strong>${month.label}</strong>
          <div class="availability-days">
            ${month.days
              .map(
                (day) => `
                  <div class="availability-day availability-day--${day.status}" title="${day.iso} · ${day.note || "Open"}">
                    <span>${day.weekday}</span>
                    <strong>${day.day}</strong>
                  </div>`
              )
              .join("")}
          </div>
        </article>`
    )
    .join("");
}

function renderAvailabilitySummary(nextBusyDates) {
  const root = document.getElementById("availabilitySummary");
  if (!root) return;

  if (!nextBusyDates.length) {
    root.innerHTML = `<strong>Most upcoming dates are open.</strong><p>Share your preferred date and our team will confirm it personally.</p>`;
    return;
  }

  const dates = nextBusyDates
    .slice(0, 4)
    .map((item) => `<span>${formatDisplayDate(item.date)} · ${item.status === "booked" ? "Booked" : "High interest"}</span>`)
    .join("");

  root.innerHTML = `<strong>Popular dates are moving first.</strong><p>Ask early if your celebration is close to these dates.</p><div class="availability-highlights">${dates}</div>`;
}

async function loadAvailability() {
  const monthsRoot = document.getElementById("availabilityMonths");
  const summaryRoot = document.getElementById("availabilitySummary");
  if (!monthsRoot || !summaryRoot) return;

  try {
    const response = await fetch(`${PUBLIC_API_BASE}/public-availability`);
    if (!response.ok) throw new Error("Could not load availability");
    const payload = await response.json();
    renderAvailabilitySummary(payload.nextBusyDates || []);
    renderAvailabilityMonths(payload.months || []);
  } catch {
    summaryRoot.innerHTML = `<strong>Need a date check?</strong><p>Call or WhatsApp the venue team for current availability.</p>`;
    monthsRoot.innerHTML = `<div class="availability-empty">Live dates are temporarily unavailable.</div>`;
  }
}

document.documentElement.classList.add("js-enhanced");
setupNavigation();
setupFaqs();
setupReveals();
setupGallery();
loadAvailability();
