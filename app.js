const API_BASE = "/api";

let state = {
  bookings: [],
  clients: [],
  vendors: [],
  payments: [],
  tasks: [],
  requirements: [],
  activity: [],
  dashboard: null
};

let uiState = {
  selectedBookingId: null,
  bookingFilter: "All",
  globalSearch: ""
};

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function safeStatusClass(status) {
  return String(status).toLowerCase().replace(/\s+/g, "-");
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
      const errorPayload = await response.json();
      message = errorPayload.error || message;
    } catch {
      // ignore parse failure
    }
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function loadBootstrap() {
  state = await api("/bootstrap");
  uiState.selectedBookingId = state.bookings[0]?.id || null;
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
    settings: "Venue setup"
  };

  document.getElementById("viewTitle").textContent = titleMap[view] || "Dashboard";

  if (window.innerWidth <= 760) {
    document.querySelector(".main-content")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function matchGlobalSearch(text) {
  return String(text).toLowerCase().includes(uiState.globalSearch.trim().toLowerCase());
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
        `${booking.clientName} ${booking.eventType} ${booking.packageName} ${booking.notes}`
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
  const metrics = state.dashboard?.metrics;
  document.getElementById("sidebarCard").innerHTML = `
    <p class="eyebrow">Today on site</p>
    <strong>${metrics?.confirmedEvents || 0} confirmed event${metrics?.confirmedEvents === 1 ? "" : "s"}</strong>
    <span>${money(metrics?.pendingCollections || 0)} still pending in collections across live records.</span>
  `;
}

function renderStats() {
  const metrics = state.dashboard?.metrics || {};
  const stats = [
    {
      label: "Total bookings",
      value: metrics.totalBookings || 0,
      detail: "All inquiry and confirmed booking records"
    },
    {
      label: "Open inquiries",
      value: metrics.openInquiries || 0,
      detail: "Leads that still need conversion follow-up"
    },
    {
      label: "Upcoming events",
      value: metrics.upcomingEvents || 0,
      detail: "Confirmed execution work scheduled next"
    },
    {
      label: "Payments received",
      value: money(metrics.paymentsReceived || 0),
      detail: "Tracked from token to final balance entries"
    }
  ];

  document.getElementById("statsGrid").innerHTML = stats
    .map(
      (stat) => `
        <article class="stat-card">
          <span>${stat.label}</span>
          <strong>${stat.value}</strong>
          <small>${stat.detail}</small>
        </article>
      `
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
  const todayBookings = state.dashboard?.todayBookings || [];
  document.getElementById("todayList").innerHTML =
    todayBookings
      .map((booking) =>
        detailCard(
          `${booking.clientName} • ${booking.eventType}`,
          `${booking.eventDate} · ${booking.guestCount} guests · ${booking.manager} managing`,
          booking.status,
          [booking.packageName, booking.lawnArea, money(Number(booking.advancePaid))]
        )
      )
      .join("") || `<div class="empty-state">No booking records yet.</div>`;
}

function renderTasks() {
  document.getElementById("tasksList").innerHTML =
    state.tasks
      .map((task) => detailCard(task.title, `${task.owner} · ${task.due}`, task.status, [task.id]))
      .join("") || `<div class="empty-state">No tasks yet.</div>`;
}

function renderCollectionsSummary() {
  const metrics = state.dashboard?.metrics || {};
  const pendingPayments = state.dashboard?.pendingPayments || [];

  const financeMarkup = `
    <span>Collection summary</span>
    <strong>${money(metrics.paymentsReceived || 0)}</strong>
    <p>${money(metrics.pendingCollections || 0)} still pending across ${pendingPayments.length} payment record${pendingPayments.length === 1 ? "" : "s"}.</p>
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
        `
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
      `
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
        `
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
    button.addEventListener("click", async () => {
      try {
        await api(`/bookings/${booking.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: button.dataset.statusAction })
        });
        await refreshState();
        showToast(`Booking marked ${button.dataset.statusAction}.`);
      } catch (error) {
        showToast(error.message);
      }
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
        `
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
        `
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
        `
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
                `
              )
              .join("")}
          </article>
        `
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
      `
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

async function refreshState() {
  const selectedBefore = uiState.selectedBookingId;
  await loadBootstrap();
  uiState.selectedBookingId = selectedBefore || state.bookings[0]?.id || null;
  renderAll();
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
  document.getElementById("bookingForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      const booking = await api("/bookings", {
        method: "POST",
        body: JSON.stringify({
          clientName: formData.get("clientName"),
          eventType: formData.get("eventType"),
          eventDate: formData.get("eventDate"),
          guestCount: Number(formData.get("guestCount")),
          packageName: formData.get("packageName"),
          advancePaid: Number(formData.get("advancePaid")),
          notes: formData.get("notes")
        })
      });

      uiState.selectedBookingId = booking.id;
      await refreshState();
      event.currentTarget.reset();
      showToast("Booking saved.");
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById("clientForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      await api("/clients", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          stage: formData.get("stage"),
          preferences: formData.get("preferences")
        })
      });

      await refreshState();
      event.currentTarget.reset();
      showToast("Client saved.");
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById("vendorForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      await api("/vendors", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          category: formData.get("category"),
          contactPerson: formData.get("contactPerson"),
          phone: formData.get("phone"),
          status: formData.get("status"),
          notes: formData.get("notes")
        })
      });

      await refreshState();
      event.currentTarget.reset();
      showToast("Vendor saved.");
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById("paymentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      await api("/payments", {
        method: "POST",
        body: JSON.stringify({
          clientName: formData.get("clientName"),
          paymentType: formData.get("paymentType"),
          amount: Number(formData.get("amount")),
          status: formData.get("status"),
          notes: formData.get("notes")
        })
      });

      await refreshState();
      event.currentTarget.reset();
      showToast("Payment saved.");
    } catch (error) {
      showToast(error.message);
    }
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

  document.getElementById("seedBtn").addEventListener("click", async () => {
    try {
      await api("/reset", { method: "POST" });
      uiState = {
        selectedBookingId: null,
        bookingFilter: "All",
        globalSearch: ""
      };
      resetForms();
      document.getElementById("bookingSearch").value = "";
      document.getElementById("globalSearch").value = "";
      await refreshState();
      showToast("Demo data reset.");
    } catch (error) {
      showToast(error.message);
    }
  });
}

async function init() {
  try {
    bindNavigation();
    bindFilters();
    bindForms();
    bindUtilityActions();
    setView("dashboard");
    await refreshState();
  } catch (error) {
    showToast(`Startup failed: ${error.message}`);
  }
}

init();
