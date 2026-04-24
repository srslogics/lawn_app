const STORAGE_KEY = "celebration-lawn-command-data";

const seedData = {
  bookings: [
    {
      id: "B001",
      clientName: "Aarav Sharma",
      eventType: "Wedding",
      eventDate: "2026-05-10",
      guestCount: 450,
      packageName: "Premium",
      advancePaid: 3200,
      notes: "Floral tunnel, LED wall, valet, VIP seating, bridal lounge.",
      status: "Confirmed",
      manager: "Ritika",
      lawnArea: "Main Lawn",
    },
    {
      id: "B002",
      clientName: "Khanna Family",
      eventType: "Reception",
      eventDate: "2026-05-14",
      guestCount: 320,
      packageName: "Gold",
      advancePaid: 1800,
      notes: "Live counters, elevated stage lighting, family lounge seating.",
      status: "Upcoming",
      manager: "Raghav",
      lawnArea: "Sunset Deck",
    },
    {
      id: "B003",
      clientName: "Brightstar Industries",
      eventType: "Corporate",
      eventDate: "2026-05-21",
      guestCount: 260,
      packageName: "Custom Luxury",
      advancePaid: 4000,
      notes: "Branding wall, guest lounge, formal stage program, AV support.",
      status: "Inquiry",
      manager: "Mira",
      lawnArea: "North Lawn",
    },
    {
      id: "B004",
      clientName: "Neha Kapoor",
      eventType: "Birthday",
      eventDate: "2026-05-24",
      guestCount: 180,
      packageName: "Silver",
      advancePaid: 900,
      notes: "Kids activity zone, dessert island, pastel decor setup.",
      status: "Upcoming",
      manager: "Ritika",
      lawnArea: "Garden Court",
    },
  ],
  clients: [
    {
      id: "C001",
      name: "Neha Kapoor",
      phone: "+91 9810011223",
      email: "neha@example.com",
      stage: "Booked",
      preferences: "Pastel decor, dessert island, kids activity corner.",
    },
    {
      id: "C002",
      name: "Aarav Sharma",
      phone: "+91 9822244466",
      email: "aarav@example.com",
      stage: "Site Visit",
      preferences: "Bridal entry path, valet, separate VIP lounge.",
    },
    {
      id: "C003",
      name: "Brightstar Industries",
      phone: "+91 9900099900",
      email: "events@brightstar.com",
      stage: "Quoted",
      preferences: "Corporate branding, projection wall, formal seating blocks.",
    },
  ],
  vendors: [
    {
      id: "V001",
      name: "Royal Petals Decor",
      category: "Decor",
      contactPerson: "Rajiv",
      phone: "+91 9700001122",
      status: "Preferred",
      notes: "Strong for weddings and stage styling.",
    },
    {
      id: "V002",
      name: "Spice Route Catering",
      category: "Catering",
      contactPerson: "Mahesh",
      phone: "+91 9711100012",
      status: "Active",
      notes: "Large-scale buffet and live counters.",
    },
    {
      id: "V003",
      name: "EchoLight Productions",
      category: "Lighting",
      contactPerson: "Rohit",
      phone: "+91 9777701010",
      status: "Backup",
      notes: "Night events, moving heads, LED wall setup.",
    },
  ],
  payments: [
    {
      id: "P001",
      clientName: "Aarav Sharma",
      paymentType: "Advance",
      amount: 3200,
      status: "Received",
      notes: "Bank transfer completed.",
    },
    {
      id: "P002",
      clientName: "Khanna Family",
      paymentType: "Installment",
      amount: 1200,
      status: "Pending",
      notes: "Due next week after menu lock.",
    },
    {
      id: "P003",
      clientName: "Brightstar Industries",
      paymentType: "Token",
      amount: 1500,
      status: "Pending",
      notes: "Waiting for finance approval from client side.",
    },
  ],
  tasks: [
    {
      id: "T001",
      title: "Confirm stage floral design",
      owner: "Decor team",
      due: "Today 1:00 PM",
      status: "Upcoming",
    },
    {
      id: "T002",
      title: "Check valet lane flow",
      owner: "Operations manager",
      due: "Today 5:30 PM",
      status: "Upcoming",
    },
    {
      id: "T003",
      title: "Collect pending installment",
      owner: "Finance desk",
      due: "Tomorrow",
      status: "Risk",
    },
  ],
  requirements: [
    {
      title: "Booking lifecycle",
      description: "Inquiry, site visit, quote, token, contract, confirmed booking, balance tracking.",
    },
    {
      title: "Venue calendar",
      description: "Date locks, setup windows, teardown slots, conflict detection, and lawn utilization.",
    },
    {
      title: "Client CRM",
      description: "Profiles, preferences, communication history, approvals, and lead stages.",
    },
    {
      title: "Vendor coordination",
      description: "Decor, catering, lighting, sound, security, valet, and backup partner mapping.",
    },
    {
      title: "Event-day operations",
      description: "Setup status, task assignment, readiness checks, and issue escalation.",
    },
    {
      title: "Finance control",
      description: "Deposits, balances, receipts, payout visibility, and revenue reporting.",
    },
  ],
  activity: [
    "Khanna Family payment marked pending for follow-up.",
    "Brightstar Industries quote sent with custom luxury package.",
    "Royal Petals Decor confirmed for May premium wedding slot.",
    "Aarav Sharma booking moved to Confirmed.",
  ],
};

let state = loadState();
let uiState = {
  selectedBookingId: state.bookings[0]?.id || null,
  bookingFilter: "All",
  globalSearch: "",
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : structuredClone(seedData);
  } catch (error) {
    return structuredClone(seedData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function nextId(prefix, list) {
  return `${prefix}${String(list.length + 1).padStart(3, "0")}`;
}

function safeStatusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2500);
}

function setView(view) {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  document.querySelectorAll(".view").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === view);
  });

  const titleMap = {
    dashboard: "Dashboard",
    bookings: "Bookings",
    calendar: "Calendar",
    clients: "Clients",
    vendors: "Vendors",
    finance: "Finance",
    settings: "Settings",
  };

  document.getElementById("viewTitle").textContent = titleMap[view] || "Dashboard";
}

function matchGlobalSearch(text) {
  return text.toLowerCase().includes(uiState.globalSearch.trim().toLowerCase());
}

function getFilteredBookings() {
  const query = document.getElementById("bookingSearch")?.value?.trim().toLowerCase() || "";

  return state.bookings.filter((booking) => {
    const matchesViewFilter =
      uiState.bookingFilter === "All" || booking.status === uiState.bookingFilter;
    const matchesLocalSearch =
      !query ||
      booking.clientName.toLowerCase().includes(query) ||
      booking.eventType.toLowerCase().includes(query) ||
      booking.packageName.toLowerCase().includes(query);
    const matchesGlobal =
      !uiState.globalSearch ||
      matchGlobalSearch(
        `${booking.clientName} ${booking.eventType} ${booking.packageName} ${booking.notes}`,
      );

    return matchesViewFilter && matchesLocalSearch && matchesGlobal;
  });
}

function getSelectedBooking() {
  const filtered = getFilteredBookings();
  if (!filtered.length) return null;

  const selected = filtered.find((booking) => booking.id === uiState.selectedBookingId);
  if (selected) return selected;

  uiState.selectedBookingId = filtered[0].id;
  return filtered[0];
}

function renderSidebarCard() {
  const confirmed = state.bookings.filter((booking) => booking.status === "Confirmed").length;
  const pendingCollections = state.payments
    .filter((payment) => payment.status === "Pending")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  document.getElementById("sidebarCard").innerHTML = `
    <p class="eyebrow">Today on site</p>
    <strong>${confirmed} confirmed event${confirmed === 1 ? "" : "s"}</strong>
    <span>${money(pendingCollections)} still pending in collections across live records.</span>
  `;
}

function renderStats() {
  const totalBookings = state.bookings.length;
  const inquiries = state.bookings.filter((booking) => booking.status === "Inquiry").length;
  const upcoming = state.bookings.filter((booking) => booking.status === "Upcoming").length;
  const received = state.payments
    .filter((payment) => payment.status === "Received")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const stats = [
    {
      label: "Total bookings",
      value: totalBookings,
      detail: "All inquiry and confirmed booking records",
    },
    {
      label: "Open inquiries",
      value: inquiries,
      detail: "Leads that still need conversion follow-up",
    },
    {
      label: "Upcoming events",
      value: upcoming,
      detail: "Confirmed execution work scheduled next",
    },
    {
      label: "Payments received",
      value: money(received),
      detail: "Tracked from token to final balance entries",
    },
  ];

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

function detailCard(title, subtitle, status, tags) {
  return `
    <article class="detail-card">
      <div class="section-heading compact-heading">
        <div>
          <h4>${title}</h4>
          <p>${subtitle}</p>
        </div>
        <span class="status-pill status-${safeStatusClass(status)}">${status}</span>
      </div>
      <div class="tag-row">
        ${tags.map((tag) => `<span>${tag}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderToday() {
  const sorted = [...state.bookings].sort((a, b) => a.eventDate.localeCompare(b.eventDate)).slice(0, 4);
  document.getElementById("todayList").innerHTML =
    sorted
      .map((booking) =>
        detailCard(
          `${booking.clientName} • ${booking.eventType}`,
          `${booking.eventDate} · ${booking.guestCount} guests · ${booking.manager} managing`,
          booking.status,
          [booking.packageName, booking.lawnArea, money(Number(booking.advancePaid))],
        ),
      )
      .join("") || `<div class="empty-state">No booking records yet.</div>`;
}

function renderTasks() {
  document.getElementById("tasksList").innerHTML =
    state.tasks
      .map((task) =>
        detailCard(task.title, `${task.owner} · ${task.due}`, task.status, [task.id]),
      )
      .join("") || `<div class="empty-state">No tasks yet.</div>`;
}

function renderCollectionsSummary() {
  const pendingPayments = state.payments.filter((payment) => payment.status === "Pending");
  const totalPending = pendingPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalReceived = state.payments
    .filter((payment) => payment.status === "Received")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const financeMarkup = `
    <span>Collection summary</span>
    <strong>${money(totalReceived)}</strong>
    <p>${money(totalPending)} still pending across ${pendingPayments.length} payment record${pendingPayments.length === 1 ? "" : "s"}.</p>
  `;

  document.getElementById("financeHighlight").innerHTML = financeMarkup;
  document.getElementById("dashboardFinanceHighlight").innerHTML = financeMarkup;

  document.getElementById("collectionsList").innerHTML =
    pendingPayments
      .map(
        (payment) => `
          <article class="mini-item">
            <strong>${payment.clientName}</strong>
            <p>${payment.paymentType} · ${money(Number(payment.amount))} · ${payment.notes}</p>
          </article>
        `,
      )
      .join("") || `<div class="empty-state">No pending payments.</div>`;
}

function renderActivity() {
  document.getElementById("activityList").innerHTML = state.activity
    .map(
      (item) => `
        <article class="mini-item">
          <strong>Activity</strong>
          <p>${item}</p>
        </article>
      `,
    )
    .join("");
}

function renderBookingsTable() {
  const bookings = getFilteredBookings();
  const selected = getSelectedBooking();

  document.getElementById("bookingsTableBody").innerHTML =
    bookings
      .map(
        (booking) => `
          <tr class="table-row ${selected?.id === booking.id ? "active" : ""}" data-booking-id="${booking.id}">
            <td>
              <div class="table-primary">${booking.clientName}</div>
              <div class="table-secondary">${booking.eventType} · ${booking.lawnArea}</div>
            </td>
            <td>${booking.eventDate}</td>
            <td>${booking.guestCount}</td>
            <td>${booking.packageName}</td>
            <td>${money(Number(booking.advancePaid))}</td>
            <td><span class="status-pill status-${safeStatusClass(booking.status)}">${booking.status}</span></td>
          </tr>
        `,
      )
      .join("") || `
        <tr>
          <td colspan="6">
            <div class="empty-state">No bookings match the current filters.</div>
          </td>
        </tr>
      `;

  document.querySelectorAll("[data-booking-id]").forEach((row) => {
    row.addEventListener("click", () => {
      uiState.selectedBookingId = row.dataset.bookingId;
      renderBookingsTable();
      renderBookingDetail();
    });
  });
}

function renderBookingDetail() {
  const booking = getSelectedBooking();
  const detail = document.getElementById("bookingDetail");

  if (!booking) {
    detail.innerHTML = `<div class="empty-state">Select a booking to review details.</div>`;
    return;
  }

  const relatedClient = state.clients.find((client) => client.name === booking.clientName);
  const relatedPayments = state.payments.filter((payment) => payment.clientName === booking.clientName);
  const paymentSummary = relatedPayments.length
    ? relatedPayments.map((payment) => `${payment.paymentType}: ${money(Number(payment.amount))}`).join(" · ")
    : "No payments linked yet";

  detail.innerHTML = `
    <article class="detail-card">
      <div class="section-heading compact-heading">
        <div>
          <h4>${booking.clientName}</h4>
          <p>${booking.eventType} · ${booking.eventDate} · ${booking.id}</p>
        </div>
        <span class="status-pill status-${safeStatusClass(booking.status)}">${booking.status}</span>
      </div>

      <div class="detail-grid">
        <div class="detail-metric">
          <span>Guest count</span>
          <strong>${booking.guestCount}</strong>
        </div>
        <div class="detail-metric">
          <span>Advance</span>
          <strong>${money(Number(booking.advancePaid))}</strong>
        </div>
        <div class="detail-metric">
          <span>Package</span>
          <strong>${booking.packageName}</strong>
        </div>
        <div class="detail-metric">
          <span>Area</span>
          <strong>${booking.lawnArea}</strong>
        </div>
      </div>

      <p>${booking.notes}</p>

      <div class="tag-row">
        <span>Manager: ${booking.manager}</span>
        <span>Payments: ${relatedPayments.length}</span>
      </div>

      <div class="mini-list">
        <article class="mini-item">
          <strong>Client contact</strong>
          <p>${relatedClient ? `${relatedClient.phone} · ${relatedClient.email}` : "No linked client record yet."}</p>
        </article>
        <article class="mini-item">
          <strong>Payment summary</strong>
          <p>${paymentSummary}</p>
        </article>
      </div>

      <div class="detail-actions">
        <button class="row-action" data-status-action="Inquiry">Mark Inquiry</button>
        <button class="row-action" data-status-action="Upcoming">Mark Upcoming</button>
        <button class="row-action" data-status-action="Confirmed">Mark Confirmed</button>
      </div>
    </article>
  `;

  detail.querySelectorAll("[data-status-action]").forEach((button) => {
    button.addEventListener("click", () => {
      booking.status = button.dataset.statusAction;
      state.activity.unshift(`${booking.clientName} moved to ${booking.status}.`);
      state.activity = state.activity.slice(0, 8);
      saveState();
      renderAll();
      showToast(`Booking marked ${booking.status}.`);
    });
  });
}

function renderClientsTable() {
  const rows = state.clients.filter((client) => {
    if (!uiState.globalSearch) return true;
    return matchGlobalSearch(`${client.name} ${client.email} ${client.preferences}`);
  });

  document.getElementById("clientsTableBody").innerHTML =
    rows
      .map(
        (client) => `
          <tr>
            <td class="table-primary">${client.name}</td>
            <td>${client.phone}</td>
            <td>${client.email}</td>
            <td><span class="status-pill status-${safeStatusClass(client.stage)}">${client.stage}</span></td>
            <td>${client.preferences}</td>
          </tr>
        `,
      )
      .join("") || `
        <tr>
          <td colspan="5"><div class="empty-state">No client records match the search.</div></td>
        </tr>
      `;
}

function renderVendorsTable() {
  const rows = state.vendors.filter((vendor) => {
    if (!uiState.globalSearch) return true;
    return matchGlobalSearch(`${vendor.name} ${vendor.category} ${vendor.notes}`);
  });

  document.getElementById("vendorsTableBody").innerHTML =
    rows
      .map(
        (vendor) => `
          <tr>
            <td>
              <div class="table-primary">${vendor.name}</div>
              <div class="table-secondary">${vendor.notes}</div>
            </td>
            <td>${vendor.category}</td>
            <td>${vendor.contactPerson}</td>
            <td>${vendor.phone}</td>
            <td><span class="status-pill status-${safeStatusClass(vendor.status)}">${vendor.status}</span></td>
          </tr>
        `,
      )
      .join("") || `
        <tr>
          <td colspan="5"><div class="empty-state">No vendor records match the search.</div></td>
        </tr>
      `;
}

function renderPaymentsTable() {
  const rows = state.payments.filter((payment) => {
    if (!uiState.globalSearch) return true;
    return matchGlobalSearch(`${payment.clientName} ${payment.paymentType} ${payment.notes}`);
  });

  document.getElementById("paymentsTableBody").innerHTML =
    rows
      .map(
        (payment) => `
          <tr>
            <td class="table-primary">${payment.clientName}</td>
            <td>${payment.paymentType}</td>
            <td>${money(Number(payment.amount))}</td>
            <td><span class="status-pill status-${safeStatusClass(payment.status)}">${payment.status}</span></td>
            <td>${payment.notes}</td>
          </tr>
        `,
      )
      .join("") || `
        <tr>
          <td colspan="5"><div class="empty-state">No payment records match the search.</div></td>
        </tr>
      `;
}

function renderCalendar() {
  const grouped = state.bookings.reduce((acc, booking) => {
    const key = booking.eventDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(booking);
    return acc;
  }, {});

  const upcomingDates = Object.keys(grouped).sort().slice(0, 6);

  document.getElementById("calendarBoard").innerHTML =
    upcomingDates
      .map(
        (date) => `
          <article class="calendar-column">
            <h4>${date}</h4>
            ${grouped[date]
              .map(
                (booking) => `
                  <div class="calendar-slot">
                    <strong>${booking.clientName}</strong>
                    <div>${booking.eventType} · ${booking.guestCount} guests</div>
                    <div>${booking.packageName} · ${booking.manager}</div>
                  </div>
                `,
              )
              .join("")}
          </article>
        `,
      )
      .join("") || `<div class="empty-state">No calendar items yet.</div>`;
}

function renderRequirements() {
  document.getElementById("requirementsGrid").innerHTML = state.requirements
    .map(
      (item) => `
        <article class="requirement-card">
          <h4>${item.title}</h4>
          <p>${item.description}</p>
        </article>
      `,
    )
    .join("");
}

function renderFilterState() {
  document.querySelectorAll(".filter-chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === uiState.bookingFilter);
  });
}

function renderAll() {
  renderSidebarCard();
  renderStats();
  renderToday();
  renderTasks();
  renderCollectionsSummary();
  renderActivity();
  renderFilterState();
  renderBookingsTable();
  renderBookingDetail();
  renderClientsTable();
  renderVendorsTable();
  renderPaymentsTable();
  renderCalendar();
  renderRequirements();
}

function resetForms() {
  document.getElementById("bookingForm").reset();
  document.getElementById("clientForm").reset();
  document.getElementById("vendorForm").reset();
  document.getElementById("paymentForm").reset();
}

function bindNavigation() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.querySelectorAll("[data-goto]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.goto));
  });
}

function bindFilters() {
  document.querySelectorAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.bookingFilter = button.dataset.filter;
      renderAll();
    });
  });

  document.getElementById("bookingSearch").addEventListener("input", () => {
    renderAll();
  });

  document.getElementById("globalSearch").addEventListener("input", (event) => {
    uiState.globalSearch = event.target.value;
    renderAll();
  });
}

function bindForms() {
  document.getElementById("bookingForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newBooking = {
      id: nextId("B", state.bookings),
      clientName: formData.get("clientName"),
      eventType: formData.get("eventType"),
      eventDate: formData.get("eventDate"),
      guestCount: Number(formData.get("guestCount")),
      packageName: formData.get("packageName"),
      advancePaid: Number(formData.get("advancePaid")),
      notes: formData.get("notes"),
      status: "Inquiry",
      manager: "Unassigned",
      lawnArea: "Main Lawn",
    };
    state.bookings.unshift(newBooking);
    uiState.selectedBookingId = newBooking.id;
    state.activity.unshift(`${newBooking.clientName} booking created as Inquiry.`);
    state.activity = state.activity.slice(0, 8);
    saveState();
    renderAll();
    event.currentTarget.reset();
    showToast("Booking saved.");
  });

  document.getElementById("clientForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.clients.unshift({
      id: nextId("C", state.clients),
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      stage: formData.get("stage"),
      preferences: formData.get("preferences"),
    });
    state.activity.unshift(`${formData.get("name")} added to CRM.`);
    state.activity = state.activity.slice(0, 8);
    saveState();
    renderAll();
    event.currentTarget.reset();
    showToast("Client saved.");
  });

  document.getElementById("vendorForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.vendors.unshift({
      id: nextId("V", state.vendors),
      name: formData.get("name"),
      category: formData.get("category"),
      contactPerson: formData.get("contactPerson"),
      phone: formData.get("phone"),
      status: formData.get("status"),
      notes: formData.get("notes"),
    });
    state.activity.unshift(`${formData.get("name")} vendor record added.`);
    state.activity = state.activity.slice(0, 8);
    saveState();
    renderAll();
    event.currentTarget.reset();
    showToast("Vendor saved.");
  });

  document.getElementById("paymentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.payments.unshift({
      id: nextId("P", state.payments),
      clientName: formData.get("clientName"),
      paymentType: formData.get("paymentType"),
      amount: Number(formData.get("amount")),
      status: formData.get("status"),
      notes: formData.get("notes"),
    });
    state.activity.unshift(`${formData.get("clientName")} payment entry added.`);
    state.activity = state.activity.slice(0, 8);
    saveState();
    renderAll();
    event.currentTarget.reset();
    showToast("Payment saved.");
  });
}

function bindUtilityActions() {
  document.getElementById("quickAddBtn").addEventListener("click", () => {
    setView("bookings");
    document.querySelector('#bookingForm input[name="clientName"]').focus();
  });

  document.getElementById("heroBookingBtn").addEventListener("click", () => {
    setView("bookings");
    document.querySelector('#bookingForm input[name="clientName"]').focus();
  });

  document.getElementById("seedBtn").addEventListener("click", () => {
    state = structuredClone(seedData);
    uiState = {
      selectedBookingId: state.bookings[0]?.id || null,
      bookingFilter: "All",
      globalSearch: "",
    };
    saveState();
    resetForms();
    document.getElementById("bookingSearch").value = "";
    document.getElementById("globalSearch").value = "";
    renderAll();
    showToast("Demo data reset.");
  });
}

bindNavigation();
bindFilters();
bindForms();
bindUtilityActions();
setView("dashboard");
renderAll();
