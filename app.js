const stats = [
  { label: "Jobs booked", value: "128", detail: "22 recurring this week" },
  { label: "Active crews", value: "4", detail: "11 field staff assigned" },
  { label: "Open estimates", value: "17", detail: "$9,420 potential revenue" },
  { label: "On-time rate", value: "96%", detail: "Above monthly benchmark" },
];

const jobs = [
  {
    client: "Willow Creek Residence",
    status: "Scheduled",
    statusClass: "scheduled",
    service: "Mow, edge, blow",
    time: "08:00 AM",
    crew: "Crew A",
    note: "Front hedge trim requested before guests arrive.",
  },
  {
    client: "Maple Grove Offices",
    status: "En Route",
    statusClass: "travel",
    service: "Weekly grounds maintenance",
    time: "10:30 AM",
    crew: "Crew B",
    note: "Irrigation line near east lawn marked for caution.",
  },
  {
    client: "Harbor Lane Villa",
    status: "Needs attention",
    statusClass: "attention",
    service: "Fertilizing + weed control",
    time: "01:15 PM",
    crew: "Crew C",
    note: "Awaiting customer approval on premium treatment add-on.",
  },
];

const clients = [
  {
    name: "Samantha Reed",
    meta: "Seasonal cleanup request for a 9,000 sq ft property.",
    tags: ["Lead score 82", "Quote due today", "Premium plan"],
  },
  {
    name: "Oakview HOA",
    meta: "Renewal window opens in 5 days for common-area maintenance.",
    tags: ["Annual contract", "3 zones", "Auto invoice"],
  },
  {
    name: "Jordan Patel",
    meta: "Requested pet-safe treatment and Saturday morning service.",
    tags: ["High retention", "Special notes", "Text reminders"],
  },
];

const equipment = [
  {
    name: "Toro GrandStand 48",
    meta: "127 hours logged. Blade replacement due in 6 hours.",
    tags: ["Ready", "Fuel full", "Maintenance soon"],
  },
  {
    name: "Stihl Trimmer Kit",
    meta: "One unit checked out. Spare line inventory below threshold.",
    tags: ["Consumables low", "Crew B", "Restock"],
  },
  {
    name: "Work Trailer 02",
    meta: "Tire inspection flagged for next Monday before route dispatch.",
    tags: ["Inspection due", "Road-safe", "Assigned"],
  },
];

const finance = [
  {
    name: "Outstanding invoices",
    meta: "6 unpaid invoices totaling $3,180. Oldest is 12 days overdue.",
    tags: ["Follow-up", "Email reminders"],
  },
  {
    name: "Subscription plans",
    meta: "44 clients on recurring monthly plans. Churn risk on 3 accounts.",
    tags: ["Stable MRR", "Renewal watch"],
  },
  {
    name: "Upsell opportunities",
    meta: "11 mowing clients match aeration and mulch add-on criteria.",
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
    showToast("New client workflow started: intake, estimate, scheduling.");
  });

  document.getElementById("optimizeBtn").addEventListener("click", () => {
    showToast("Route optimization suggested a 14% reduction in drive time.");
  });
}

renderStats();
renderJobs();
renderStackItems("clientsList", clients);
renderStackItems("equipmentList", equipment);
renderStackItems("financeList", finance);
bindActions();
