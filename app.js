const requirements = [
  {
    title: "1. Booking and inquiry management",
    points: [
      "Lead capture form for weddings, receptions, birthdays, corporate events, and social functions.",
      "Availability check by date, time slot, lawn area, and package type.",
      "Quote builder with base package, custom decor, catering, lighting, sound, valet, and generator add-ons.",
      "Booking lifecycle from inquiry to visit, negotiation, token payment, contract confirmation, and final closure.",
    ],
  },
  {
    title: "2. Venue calendar and event scheduling",
    points: [
      "Full calendar view for booked dates, tentative holds, blocked maintenance days, and high-demand weekends.",
      "Separate setup, event, and teardown windows so multiple teams can be coordinated safely.",
      "Conflict prevention for overlapping decor crews, parking limits, or lawn capacity constraints.",
      "Event-day timeline with key milestones such as vendor arrival, stage readiness, baraat entry, dinner service, and closing.",
    ],
  },
  {
    title: "3. Client CRM and communication",
    points: [
      "Client profiles with family details, event type, guest count, preferences, and budget range.",
      "Conversation history for calls, site visits, WhatsApp follow-ups, quotation revisions, and approvals.",
      "Automated reminders for pending visits, balance due dates, document collection, and final confirmations.",
      "Notes for special requests like VIP lounge, bridal room, petal shower, alcohol rules, or late-night permissions.",
    ],
  },
  {
    title: "4. Package and pricing control",
    points: [
      "Create standard packages such as silver, gold, premium, and custom luxury.",
      "Manage pricing by season, weekday versus weekend, guest capacity, and lawn section usage.",
      "Allow package templates for weddings, mehndi, sangeet, engagement, birthday, and corporate functions.",
      "Track discount approvals so the owner knows when margins are being reduced.",
    ],
  },
  {
    title: "5. Vendor and service coordination",
    points: [
      "Vendor directory for decorators, caterers, DJs, photographers, makeup artists, security, valet, and housekeeping.",
      "Assignment of vendors per event with arrival time, service scope, contact person, and payment terms.",
      "Vendor check-in and readiness tracking on the event day.",
      "Backup vendor mapping in case of late arrival, no-show, or service failure.",
    ],
  },
  {
    title: "6. Event operations and staff management",
    points: [
      "Internal staff roster for manager, floor supervisor, gate team, valet, housekeeping, and electrical support.",
      "Task assignment list for setup, stage inspection, washroom checks, catering area readiness, and closing cleanup.",
      "Issue logging for power outage, rain response, parking congestion, food shortage, or decor damage.",
      "Real-time status dashboard for owner visibility across all active events.",
    ],
  },
  {
    title: "7. Guest, host, and facility planning",
    points: [
      "Guest count planning with seating, buffet flow, parking allocation, and crowd movement notes.",
      "Room allocation if the property has bridal rooms, changing rooms, or guest holding areas.",
      "Special access arrangements for VIP guests, elderly guests, and disabled access.",
      "Facility checklist for generators, washrooms, lighting zones, water points, and emergency exits.",
    ],
  },
  {
    title: "8. Finance, billing, and reporting",
    points: [
      "Token payment, advance deposit, installment, and final balance tracking per booking.",
      "Invoice and receipt generation for clients and payout tracking for vendors.",
      "Profitability view by package, month, event type, and vendor cost pattern.",
      "Reports for total inquiries, conversion rate, popular dates, peak seasons, revenue forecast, and overdue balances.",
    ],
  },
];

const stats = [
  { label: "Bookings this month", value: "28", detail: "16 weddings, 7 receptions, 5 private events" },
  { label: "Open inquiries", value: "17", detail: "Strong demand for next quarter weekends" },
  { label: "Active vendors", value: "12", detail: "Decor, lights, sound, catering, photo, valet" },
  { label: "Advance collected", value: "$41.2k", detail: "Healthy pipeline secured by deposits" },
];

const timeline = [
  {
    title: "Malhotra Wedding",
    status: "Ready",
    statusClass: "ready",
    note: "Stage design approved. Catering prep starts after decor load-in.",
    tags: ["Setup 4:00 PM", "Guests 7:30 PM", "450 pax", "Main lawn"],
  },
  {
    title: "Khanna Reception",
    status: "In progress",
    statusClass: "moving",
    note: "Sound team is on site. Valet lane needs an extra two attendants by evening.",
    tags: ["DJ 5:00 PM", "Dinner 8:30 PM", "320 pax", "Sunset deck"],
  },
  {
    title: "Verma Engagement",
    status: "Risk",
    statusClass: "risk",
    note: "Client has not yet confirmed final guest count, affecting catering and seating layout.",
    tags: ["Hold guest count", "Decor pending", "280 pax", "North lawn"],
  },
];

const clients = [
  {
    name: "Aarav and Meera",
    meta: "Wedding lead for February with premium floral entry, LED wall, and valet parking.",
    tags: ["Visit tomorrow", "Budget premium", "High intent"],
  },
  {
    name: "Brightstar Industries",
    meta: "Corporate annual celebration asking for stage branding, lounge seating, and live counters.",
    tags: ["Corporate", "Quote sent", "Weekend hold"],
  },
  {
    name: "Neha Kapoor",
    meta: "Birthday booking wants custom pastel decor, dessert island, and kids activity corner.",
    tags: ["Token pending", "Custom decor", "Saturday slot"],
  },
];

const vendors = [
  {
    name: "Royal Petals Decor",
    meta: "Handles wedding stage, floral tunnel, welcome signage, and table centerpieces.",
    tags: ["Confirmed", "Vendor captain", "Premium tier"],
  },
  {
    name: "Spice Route Catering",
    meta: "Large-scale buffet partner with live counters and dessert service for 500+ guests.",
    tags: ["Menu locked", "Power required", "Payment split"],
  },
  {
    name: "EchoLight Productions",
    meta: "Covers sound, truss, moving lights, LED wall, and backup console support.",
    tags: ["Sound check", "Backup ready", "Night event"],
  },
];

const finance = [
  {
    name: "Pending balances",
    meta: "4 confirmed events still have final balances due within the next 7 days.",
    tags: ["Reminder due", "Collections watch"],
  },
  {
    name: "Vendor payouts",
    meta: "Decor and lighting advances released. Catering payout linked to final guest count.",
    tags: ["Controlled release", "Approval needed"],
  },
  {
    name: "Revenue insight",
    meta: "Premium wedding package is currently the highest-margin offering this quarter.",
    tags: ["Top performer", "Upsell chance"],
  },
];

function renderStats() {
  document.getElementById("statsGrid").innerHTML = stats
    .map(
      (stat) => `
        <article class="stat-card">
          <span>${stat.label}</span>
          <strong>${stat.value}</strong>
          <small>${stat.detail}</small>
        </article>
      `,
    )
    .join("");
}

function renderRequirements() {
  document.getElementById("requirementsGrid").innerHTML = requirements
    .map(
      (item) => `
        <article class="requirement-card">
          <h4>${item.title}</h4>
          <ul class="bullet-list">
            ${item.points.map((point) => `<li>${point}</li>`).join("")}
          </ul>
        </article>
      `,
    )
    .join("");
}

function renderTimeline() {
  document.getElementById("timelineList").innerHTML = timeline
    .map(
      (item) => `
        <article class="timeline-card">
          <div class="card-head">
            <div>
              <h4>${item.title}</h4>
              <p>${item.note}</p>
            </div>
            <span class="status-pill status-${item.statusClass}">${item.status}</span>
          </div>
          <div class="tag-row">
            ${item.tags.map((tag) => `<span>${tag}</span>`).join("")}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderStack(targetId, items) {
  document.getElementById(targetId).innerHTML = items
    .map(
      (item) => `
        <article class="stack-item">
          <div class="item-head">
            <h4>${item.name}</h4>
          </div>
          <p>${item.meta}</p>
          <div class="tag-row">
            ${item.tags.map((tag) => `<span>${tag}</span>`).join("")}
          </div>
        </article>
      `,
    )
    .join("");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 2600);
}

function bindActions() {
  document.getElementById("bookingBtn").addEventListener("click", () => {
    showToast("Booking flow: inquiry, site visit, package, deposit, contract.");
  });

  document.getElementById("opsBtn").addEventListener("click", () => {
    showToast("Operations focus: vendor arrivals, event timings, risk checkpoints.");
  });
}

renderStats();
renderRequirements();
renderTimeline();
renderStack("clientsList", clients);
renderStack("vendorsList", vendors);
renderStack("financeList", finance);
bindActions();
