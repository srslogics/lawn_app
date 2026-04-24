const stats = [
  { label: "Events booked", value: "28", detail: "9 premium celebrations this month" },
  { label: "Active vendors", value: "12", detail: "Decor, catering, lighting, music" },
  { label: "Open inquiries", value: "17", detail: "$42,000 potential revenue" },
  { label: "On-time setup", value: "98%", detail: "Above monthly benchmark" },
];

const jobs = [
  {
    client: "Sharma Wedding Reception",
    status: "Scheduled",
    statusClass: "scheduled",
    service: "Stage decor, lighting, guest seating",
    time: "08:00 AM",
    crew: "Venue Team A",
    note: "Floral arch and bridal entry path must be ready before 5:00 PM.",
  },
  {
    client: "Silver Oak Birthday Gala",
    status: "En Route",
    statusClass: "travel",
    service: "Catering, DJ, photo booth setup",
    time: "10:30 AM",
    crew: "Event Crew B",
    note: "Cake table and kids zone layout approved by client this morning.",
  },
  {
    client: "Verma Family Engagement",
    status: "Needs attention",
    statusClass: "attention",
    service: "Mandap decor and live music coordination",
    time: "01:15 PM",
    crew: "Coordination Team",
    note: "Awaiting final guest count confirmation for catering upgrade.",
  },
];

const clients = [
  {
    name: "Aarav and Meera",
    meta: "Wedding inquiry for 450 guests with floral stage and valet parking.",
    tags: ["Lead score 91", "Quote due today", "Premium package"],
  },
  {
    name: "Brightstar Corporate",
    meta: "Annual celebration booking request for an evening award function.",
    tags: ["Corporate client", "Indoor-outdoor plan", "Advance deposit"],
  },
  {
    name: "Neha Kapoor",
    meta: "Birthday lawn booking with custom decor and live dessert counters.",
    tags: ["High retention", "Special notes", "Weekend booking"],
  },
];

const equipment = [
  {
    name: "Royal Petals Decor",
    meta: "Main stage flowers, entry tunnel, and centerpieces confirmed for tonight.",
    tags: ["Ready", "Premium vendor", "On schedule"],
  },
  {
    name: "Spice Route Catering",
    meta: "Buffet for 400 guests with live counters and dessert island locked in.",
    tags: ["Menu approved", "Crew assigned", "Power needed"],
  },
  {
    name: "EchoLight Productions",
    meta: "Sound check at 4:00 PM with moving lights and LED backdrop installation.",
    tags: ["Inspection due", "Backup system", "Assigned"],
  },
];

const finance = [
  {
    name: "Outstanding balances",
    meta: "4 event balances totaling $12,800. Two are due within the next 3 days.",
    tags: ["Follow-up", "Payment reminders"],
  },
  {
    name: "Advance deposits",
    meta: "11 confirmed bookings have received deposits. 3 contracts await signature.",
    tags: ["Healthy pipeline", "Contract watch"],
  },
  {
    name: "Upsell opportunities",
    meta: "7 upcoming events match add-ons like premium lighting, valet, and live counters.",
    tags: ["Campaign ready", "Revenue lift"],
  },
];

function renderStats() {
  const statsGrid = document.getElementById("statsGrid");

  statsGrid.innerHTML = stats
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

function renderJobs() {
  const jobsList = document.getElementById("jobsList");

  jobsList.innerHTML = jobs
    .map(
      (job) => `
        <article class="job-card">
          <div class="job-header">
            <div>
              <h4>${job.client}</h4>
              <p class="item-meta">${job.note}</p>
            </div>
            <span class="status-pill status-${job.statusClass}">${job.status}</span>
          </div>
          <div class="job-meta">
            <span>${job.service}</span>
            <span>${job.time}</span>
            <span>${job.crew}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderStackItems(targetId, items) {
  const target = document.getElementById(targetId);

  target.innerHTML = items
    .map(
      (item) => `
        <article class="stack-item">
          <div class="item-header">
            <h4>${item.name}</h4>
          </div>
          <p class="item-meta">${item.meta}</p>
          <div class="item-tags">
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
  document.getElementById("newLeadBtn").addEventListener("click", () => {
    showToast("New booking workflow started: inquiry, package, payment, scheduling.");
  });

  document.getElementById("optimizeBtn").addEventListener("click", () => {
    showToast("Event plan opened: setup slots, vendor timing, and guest flow are aligned.");
  });
}

renderStats();
renderJobs();
renderStackItems("clientsList", clients);
renderStackItems("equipmentList", equipment);
renderStackItems("financeList", finance);
bindActions();
