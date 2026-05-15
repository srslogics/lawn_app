const API_BASE =
  window.location.protocol === "file:"
    ? "http://127.0.0.1:4173/api"
    : `${window.location.origin}/api`;

let state = {
  bookings: [],
  hotelBookings: [],
  enquiries: [],
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
  globalSearch: "",
  mobileNavOpen: false,
  currentView: "dashboard",
  editingBookingId: null,
  editingHotelBookingId: null,
  editingClientId: null,
  editingVendorId: null,
  editingPaymentId: null
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
      message = errorPayload.error || errorPayload.detail || message;
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
  if (!state.bookings.some((booking) => booking.id === uiState.selectedBookingId)) {
    uiState.selectedBookingId = state.bookings[0]?.id || null;
  }
}

function setView(view) {
  uiState.currentView = view;
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  document.querySelectorAll(".view").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === view);
  });

  const titleMap = {
    dashboard: "Dashboard",
    bookings: "Bookings",
    hotel: "Hotel",
    calendar: "Calendar",
    enquiries: "Enquiries",
    clients: "Clients",
    vendors: "Vendors",
    finance: "Finance",
    analytics: "Analytics",
    settings: "Venue setup"
  };

  document.getElementById("viewTitle").textContent = titleMap[view] || "Dashboard";

  if (window.innerWidth <= 760) {
    uiState.mobileNavOpen = false;
    syncMobileNav();
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: "auto"
      });
    });
  }
}

function syncMobileNav() {
  const sidebar = document.querySelector(".sidebar");
  const toggle = document.getElementById("mobileNavToggle");
  if (!sidebar || !toggle) return;

  const isDesktop = window.innerWidth > 760;
  const isOpen = isDesktop || uiState.mobileNavOpen;

  sidebar.classList.toggle("is-open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.querySelector(".mobile-nav-toggle__label").textContent = isOpen ? "Close" : "Sections";
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

function setBookingFormMode(booking = null) {
  const eyebrow = document.getElementById("bookingFormEyebrow");
  const title = document.getElementById("bookingFormTitle");
  const submit = document.getElementById("bookingFormSubmitBtn");
  const cancel = document.getElementById("cancelBookingEditBtn");

  uiState.editingBookingId = booking?.id || null;
  eyebrow.textContent = booking ? "Edit Booking" : "New Booking";
  title.textContent = booking ? `Update ${booking.clientName}` : "Create record";
  submit.textContent = booking ? "Update booking" : "Save booking";
  cancel.hidden = !booking;
}

function clearBookingForm() {
  document.getElementById("bookingForm").reset();
  setBookingFormMode();
}

function loadBookingIntoForm(booking) {
  const form = document.getElementById("bookingForm");
  if (!booking || !form) return;

  form.elements.clientName.value = booking.clientName;
  form.elements.eventType.value = booking.eventType;
  form.elements.eventDate.value = booking.eventDate;
  form.elements.guestCount.value = booking.guestCount;
  form.elements.packageName.value = booking.packageName;
  form.elements.lawnArea.value = booking.lawnArea;
  form.elements.advancePaid.value = booking.advancePaid;
  form.elements.notes.value = booking.notes || "";

  setBookingFormMode(booking);
}

function setHotelFormMode(booking = null) {
  document.getElementById("hotelFormEyebrow").textContent = booking ? "Edit Room Booking" : "New Room Booking";
  document.getElementById("hotelFormTitle").textContent = booking ? `Update ${booking.guestName}` : "Create stay record";
  document.getElementById("hotelFormSubmitBtn").textContent = booking ? "Update room booking" : "Save room booking";
  document.getElementById("cancelHotelEditBtn").hidden = !booking;
  uiState.editingHotelBookingId = booking?.id || null;
}

function clearHotelForm() {
  document.getElementById("hotelBookingForm").reset();
  setHotelFormMode();
}

function loadHotelIntoForm(booking) {
  const form = document.getElementById("hotelBookingForm");
  if (!booking || !form) return;
  form.elements.guestName.value = booking.guestName;
  form.elements.phone.value = booking.phone;
  form.elements.roomType.value = booking.roomType;
  form.elements.bookingSource.value = booking.bookingSource;
  form.elements.checkIn.value = booking.checkIn;
  form.elements.checkOut.value = booking.checkOut;
  form.elements.roomsCount.value = booking.roomsCount;
  form.elements.guestsCount.value = booking.guestsCount;
  form.elements.amount.value = booking.amount;
  form.elements.status.value = booking.status;
  form.elements.paymentStatus.value = booking.paymentStatus;
  form.elements.notes.value = booking.notes || "";
  setHotelFormMode(booking);
}

function setClientFormMode(client = null) {
  document.getElementById("clientFormEyebrow").textContent = client ? "Edit Client" : "Add Client";
  document.getElementById("clientFormTitle").textContent = client ? `Update ${client.name}` : "New CRM record";
  document.getElementById("clientFormSubmitBtn").textContent = client ? "Update client" : "Save client";
  document.getElementById("cancelClientEditBtn").hidden = !client;
  uiState.editingClientId = client?.id || null;
}

function clearClientForm() {
  document.getElementById("clientForm").reset();
  setClientFormMode();
}

function loadClientIntoForm(client) {
  const form = document.getElementById("clientForm");
  if (!client || !form) return;
  form.elements.name.value = client.name;
  form.elements.phone.value = client.phone;
  form.elements.email.value = client.email;
  form.elements.stage.value = client.stage;
  form.elements.preferences.value = client.preferences || "";
  setClientFormMode(client);
}

function setVendorFormMode(vendor = null) {
  document.getElementById("vendorFormEyebrow").textContent = vendor ? "Edit Vendor" : "Add Vendor";
  document.getElementById("vendorFormTitle").textContent = vendor ? `Update ${vendor.name}` : "Partner record";
  document.getElementById("vendorFormSubmitBtn").textContent = vendor ? "Update vendor" : "Save vendor";
  document.getElementById("cancelVendorEditBtn").hidden = !vendor;
  uiState.editingVendorId = vendor?.id || null;
}

function clearVendorForm() {
  document.getElementById("vendorForm").reset();
  setVendorFormMode();
}

function loadVendorIntoForm(vendor) {
  const form = document.getElementById("vendorForm");
  if (!vendor || !form) return;
  form.elements.name.value = vendor.name;
  form.elements.category.value = vendor.category;
  form.elements.contactPerson.value = vendor.contactPerson;
  form.elements.phone.value = vendor.phone;
  form.elements.status.value = vendor.status;
  form.elements.notes.value = vendor.notes || "";
  setVendorFormMode(vendor);
}

function setPaymentFormMode(payment = null) {
  document.getElementById("paymentFormEyebrow").textContent = payment ? "Edit Payment" : "Add Payment";
  document.getElementById("paymentFormTitle").textContent = payment ? `Update ${payment.clientName}` : "Finance entry";
  document.getElementById("paymentFormSubmitBtn").textContent = payment ? "Update payment" : "Save payment";
  document.getElementById("cancelPaymentEditBtn").hidden = !payment;
  uiState.editingPaymentId = payment?.id || null;
}

function clearPaymentForm() {
  document.getElementById("paymentForm").reset();
  setPaymentFormMode();
}

function loadPaymentIntoForm(payment) {
  const form = document.getElementById("paymentForm");
  if (!payment || !form) return;
  form.elements.clientName.value = payment.clientName;
  form.elements.paymentType.value = payment.paymentType;
  form.elements.amount.value = payment.amount;
  form.elements.status.value = payment.status;
  form.elements.notes.value = payment.notes || "";
  setPaymentFormMode(payment);
}

function renderSidebarCard() {
  const metrics = state.dashboard?.metrics;
  const remindersCount = metrics?.remindersCount || 0;
  document.getElementById("sidebarCard").innerHTML = `
    <p class="eyebrow">Today on site</p>
    <strong>${metrics?.confirmedEvents || 0} confirmed event${metrics?.confirmedEvents === 1 ? "" : "s"} · ${metrics?.roomsReserved || 0} room${metrics?.roomsReserved === 1 ? "" : "s"} reserved</strong>
    <span>${money(metrics?.pendingCollections || 0)} still pending in collections across live records${remindersCount ? ` · ${remindersCount} reminder${remindersCount === 1 ? "" : "s"} open` : ""}.</span>
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
    },
    {
      label: "Rooms reserved",
      value: metrics.roomsReserved || 0,
      detail: `${metrics.hotelReservations || 0} live hotel booking record${metrics.hotelReservations === 1 ? "" : "s"}`
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

function renderReminders() {
  const reminders = state.dashboard?.reminders || [];
  const container = document.getElementById("remindersList");
  if (!container) return;

  container.innerHTML =
    reminders
      .map(
        (reminder) => `
          <article class="mini-item">
            <strong>${reminder.title}</strong>
            <p>${reminder.detail}</p>
            <div class="inline-actions">
              <span class="status-pill status-${safeStatusClass(reminder.priority)}">${reminder.priority}</span>
              <button class="row-action" type="button" data-reminder-view="${reminder.actionView}">${reminder.actionLabel}</button>
            </div>
          </article>
        `
      )
      .join("") || `<div class="empty-state">No automatic reminders right now.</div>`;

  container.querySelectorAll("[data-reminder-view]").forEach((button) => {
    button.addEventListener("click", () => {
      setView(button.dataset.reminderView);
    });
  });
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
  document.getElementById("activityList").innerHTML =
    state.activity
      .map(
        (item) => `
          <article class="mini-item">
            <strong>Activity</strong>
            <p>${item}</p>
          </article>
        `
      )
      .join("") || `<div class="empty-state">No recent activity yet.</div>`;
}

function renderBookingsTable() {
  const bookings = getFilteredBookings();
  const selected = getSelectedBooking();

  document.getElementById("bookingsTableBody").innerHTML =
    bookings
      .map(
        (booking) => `
          <tr class="table-row ${selected?.id === booking.id ? "active" : ""}" data-booking-id="${booking.id}">
            <td data-label="Booking">
              <div class="table-primary">${booking.clientName}</div>
              <div class="table-secondary">${booking.eventType} · ${booking.lawnArea} · ${booking.id}</div>
            </td>
            <td data-label="Date">${booking.eventDate}</td>
            <td data-label="Guests">${booking.guestCount}</td>
            <td data-label="Package">${booking.packageName}</td>
            <td data-label="Advance">${money(Number(booking.advancePaid))}</td>
            <td data-label="Status"><span class="status-pill status-${safeStatusClass(booking.status)}">${booking.status}</span></td>
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

      <div class="detail-intro">
        <strong>${booking.packageName}</strong>
        <span>${booking.lawnArea}</span>
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
        <button class="row-action" data-add-payment="true">Add payment</button>
        <button class="row-action" data-edit-booking="true">Edit booking</button>
        <button class="row-action" data-status-action="Inquiry">Mark Inquiry</button>
        <button class="row-action" data-status-action="Upcoming">Mark Upcoming</button>
        <button class="row-action" data-status-action="Confirmed">Mark Confirmed</button>
        <button class="row-action row-action--danger" data-delete-booking="true">Delete booking</button>
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

  detail.querySelector('[data-edit-booking="true"]')?.addEventListener("click", () => {
    loadBookingIntoForm(booking);
    document.querySelector('#bookingForm input[name="clientName"]')?.focus();
    if (window.innerWidth <= 1260) {
      document.getElementById("bookingForm")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });

  detail.querySelector('[data-add-payment="true"]')?.addEventListener("click", () => {
    clearPaymentForm();
    const form = document.getElementById("paymentForm");
    form.elements.clientName.value = booking.clientName;
    form.elements.paymentType.value = "Advance";
    form.elements.amount.value = booking.advancePaid || "";
    form.elements.status.value = "Received";
    form.elements.notes.value = `${booking.eventType} · ${booking.eventDate} · ${booking.lawnArea}`;
    setView("finance");
    document.querySelector('#paymentForm input[name="amount"]')?.focus();
    showToast("Payment form prepared from booking.");
  });

  detail.querySelector('[data-delete-booking="true"]')?.addEventListener("click", async () => {
    const confirmed = window.confirm(
      `Delete ${booking.clientName}'s booking on ${booking.eventDate}? This removes the booking record from the application.`
    );
    if (!confirmed) return;

    try {
      await api(`/bookings/${booking.id}`, {
        method: "DELETE"
      });
      uiState.selectedBookingId = null;
      if (uiState.editingBookingId === booking.id) {
        clearBookingForm();
      }
      await refreshState();
      showToast("Booking deleted.");
    } catch (error) {
      showToast(error.message);
    }
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
            <td class="table-primary" data-label="Name">${client.name}</td>
            <td data-label="Phone">${client.phone}</td>
            <td data-label="Email">${client.email}</td>
            <td data-label="Stage"><span class="status-pill status-${safeStatusClass(client.stage)}">${client.stage}</span></td>
            <td data-label="Preferences">${client.preferences}</td>
            <td data-label="Actions">
              <div class="inline-actions">
                <button class="row-action" type="button" data-edit-client="${client.id}">Edit</button>
                <button class="row-action row-action--danger" type="button" data-delete-client="${client.id}">Delete</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("") || `
        <tr>
          <td colspan="6"><div class="empty-state">No client records match the search.</div></td>
        </tr>
      `;

  document.querySelectorAll("[data-edit-client]").forEach((button) => {
    button.addEventListener("click", () => {
      const client = state.clients.find((item) => item.id === button.dataset.editClient);
      loadClientIntoForm(client);
      setView("clients");
      document.querySelector('#clientForm input[name="name"]')?.focus();
    });
  });

  document.querySelectorAll("[data-delete-client]").forEach((button) => {
    button.addEventListener("click", async () => {
      const client = state.clients.find((item) => item.id === button.dataset.deleteClient);
      if (!client) return;
      const confirmed = window.confirm(`Delete ${client.name}'s client record?`);
      if (!confirmed) return;
      try {
        await api(`/clients/${client.id}`, { method: "DELETE" });
        if (uiState.editingClientId === client.id) clearClientForm();
        await refreshState();
        showToast("Client deleted.");
      } catch (error) {
        showToast(error.message);
      }
    });
  });
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
            <td data-label="Vendor">
              <div class="table-primary">${vendor.name}</div>
              <div class="table-secondary">${vendor.notes}</div>
            </td>
            <td data-label="Category">${vendor.category}</td>
            <td data-label="Contact">${vendor.contactPerson}</td>
            <td data-label="Phone">${vendor.phone}</td>
            <td data-label="Status"><span class="status-pill status-${safeStatusClass(vendor.status)}">${vendor.status}</span></td>
            <td data-label="Actions">
              <div class="inline-actions">
                <button class="row-action" type="button" data-edit-vendor="${vendor.id}">Edit</button>
                <button class="row-action row-action--danger" type="button" data-delete-vendor="${vendor.id}">Delete</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("") || `
        <tr>
          <td colspan="6"><div class="empty-state">No vendor records match the search.</div></td>
        </tr>
      `;

  document.querySelectorAll("[data-edit-vendor]").forEach((button) => {
    button.addEventListener("click", () => {
      const vendor = state.vendors.find((item) => item.id === button.dataset.editVendor);
      loadVendorIntoForm(vendor);
      setView("vendors");
      document.querySelector('#vendorForm input[name="name"]')?.focus();
    });
  });

  document.querySelectorAll("[data-delete-vendor]").forEach((button) => {
    button.addEventListener("click", async () => {
      const vendor = state.vendors.find((item) => item.id === button.dataset.deleteVendor);
      if (!vendor) return;
      const confirmed = window.confirm(`Delete ${vendor.name} from the vendor directory?`);
      if (!confirmed) return;
      try {
        await api(`/vendors/${vendor.id}`, { method: "DELETE" });
        if (uiState.editingVendorId === vendor.id) clearVendorForm();
        await refreshState();
        showToast("Vendor deleted.");
      } catch (error) {
        showToast(error.message);
      }
    });
  });
}

function renderPaymentsTable() {
  const rows = [
    ...state.payments.map((payment) => ({
      kind: "venue",
      id: payment.id,
      clientName: payment.clientName,
      paymentType: payment.paymentType,
      amount: payment.amount,
      status: payment.status,
      notes: payment.notes
    })),
    ...state.hotelBookings.map((booking) => ({
      kind: "hotel",
      clientName: booking.guestName,
      paymentType: `Hotel Stay · ${booking.roomType}`,
      amount: booking.amount,
      status: booking.paymentStatus,
      notes: `${booking.roomsCount} room(s) · ${booking.checkIn} to ${booking.checkOut}`
    }))
  ].filter((payment) => {
    if (!uiState.globalSearch) return true;
    return matchGlobalSearch(`${payment.clientName} ${payment.paymentType} ${payment.notes}`);
  });

  document.getElementById("paymentsTableBody").innerHTML =
    rows
      .map(
        (payment) => `
          <tr>
            <td class="table-primary" data-label="Client">${payment.clientName}</td>
            <td data-label="Type">${payment.paymentType}</td>
            <td data-label="Amount">${money(Number(payment.amount))}</td>
            <td data-label="Status"><span class="status-pill status-${safeStatusClass(payment.status)}">${payment.status}</span></td>
            <td data-label="Notes">${payment.kind === "hotel" ? `${payment.notes} · Hotel collection` : payment.notes}</td>
            <td data-label="Actions">
              ${
                payment.kind === "venue"
                  ? `<div class="inline-actions">
                      <button class="row-action" type="button" data-edit-payment="${payment.id}">Edit</button>
                      <button class="row-action row-action--danger" type="button" data-delete-payment="${payment.id}">Delete</button>
                    </div>`
                  : `<span class="table-note">Manage in hotel</span>`
              }
            </td>
          </tr>
        `
      )
      .join("") || `
        <tr>
          <td colspan="6"><div class="empty-state">No payment records match the search.</div></td>
        </tr>
      `;

  document.querySelectorAll("[data-edit-payment]").forEach((button) => {
    button.addEventListener("click", () => {
      const payment = state.payments.find((item) => item.id === button.dataset.editPayment);
      loadPaymentIntoForm(payment);
      setView("finance");
      document.querySelector('#paymentForm input[name="clientName"]')?.focus();
    });
  });

  document.querySelectorAll("[data-delete-payment]").forEach((button) => {
    button.addEventListener("click", async () => {
      const payment = state.payments.find((item) => item.id === button.dataset.deletePayment);
      if (!payment) return;
      const confirmed = window.confirm(`Delete the payment entry for ${payment.clientName}?`);
      if (!confirmed) return;
      try {
        await api(`/payments/${payment.id}`, { method: "DELETE" });
        if (uiState.editingPaymentId === payment.id) clearPaymentForm();
        await refreshState();
        showToast("Payment deleted.");
      } catch (error) {
        showToast(error.message);
      }
    });
  });
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

function renderEnquiriesTable() {
  const rows = (state.enquiries || []).filter((enquiry) => {
    if (!uiState.globalSearch) return true;
    return matchGlobalSearch(
      `${enquiry.name} ${enquiry.phone} ${enquiry.email} ${enquiry.eventType} ${enquiry.message}`
    );
  });

  document.getElementById("enquiriesTableBody").innerHTML =
    rows
      .map(
        (enquiry) => `
          <tr>
            <td data-label="Lead">
              <div class="table-primary">${enquiry.name}</div>
              <div class="table-secondary">${enquiry.phone} · ${enquiry.email}</div>
            </td>
            <td data-label="Event">${enquiry.eventType}</td>
            <td data-label="Date">${enquiry.eventDate}</td>
            <td data-label="Guests">${enquiry.guestCount}</td>
            <td data-label="Budget">${money(Number(enquiry.budget))}</td>
            <td data-label="Stay">${enquiry.stayRequired === "Yes" ? `${enquiry.roomsNeeded || 0} room(s)` : "No stay"}</td>
            <td data-label="Status"><span class="status-pill status-${safeStatusClass(enquiry.status)}">${enquiry.status}</span></td>
            <td data-label="Actions">
              <div class="inline-actions">
                <button class="row-action" type="button" data-enquiry-client="${enquiry.id}">Create client</button>
                <button class="row-action" type="button" data-enquiry-booking="${enquiry.id}">Use for booking</button>
                <button class="row-action" type="button" data-enquiry-status="${enquiry.id}" data-next-status="Contacted">Contacted</button>
                <button class="row-action row-action--danger" type="button" data-delete-enquiry="${enquiry.id}">Delete</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("") || `
        <tr>
          <td colspan="8"><div class="empty-state">No website enquiries yet.</div></td>
        </tr>
      `;

  document.getElementById("enquiriesSummary").innerHTML =
    rows
      .slice(0, 6)
      .map(
        (enquiry) => `
          <article class="mini-item">
            <strong>${enquiry.name} · ${enquiry.eventType}</strong>
            <p>${enquiry.message || "No extra notes shared."}</p>
          </article>
        `
      )
      .join("") || `<div class="empty-state">No enquiry notes yet.</div>`;

  document.querySelectorAll("[data-enquiry-client]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const result = await api(`/enquiries/${button.dataset.enquiryClient}/convert-client`, {
          method: "POST"
        });
        await refreshState();
        showToast(`${result.client.name} is ready in CRM.`);
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  document.querySelectorAll("[data-enquiry-booking]").forEach((button) => {
    button.addEventListener("click", async () => {
      const enquiry = state.enquiries.find((item) => String(item.id) === button.dataset.enquiryBooking);
      if (!enquiry) return;

      clearBookingForm();
      const form = document.getElementById("bookingForm");
      form.elements.clientName.value = enquiry.name;
      form.elements.eventType.value =
        Array.from(form.elements.eventType.options).some((option) => option.value === enquiry.eventType)
          ? enquiry.eventType
          : "Wedding";
      form.elements.eventDate.value = enquiry.eventDate;
      form.elements.guestCount.value = enquiry.guestCount;
      form.elements.packageName.value = enquiry.eventType === "Corporate" ? "Custom Luxury" : "Gold";
      form.elements.advancePaid.value = 0;
      form.elements.notes.value = `${enquiry.message || "Converted from website enquiry."} Budget: ${money(Number(enquiry.budget))}`;

      try {
        await api(`/enquiries/${enquiry.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "Contacted" })
        });
        await refreshState();
      } catch {
        // Keep prefill even if status patch fails.
      }

      setView("bookings");
      document.querySelector('#bookingForm input[name="clientName"]')?.focus();
      showToast("Booking form prepared from enquiry.");
    });
  });

  document.querySelectorAll("[data-enquiry-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/enquiries/${button.dataset.enquiryStatus}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: button.dataset.nextStatus })
        });
        await refreshState();
        showToast(`Enquiry marked ${button.dataset.nextStatus}.`);
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  document.querySelectorAll("[data-delete-enquiry]").forEach((button) => {
    button.addEventListener("click", async () => {
      const enquiry = state.enquiries.find((item) => String(item.id) === button.dataset.deleteEnquiry);
      if (!enquiry) return;
      const confirmed = window.confirm(`Delete the enquiry from ${enquiry.name}?`);
      if (!confirmed) return;
      try {
        await api(`/enquiries/${enquiry.id}`, { method: "DELETE" });
        await refreshState();
        showToast("Enquiry deleted.");
      } catch (error) {
        showToast(error.message);
      }
    });
  });
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

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function sumBy(items, valueFn) {
  return items.reduce((sum, item) => sum + Number(valueFn(item) || 0), 0);
}

function averageBy(items, valueFn) {
  if (!items.length) return 0;
  return sumBy(items, valueFn) / items.length;
}

function parseDateValue(value) {
  return new Date(`${value}T00:00:00`);
}

function daysBetween(start, end) {
  const diff = parseDateValue(end) - parseDateValue(start);
  return Math.max(1, Math.round(diff / 86400000));
}

function buildBarChart(groups, valueLabel, emptyText = "No analytics data yet.") {
  const entries = Object.entries(groups);
  if (!entries.length) {
    return `<div class="empty-state">${emptyText}</div>`;
  }

  const maxValue = Math.max(...entries.map(([, value]) => Number(value)));
  return `
    <div class="bar-chart">
      ${entries
        .map(
          ([label, value]) => `
            <article class="bar-row">
              <div class="bar-row__meta">
                <strong>${label}</strong>
                <span>${valueLabel(value)}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${maxValue ? (Number(value) / maxValue) * 100 : 0}%"></div>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderAnalytics() {
  const bookings = state.bookings || [];
  const hotelBookings = state.hotelBookings || [];
  const payments = state.payments || [];
  const metrics = state.dashboard?.metrics || {};

  const venueReceived = sumBy(payments.filter((payment) => payment.status === "Received"), (payment) => payment.amount);
  const venuePending = sumBy(payments.filter((payment) => payment.status === "Pending"), (payment) => payment.amount);
  const hotelReceived = sumBy(
    hotelBookings.filter((booking) => booking.paymentStatus === "Received"),
    (booking) => booking.amount
  );
  const hotelPending = sumBy(
    hotelBookings.filter((booking) => booking.paymentStatus === "Pending"),
    (booking) => booking.amount
  );
  const combinedTrackedValue = venueReceived + venuePending + hotelReceived + hotelPending;
  const averageGuests = Math.round(averageBy(bookings, (booking) => booking.guestCount));
  const averageStayNights = averageBy(hotelBookings, (booking) =>
    daysBetween(booking.checkIn, booking.checkOut)
  );
  const hotelRoomInventory = 40;
  const roomsReserved = metrics.roomsReserved || 0;
  const roomOccupancyPressure = hotelRoomInventory
    ? Math.min(100, Math.round((roomsReserved / hotelRoomInventory) * 100))
    : 0;

  document.getElementById("analyticsKpiGrid").innerHTML = [
    {
      label: "Combined tracked value",
      value: money(combinedTrackedValue),
      detail: "Venue payments plus hotel stay collections"
    },
    {
      label: "Average event size",
      value: averageGuests || 0,
      detail: "Average guest count across booking records"
    },
    {
      label: "Average stay length",
      value: `${averageStayNights ? averageStayNights.toFixed(1) : "0.0"} night${averageStayNights === 1 ? "" : "s"}`,
      detail: "Average hotel stay duration"
    },
    {
      label: "Room pressure",
      value: `${roomOccupancyPressure}%`,
      detail: `${roomsReserved}/${hotelRoomInventory} rooms currently reserved`
    },
    {
      label: "Pending collections",
      value: money(metrics.pendingCollections || 0),
      detail: "Outstanding venue and hotel collections"
    },
    {
      label: "Received collections",
      value: money(metrics.paymentsReceived || 0),
      detail: "Realized venue and hotel collections"
    }
  ]
    .map(
      (item) => `
        <article class="analytics-kpi">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
          <small>${item.detail}</small>
        </article>
      `
    )
    .join("");

  document.getElementById("analyticsRevenueMix").innerHTML = buildBarChart(
    {
      "Venue received": venueReceived,
      "Venue pending": venuePending,
      "Hotel received": hotelReceived,
      "Hotel pending": hotelPending
    },
    (value) => money(value),
    "No revenue mix data yet."
  );

  document.getElementById("analyticsEventMix").innerHTML = buildBarChart(
    countBy(bookings, (booking) => booking.eventType),
    (value) => `${value} booking${value === 1 ? "" : "s"}`,
    "No event mix data yet."
  );

  document.getElementById("analyticsLawnMix").innerHTML = buildBarChart(
    countBy(bookings, (booking) => booking.lawnArea),
    (value) => `${value} event${value === 1 ? "" : "s"}`,
    "No lawn utilization data yet."
  );

  document.getElementById("analyticsPackageMix").innerHTML = buildBarChart(
    countBy(bookings, (booking) => booking.packageName),
    (value) => `${value} booking${value === 1 ? "" : "s"}`,
    "No package demand data yet."
  );

  document.getElementById("analyticsRoomTypeMix").innerHTML = buildBarChart(
    hotelBookings.reduce((acc, booking) => {
      acc[booking.roomType] = (acc[booking.roomType] || 0) + Number(booking.roomsCount || 0);
      return acc;
    }, {}),
    (value) => `${value} room${value === 1 ? "" : "s"}`,
    "No room type demand data yet."
  );

  document.getElementById("analyticsHotelSourceMix").innerHTML = buildBarChart(
    countBy(hotelBookings, (booking) => booking.bookingSource),
    (value) => `${value} stay${value === 1 ? "" : "s"}`,
    "No hotel source data yet."
  );

  const today = new Date();
  const nextThirtyDays = new Date(today.getTime() + 30 * 86400000);
  const upcomingEventLoad = bookings.filter((booking) => {
    const eventDate = parseDateValue(booking.eventDate);
    return eventDate >= today && eventDate <= nextThirtyDays;
  });
  const upcomingStayLoad = hotelBookings.filter((booking) => {
    const checkIn = parseDateValue(booking.checkIn);
    return checkIn >= today && checkIn <= nextThirtyDays;
  });

  document.getElementById("analyticsLoadMix").innerHTML = buildBarChart(
    {
      "Upcoming events": upcomingEventLoad.length,
      "Upcoming hotel stays": upcomingStayLoad.length,
      "Rooms blocked next 30d": sumBy(upcomingStayLoad, (booking) => booking.roomsCount),
      "Guests hosted next 30d": sumBy(upcomingStayLoad, (booking) => booking.guestsCount)
    },
    (value) => String(value),
    "No near-term load data yet."
  );

  const monthTrend = {};
  bookings.forEach((booking) => {
    const key = booking.eventDate.slice(0, 7);
    monthTrend[`${key} · Events`] = (monthTrend[`${key} · Events`] || 0) + 1;
  });
  hotelBookings.forEach((booking) => {
    const key = booking.checkIn.slice(0, 7);
    monthTrend[`${key} · Stays`] = (monthTrend[`${key} · Stays`] || 0) + 1;
  });

  document.getElementById("analyticsMonthlyTrend").innerHTML = buildBarChart(
    monthTrend,
    (value) => `${value} record${value === 1 ? "" : "s"}`,
    "No monthly trend data yet."
  );
}

function renderHotelStats() {
  const rows = state.hotelBookings || [];
  const activeRows = rows.filter((booking) => ["Reserved", "Confirmed", "Checked In"].includes(booking.status));
  const checkedInRows = rows.filter((booking) => booking.status === "Checked In");
  const roomRevenue = rows.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);

  document.getElementById("hotelStatsGrid").innerHTML = [
    {
      label: "Live bookings",
      value: activeRows.length,
      detail: "Reserved, confirmed, and checked-in stays"
    },
    {
      label: "Rooms blocked",
      value: activeRows.reduce((sum, booking) => sum + Number(booking.roomsCount || 0), 0),
      detail: "Rooms currently tied to stay records"
    },
    {
      label: "Guests covered",
      value: activeRows.reduce((sum, booking) => sum + Number(booking.guestsCount || 0), 0),
      detail: "Estimated in-house guest count"
    },
    {
      label: "Room revenue",
      value: money(roomRevenue),
      detail: `${checkedInRows.length} booking record${checkedInRows.length === 1 ? "" : "s"} already checked in`
    }
  ]
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

function renderHotelBookingsTable() {
  const rows = state.hotelBookings.filter((booking) => {
    if (!uiState.globalSearch) return true;
    return matchGlobalSearch(
      `${booking.guestName} ${booking.roomType} ${booking.bookingSource} ${booking.notes}`
    );
  });

  document.getElementById("hotelBookingsTableBody").innerHTML =
    rows
      .map(
        (booking) => `
          <tr>
            <td data-label="Guest / block">
              <div class="table-primary">${booking.guestName}</div>
              <div class="table-secondary">${booking.phone} · ${booking.id}</div>
            </td>
            <td data-label="Stay dates">${booking.checkIn} → ${booking.checkOut}</td>
            <td data-label="Room type">${booking.roomType}</td>
            <td data-label="Rooms">${booking.roomsCount}</td>
            <td data-label="Guests">${booking.guestsCount}</td>
            <td data-label="Amount">${money(Number(booking.amount))}</td>
            <td data-label="Payment"><span class="status-pill status-${safeStatusClass(booking.paymentStatus)}">${booking.paymentStatus}</span></td>
            <td data-label="Status"><span class="status-pill status-${safeStatusClass(booking.status)}">${booking.status}</span></td>
            <td data-label="Actions">
              <div class="inline-actions">
                <button class="row-action" type="button" data-edit-hotel="${booking.id}">Edit</button>
                <button class="row-action row-action--danger" type="button" data-delete-hotel="${booking.id}">Delete</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("") || `
        <tr>
          <td colspan="9"><div class="empty-state">No hotel booking records match the search.</div></td>
        </tr>
      `;

  document.querySelectorAll("[data-edit-hotel]").forEach((button) => {
    button.addEventListener("click", () => {
      const booking = state.hotelBookings.find((item) => item.id === button.dataset.editHotel);
      loadHotelIntoForm(booking);
      setView("hotel");
      document.querySelector('#hotelBookingForm input[name="guestName"]')?.focus();
    });
  });

  document.querySelectorAll("[data-delete-hotel]").forEach((button) => {
    button.addEventListener("click", async () => {
      const booking = state.hotelBookings.find((item) => item.id === button.dataset.deleteHotel);
      if (!booking) return;
      const confirmed = window.confirm(`Delete the hotel booking for ${booking.guestName}?`);
      if (!confirmed) return;
      try {
        await api(`/hotel-bookings/${booking.id}`, { method: "DELETE" });
        if (uiState.editingHotelBookingId === booking.id) clearHotelForm();
        await refreshState();
        showToast("Hotel booking deleted.");
      } catch (error) {
        showToast(error.message);
      }
    });
  });
}

function renderHotelOverview() {
  const rows = state.hotelBookings || [];
  const nextArrivals = [...rows].sort((a, b) => a.checkIn.localeCompare(b.checkIn)).slice(0, 3);
  const checkedInRows = rows.filter((booking) => booking.status === "Checked In");
  const overview = document.getElementById("hotelOverview");

  if (!rows.length) {
    overview.innerHTML = `<div class="empty-state">No room booking records yet.</div>`;
    return;
  }

  overview.innerHTML = `
    <div class="mini-list">
      <article class="mini-item">
        <strong>Currently in house</strong>
        <p>${checkedInRows.length} stay record${checkedInRows.length === 1 ? "" : "s"} checked in covering ${checkedInRows.reduce((sum, booking) => sum + Number(booking.guestsCount || 0), 0)} guest${checkedInRows.reduce((sum, booking) => sum + Number(booking.guestsCount || 0), 0) === 1 ? "" : "s"}.</p>
      </article>
      <article class="mini-item">
        <strong>Upcoming arrivals</strong>
        <p>${nextArrivals.map((booking) => `${booking.guestName} · ${booking.checkIn}`).join(" · ")}</p>
      </article>
      <article class="mini-item">
        <strong>Room mix</strong>
        <p>${[...new Set(rows.map((booking) => booking.roomType))].join(" · ")}</p>
      </article>
      <article class="mini-item">
        <strong>Collection split</strong>
        <p>${rows.filter((booking) => booking.paymentStatus === "Pending").length} pending · ${rows.filter((booking) => booking.paymentStatus === "Received").length} received</p>
      </article>
    </div>
  `;
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
  renderReminders();
  renderTasks();
  renderCollectionsSummary();
  renderActivity();
  renderFilterState();
  renderBookingsTable();
  renderBookingDetail();
  renderHotelStats();
  renderHotelBookingsTable();
  renderHotelOverview();
  renderClientsTable();
  renderVendorsTable();
  renderPaymentsTable();
  renderCalendar();
  renderEnquiriesTable();
  renderAnalytics();
  renderRequirements();
}

async function refreshState() {
  await loadBootstrap();
  renderAll();
}

function resetForms() {
  clearBookingForm();
  clearClientForm();
  clearVendorForm();
  clearPaymentForm();
  clearHotelForm();
}

function bindNavigation() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.querySelectorAll("[data-goto]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.goto));
  });

  document.getElementById("mobileNavToggle")?.addEventListener("click", () => {
    uiState.mobileNavOpen = !uiState.mobileNavOpen;
    syncMobileNav();
  });

  window.addEventListener("resize", syncMobileNav);
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
    const editingBookingId = uiState.editingBookingId;

    try {
      const booking = await api(editingBookingId ? `/bookings/${editingBookingId}` : "/bookings", {
        method: editingBookingId ? "PUT" : "POST",
        body: JSON.stringify({
          clientName: formData.get("clientName"),
          eventType: formData.get("eventType"),
          eventDate: formData.get("eventDate"),
          guestCount: Number(formData.get("guestCount")),
          packageName: formData.get("packageName"),
          lawnArea: formData.get("lawnArea"),
          advancePaid: Number(formData.get("advancePaid")),
          notes: formData.get("notes")
        })
      });

      uiState.selectedBookingId = booking.id;
      await refreshState();
      clearBookingForm();
      showToast(editingBookingId ? "Booking updated." : "Booking saved.");
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById("clientForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const editingClientId = uiState.editingClientId;

    try {
      await api(editingClientId ? `/clients/${editingClientId}` : "/clients", {
        method: editingClientId ? "PUT" : "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          stage: formData.get("stage"),
          preferences: formData.get("preferences")
        })
      });

      await refreshState();
      clearClientForm();
      showToast(editingClientId ? "Client updated." : "Client saved.");
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById("vendorForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const editingVendorId = uiState.editingVendorId;

    try {
      await api(editingVendorId ? `/vendors/${editingVendorId}` : "/vendors", {
        method: editingVendorId ? "PUT" : "POST",
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
      clearVendorForm();
      showToast(editingVendorId ? "Vendor updated." : "Vendor saved.");
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById("paymentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const editingPaymentId = uiState.editingPaymentId;

    try {
      await api(editingPaymentId ? `/payments/${editingPaymentId}` : "/payments", {
        method: editingPaymentId ? "PUT" : "POST",
        body: JSON.stringify({
          clientName: formData.get("clientName"),
          paymentType: formData.get("paymentType"),
          amount: Number(formData.get("amount")),
          status: formData.get("status"),
          notes: formData.get("notes")
        })
      });

      await refreshState();
      clearPaymentForm();
      showToast(editingPaymentId ? "Payment updated." : "Payment saved.");
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById("hotelBookingForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const editingHotelBookingId = uiState.editingHotelBookingId;

    try {
      await api(editingHotelBookingId ? `/hotel-bookings/${editingHotelBookingId}` : "/hotel-bookings", {
        method: editingHotelBookingId ? "PUT" : "POST",
        body: JSON.stringify({
          guestName: formData.get("guestName"),
          phone: formData.get("phone"),
          roomType: formData.get("roomType"),
          checkIn: formData.get("checkIn"),
          checkOut: formData.get("checkOut"),
          roomsCount: Number(formData.get("roomsCount")),
          guestsCount: Number(formData.get("guestsCount")),
          amount: Number(formData.get("amount")),
          bookingSource: formData.get("bookingSource"),
          status: formData.get("status"),
          paymentStatus: formData.get("paymentStatus"),
          notes: formData.get("notes")
        })
      });

      await refreshState();
      clearHotelForm();
      showToast(editingHotelBookingId ? "Room booking updated." : "Room booking saved.");
    } catch (error) {
      showToast(error.message);
    }
  });
}

function bindUtilityActions() {
  document.getElementById("quickAddBtn").addEventListener("click", () => {
    setView("bookings");
    clearBookingForm();
    document.querySelector('#bookingForm input[name="clientName"]').focus();
  });

  document.getElementById("heroBookingBtn").addEventListener("click", () => {
    setView("bookings");
    clearBookingForm();
    document.querySelector('#bookingForm input[name="clientName"]').focus();
  });

  document.getElementById("focusBookingFormBtn")?.addEventListener("click", () => {
    clearBookingForm();
    document.querySelector('#bookingForm input[name="clientName"]')?.focus();
    if (window.innerWidth <= 1260) {
      document.getElementById("bookingForm")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });

  document.getElementById("cancelBookingEditBtn")?.addEventListener("click", () => {
    clearBookingForm();
    showToast("Edit cancelled.");
  });

  document.getElementById("cancelHotelEditBtn")?.addEventListener("click", () => {
    clearHotelForm();
    showToast("Edit cancelled.");
  });

  document.getElementById("cancelClientEditBtn")?.addEventListener("click", () => {
    clearClientForm();
    showToast("Edit cancelled.");
  });

  document.getElementById("cancelVendorEditBtn")?.addEventListener("click", () => {
    clearVendorForm();
    showToast("Edit cancelled.");
  });

  document.getElementById("cancelPaymentEditBtn")?.addEventListener("click", () => {
    clearPaymentForm();
    showToast("Edit cancelled.");
  });

}

async function init() {
  try {
    bindNavigation();
    bindFilters();
    bindForms();
    bindUtilityActions();
    syncMobileNav();
    setView("dashboard");
    await refreshState();
  } catch (error) {
    showToast(`Startup failed: ${error.message}`);
    document.getElementById("todayList").innerHTML =
      `<div class="empty-state">The app could not reach the backend. Start the server on 127.0.0.1:4173 and reload.</div>`;
  }
}

init();
